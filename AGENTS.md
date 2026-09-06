# Repository Guidelines

## Shared rules

Engineering work follows [AI Coding Rules](../../awiki-harness/rules/ai-coding-rules.md).
Behavior changes and verification follow the relevant [Verification Policy](../../awiki-harness/rules/verification-policy.md)
sections; production behavior needs owning unit coverage and applicable System/product E2E review.
If Harness is absent, use local docs/tests/CI and disclose missing acceptance evidence.

## Project Structure & Module Organization

- Root contains protocol specifications and white papers (e.g., `01-*.md`, `06-*.md`, `07-*.md`, `08-*.md`).
- `vnext/` and `chinese/vnext/` hold candidate drafts for core protocols 01–09.
- `docs/` and `docs/chinese/` hold guides, links, and community operations.
- `chinese/` mirrors core documents in Chinese plus research notes and process docs.
- `blogs/` and `blogs/cn/` store long-form articles; `blogs/images/` holds blog assets.
- `images/` and `standard/` provide shared figures and standards references.
- `examples/` contains sample ADP assets and API interface YAMLs.
- `scripts/` includes dependency-free Python and JavaScript utilities for repo maintenance.

## Protocol Ownership Boundary

- Profile specifications indexed by this repository belong to the ANP protocol set. Do not add an implementation-owned profile outside the `anp.*` namespace to the ANP Profile index merely because it transports ANP messages or uses ANP capability discovery.
- Vendor or product-private protocols, fixtures, storage limits, client scheduling rules, and UI watchdogs stay in the owning product repository. ANP documents may describe the generic extension mechanism without adopting a private profile as an ANP specification.

## Build, Test, and Development Commands

This repository is documentation-first and has focused tests for maintenance automation.

- Run maintenance scripts with UV:
  - `uv run python scripts/add_copyright.py`
  - `uv run python scripts/rename_images.py`
  - `uv run python scripts/replace_spaces_with_hyphens.py`
- Test contributor avatar automation with `node --test tests/update_contributors.test.js`.

## Coding Style & Naming Conventions

- Documentation is Markdown; keep headings concise and sectioned with `##`/`###`.
- Use descriptive, kebab-case filenames for new documents and assets when possible.
- For Python scripts, follow Google Python Style; keep comments and logs in English.
- Prefer clear, action-oriented titles like `add`, `update`, `docs:` in commit messages.

## Testing Guidelines

- Run the focused automated test when changing contributor synchronization. For documentation changes, manually verify:
  - Links resolve inside `README.md` and `docs/`.
  - Images referenced in Markdown exist under `images/` or `blogs/images/`.

## Commit & Pull Request Guidelines

- Commit messages are short and imperative, commonly `add ...`, `update ...`, or `docs: ...`.
- PRs should include a clear description of the change and link related issues if any.
- For content updates, mention affected document paths and provide before/after context.

## Security & Configuration Tips

- Do not add secrets or credentials to Markdown, images, or examples.
- If publishing new specs, ensure external references are stable and properly attributed.

## Agent-Specific Instructions

- Respond in Chinese in CLI interactions.
- Use UV for Python dependency management and run scripts via `uv run`.
- Keep code comments and logging in English.
