# Repository Guidelines

## Project Structure & Module Organization

- Root contains protocol specifications and white papers (e.g., `01-*.md`, `06-*.md`, `07-*.md`, `08-*.md`).
- `docs/` and `docs/chinese/` hold guides, links, and community operations.
- `chinese/` mirrors core documents in Chinese plus research notes and process docs.
- `blogs/` and `blogs/cn/` store long-form articles; `blogs/images/` holds blog assets.
- `images/` and `standard/` provide shared figures and standards references.
- `examples/` contains sample ADP assets and API interface YAMLs.
- `scripts/` includes dependency-free Python and JavaScript utilities for repo maintenance.

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
- Any code addition or modification must, in the same task, add or update the corresponding unit tests, system tests, and end-to-end (E2E) tests. Keep each test in its owning repository or harness; when a required test layer is owned by another repository, update that repository in the same task.

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
