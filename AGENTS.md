Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- Prefer reliable existing libraries or patterns over reinventing the wheel.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# Repository Guidelines

## Shared rules

Engineering work follows [AI Coding Rules](../../awiki-harness/rules/ai-coding-rules.md).
Behavior changes and verification follow the relevant [Verification Policy](../../awiki-harness/rules/verification-policy.md)
sections; production behavior needs owning unit coverage and applicable System/product E2E review.
If Harness is absent, use local docs/tests/CI and disclose missing acceptance evidence.

## Project Structure & Module Organization

- Root contains protocol specifications and white papers (e.g., `01-*.md`, `06-*.md`, `07-*.md`, `08-*.md`).
- Root and `chinese/` hold the current ANP 1.2 core documents and the ANP-05 DID-based OAuth and VC authorization draft. ANP-05 remains v0.7 / Draft / not released and is outside ANP 1.2. `message/` and `chinese/message/` hold the full Messaging 1.2 catalog. ANP-06 remains a draft and P6 remains a candidate pending its registered MLS ExtensionType release gate.
- Root `vnext/` holds the ANP-01 white paper revisions and P4 group-messaging revisions in both languages. These revisions are unreleased drafts and are not part of ANP 1.2. Add a vNext copy of an existing specification or white paper only when its content changes; keep the original white papers aligned with `origin/main` and edit their revisions in `vnext/`.
- `docs/` and `docs/chinese/` hold guides, links, and community operations.
- ANP-05's detailed validation scenarios and stable `AUTHZ-*` identifiers live in `docs/anp-05-validation-guide.md` and `docs/chinese/anp-05-validation-guide.md`; the protocol's Section 14 retains conformance requirements and links to these guides.
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
- Check ANP 1.2 documentation and vNext draft boundaries with `node scripts/check-release-docs.mjs`, then run `node scripts/generate-anp02-vectors.mjs` and `node scripts/check-anp02-vectors.mjs` for offline fixture checks. Earlier extraction baselines remain available in Git history.
- Check onboarding and payment-status regressions with `node --test tests/release-doc-entrypoints.test.mjs`. The release checker includes the three current onboarding guides; AP2 checks cover status/version only, not payment conformance.
- Check ANP-05 draft metadata, bilingual wire examples, and draft/release separation with `node --test tests/did-oauth-draft.test.mjs`. These are documentation checks, not OAuth runtime or cryptographic conformance tests.
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

- For all protocol-related changes, including specifications, Profiles, white papers, examples, indexes, and related validation scripts/tests, finish the edits and necessary checks, then present the change summary and verification results for user review. Wait for explicit user approval before committing or pushing that change set. Do not commit or push automatically, and do not carry approval for a previous change set forward to later modifications. Approval may cover both commit and push when the user explicitly authorizes both for the reviewed change set.
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
