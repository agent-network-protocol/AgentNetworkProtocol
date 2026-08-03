/**
 * Synchronize contributor avatar blocks in the English and Chinese READMEs.
 *
 * Input: GitHub's contributors and contributor statistics API responses.
 * Output: Deterministic HTML between the README contributor markers.
 * Position: Shared implementation used by the contributor update workflow.
 */

const fs = require('fs');

const README_FILES = ['README.md', 'README.cn.md'];
const START_MARKER = '<!-- contributors:start -->';
const END_MARKER = '<!-- contributors:end -->';

function isVisibleContributor(author) {
  return Boolean(
    author?.login &&
      author.type !== 'Bot' &&
      !author.login.toLowerCase().endsWith('[bot]'),
  );
}

function addContributor(contributorsById, author, total) {
  if (!isVisibleContributor(author)) return;

  const previous = contributorsById.get(author.id);
  contributorsById.set(author.id, {
    author,
    total: Math.max(previous?.total ?? 0, total ?? 0),
  });
}

async function fetchContributors({github, context, core, delay = setTimeout}) {
  const contributorsById = new Map();

  for (let page = 1; ; page += 1) {
    const response = await github.request(
      'GET /repos/{owner}/{repo}/contributors',
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
        per_page: 100,
        page,
      },
    );
    if (response.status !== 200 || !Array.isArray(response.data)) {
      throw new Error(`Contributor page ${page} unavailable: HTTP ${response.status}`);
    }

    for (const contributor of response.data) {
      addContributor(
        contributorsById,
        contributor,
        contributor.contributions,
      );
    }
    if (response.data.length < 100) break;
  }

  let statsResponse;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    statsResponse = await github.request(
      'GET /repos/{owner}/{repo}/stats/contributors',
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
      },
    );
    if (statsResponse.status === 200) break;
    if (attempt < 5) {
      await new Promise((resolve) => delay(resolve, 10000));
    }
  }

  if (statsResponse?.status === 200 && Array.isArray(statsResponse.data)) {
    for (const contributor of statsResponse.data) {
      addContributor(
        contributorsById,
        contributor.author,
        contributor.total,
      );
    }
  } else {
    core.warning(
      `Contributor statistics unavailable; using the contributor list only (HTTP ${statsResponse?.status ?? 'unknown'})`,
    );
  }

  return Array.from(contributorsById.values()).sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total;
    return left.author.login
      .toLowerCase()
      .localeCompare(right.author.login.toLowerCase());
  });
}

function renderAvatars(contributors) {
  return contributors
    .map(
      ({author}) =>
        `<a href="${author.html_url}"><img src="${author.avatar_url}" width="64" height="64" alt="@${author.login}" /></a>`,
    )
    .join('\n');
}

function renderContributorBlock(source, avatars, file) {
  const start = source.indexOf(START_MARKER);
  const end = source.indexOf(END_MARKER);
  const hasDuplicateMarkers =
    source.indexOf(START_MARKER, start + START_MARKER.length) !== -1 ||
    source.indexOf(END_MARKER, end + END_MARKER.length) !== -1;

  if (start < 0 || end < 0 || end <= start || hasDuplicateMarkers) {
    throw new Error(`Contributor markers are invalid in ${file}`);
  }

  return (
    source.slice(0, start + START_MARKER.length) +
    `\n${avatars}\n` +
    source.slice(end)
  );
}

async function updateReadmes({github, context, core, fileSystem = fs}) {
  const contributors = await fetchContributors({github, context, core});
  const avatars = renderAvatars(contributors);

  for (const file of README_FILES) {
    const source = fileSystem.readFileSync(file, 'utf8');
    const updated = renderContributorBlock(source, avatars, file);
    fileSystem.writeFileSync(file, updated);
  }

  core.info(`Rendered ${contributors.length} contributor avatars`);
}

module.exports = {
  END_MARKER,
  START_MARKER,
  fetchContributors,
  renderAvatars,
  renderContributorBlock,
  updateReadmes,
};
