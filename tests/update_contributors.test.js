const assert = require('node:assert/strict');
const test = require('node:test');

const {
  fetchContributors,
  renderAvatars,
  renderContributorBlock,
  updateReadmes,
} = require('../scripts/update_contributors');

function author(id, login, contributions = 1, type = 'User') {
  return {
    id,
    login,
    contributions,
    type,
    html_url: `https://github.com/${login}`,
    avatar_url: `https://avatars.githubusercontent.com/u/${id}?v=4`,
  };
}

test('fetchContributors merges statistics, excludes bots, and sorts deterministically', async () => {
  const requests = [];
  const github = {
    request: async (route) => {
      requests.push(route);
      if (route.includes('/stats/')) {
        return {
          status: 200,
          data: [
            {author: author(3, 'new-user'), total: 1},
            {author: author(2, 'beta'), total: 2},
          ],
        };
      }
      return {
        status: 200,
        data: [
          author(1, 'Alpha', 3),
          author(2, 'beta', 5),
          author(4, 'github-actions[bot]', 100, 'Bot'),
        ],
      };
    },
  };

  const contributors = await fetchContributors({
    github,
    context: {repo: {owner: 'owner', repo: 'repo'}},
    core: {warning: () => {}},
  });

  assert.deepEqual(
    contributors.map(({author: contributor, total}) => [contributor.login, total]),
    [
      ['beta', 5],
      ['Alpha', 3],
      ['new-user', 1],
    ],
  );
  assert.equal(requests.length, 2);
});

test('fetchContributors falls back when contributor statistics stay unavailable', async () => {
  const warnings = [];
  const github = {
    request: async (route) =>
      route.includes('/stats/')
        ? {status: 202, data: {}}
        : {status: 200, data: [author(1, 'alpha', 2)]},
  };

  const contributors = await fetchContributors({
    github,
    context: {repo: {owner: 'owner', repo: 'repo'}},
    core: {warning: (message) => warnings.push(message)},
    delay: (resolve) => resolve(),
  });

  assert.equal(contributors.length, 1);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /HTTP 202/);
});

test('renderContributorBlock replaces exactly one marked block', () => {
  const source = [
    'before',
    '<!-- contributors:start -->',
    'old',
    '<!-- contributors:end -->',
    'after',
  ].join('\n');

  assert.equal(
    renderContributorBlock(source, 'new', 'README.md'),
    [
      'before',
      '<!-- contributors:start -->',
      'new',
      '<!-- contributors:end -->',
      'after',
    ].join('\n'),
  );
  assert.throws(
    () => renderContributorBlock('no markers', 'new', 'README.md'),
    /markers are invalid/,
  );
});

test('updateReadmes writes the same avatar block to both README files', async () => {
  const files = new Map([
    [
      'README.md',
      '<!-- contributors:start -->\nold\n<!-- contributors:end -->',
    ],
    [
      'README.cn.md',
      '<!-- contributors:start -->\nold\n<!-- contributors:end -->',
    ],
  ]);
  const infos = [];

  await updateReadmes({
    github: {
      request: async (route) =>
        route.includes('/stats/')
          ? {status: 200, data: []}
          : {status: 200, data: [author(7, 'new-user', 1)]},
    },
    context: {repo: {owner: 'owner', repo: 'repo'}},
    core: {info: (message) => infos.push(message), warning: () => {}},
    fileSystem: {
      readFileSync: (file) => files.get(file),
      writeFileSync: (file, content) => files.set(file, content),
    },
  });

  const avatar = renderAvatars([{author: author(7, 'new-user'), total: 1}]);
  assert.match(files.get('README.md'), new RegExp(avatar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(files.get('README.md'), files.get('README.cn.md'));
  assert.deepEqual(infos, ['Rendered 1 contributor avatars']);
});
