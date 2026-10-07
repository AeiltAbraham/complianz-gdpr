# Complianz GDPR: settings UI redesign workspace

WordPress cookie-consent plugin, free edition (v7.5.5; WordPress 5.9+, PHP 7.4+). This
public fork of `complianz/complianz-gdpr` is the workspace for feature 001, the redesign
of the React settings app.

## Start every session by reading, in order

1. `.agent/constitution.md`: non-negotiables
2. `.agent/conventions.md`: how code is written, built, tested and committed here
3. `.agent/glossary.md`: domain terms and IDs (DB-nn, SC-nn, C-n, ADR-nnn)
4. `.agent/learnings.md`: lessons from earlier work
5. `docs/progress.md`: where the current feature stands

## Checks

- The commit and push gate (`.agent/gate.json`, run by the flow hook) checks against the
  merge-base with `master`: `php -l` on changed PHP files, then `git diff --cached
  --check` on staged changes. Stage in a separate call before committing.
- Not runnable here yet: coding standards, PHPUnit, JS lint and build (no `package.json`,
  outdated PHP dev tools). Plan 001 Stages A and B add them; see conventions.

## Key paths

- `settings/src/`: React admin app (feature 001's target)
- `settings/config/`, `settings/settings.php`: field, menu and block config, the admin
  page, `complianz/v1` REST routes
- `assets/css/admin/`: legacy admin SCSS, retired by feature 001 (ADR-005)
- `cookiebanner/`, `class-cookie-blocker.php`: website-side banner and script blocking
- `integrations/`: third-party plugin and service integrations
- `docs/specs/001-settings-ui-redesign/`: spec, clarifications, plan and tasks
- `docs/adr/`: decision records

## Critical rules

- Never use `--no-verify`; fix the failing check instead.
- Never modify test assertions without explicit approval.
- Never commit secrets or credentials. This fork is public.
- Always run the checks after changes, plus the tests for what you touched.
- Every PHP change escapes output, sanitizes input, and verifies nonces and capabilities.
- Keep `cmplz_` hooks, REST routes and saved options backward compatible.

## Workflow

spec → clarify → design → build → review → commit → ship → retro.
Run `/flow:catchup` after `/clear` and `/flow:handoff` before it. Never `/compact`.
Issues: GitHub Issues on the fork, referenced in commits (`Refs #12`).
Branches: `001-settings-ui-redesign` is the integration branch; work branches come off it
and return by pull request; `master` is the mainline.
