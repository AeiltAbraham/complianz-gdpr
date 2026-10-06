# Conventions

Derived from a codebase scan at `/flow:init` (2026-10-06). Facts carry their evidence;
unknowns are marked `TODO: confirm`. Update this file when a convention changes.

## Repository

- **Product:** Complianz GDPR/CCPA Cookie Consent, free edition (`cmplz_free`), version
  7.5.5. Requires WordPress 5.9 and PHP 7.4 (plugin header, `readme.txt`).
- **This repo:** public GitHub fork `AeiltAbraham/complianz-gdpr` of
  `complianz/complianz-gdpr`, and the workspace for feature 001 (settings UI redesign,
  clarification C-1). The premium edition lives in a separate, private repository.
- **Issues:** GitHub Issues on the fork; reference them in commit messages
  (`Refs #12`, `Fixes #12`).

## Domains

| Domain | Main paths | Notes |
|---|---|---|
| Consent banner & script blocking | `cookiebanner/`, `class-cookie-blocker.php`, `placeholders/` | Runs on every visitor page; Google Consent Mode (29 files), WP Consent API (8 files) |
| Settings app | `settings/` (`src/`, `config/`, `settings.php`) | React admin app; REST namespace `complianz/v1`; target of feature 001 |
| Cookie & service inventory | `cookie/`, `websitescan/`, `cron/` | Syncs with cookiedatabase.org; website-scan service API |
| Legal documents & records | `documents/`, `templates/`, `config/documents/`, `proof-of-consent/`, `DNSMPD/` | Policies, proof of consent, "do not sell" data requests |
| Integrations | `integrations/` (106 plugins, 28 services, statistics, forms), `gutenberg/` | Multisite handling in 10 files |

## PHP

- WordPress style with **tabs** for indentation (about 36,000 tab-indented lines vs 236
  space-indented).
- Global functions, hooks and options are prefixed `cmplz_` (614 functions; 123 filters
  and 28 actions fired). New public hooks use the same prefix and are part of the public
  API (constitution §3).
- Classes are mostly legacy lowercase `cmplz_*` (30), some `CMPLZ_*` (6).
  `TODO: confirm` the naming for new classes.
- Text domain `complianz-gdpr` for every translatable string.
- Direct-access guard `defined( 'ABSPATH' ) || die( ... )` is present in 205 of 808 PHP
  files; include it in new PHP files.
- Access control: `cmplz_user_can_manage()` (capability filter `cmplz_capability`,
  default `manage_privacy`). Settings live in the `cmplz_options` option.
- Security helpers in use: `esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`,
  `sanitize_text_field`, `cmplz_sanitize_*`, `wp_verify_nonce`.
- REST routes are registered in `settings/settings.php` (`complianz/v1`),
  `class-cookie-blocker.php` and `websitescan/class-wsc-api.php`.

## Settings app (JavaScript)

- React through `@wordpress/element` (133 importing files; `react` directly in 10).
  React is supplied by WordPress, not bundled.
- Function components (141 files; 4 class components remain). Files are PascalCase `.js`;
  there are no `.jsx` files.
- State lives in Zustand stores (29), with immer. Data access goes through
  `settings/src/utils/api.js` (`@wordpress/api-fetch`, falling back to admin-ajax).
- Strings use `@wordpress/i18n` with the `complianz-gdpr` domain (109 files).
- Code splitting uses dynamic `import()` (14 sites; no `React.lazy`).
- Server-provided HTML is sanitized with DOMPurify (11 files).
- Per-component SCSS (17 files) and `assets/css/admin/` are being retired by feature 001
  (ADR-005).

## Build

- Settings app: `settings/webpack.config.js` extends `@wordpress/scripts` (content-hashed
  chunks plus a `react-jsx-runtime` polyfill bundle). Root CSS: `gulpfile.js` (sass,
  rtlcss, uglify).
- **There is no `package.json` in this repo**, so neither can be built here yet.
  `TODO: confirm` the package manager (npm, as in the input technical spec, or pnpm);
  the design task that bootstraps the tooling settles it.
- Build output is tracked: `settings/build/`, `assets/css/*.min.css`, `assets/css/rtl/`.

## Tests

- PHPUnit 9 against the WordPress test library (`bin/install-wp-tests.sh`, needs MySQL);
  tests live in `tests/test-*.php`.
- `phpunit.xml.dist` points at `tests/legacy/`, which does not exist here, so the suite
  runs nothing. `TODO: confirm` the fix in design (Phase 0 tooling).
- No JavaScript or end-to-end tests yet; feature 001 adds the end-to-end suite (SC-06).

## Lint

- `.phpcs.xml.dist` is an unfilled template: prefix and text domain `my-plugin`, PHP
  testVersion `5.6-`, minimum WordPress 4.6. `composer.lock` pins WPCS 2.3.0, PHPCS 3.7.1
  and PHPCompatibility 9.3.5, which likely don't run on PHP 8.5. The first design task
  upgrades and fixes them, then adds coding standards to the gate.
- `.stylelintrc.json` extends `@wordpress/stylelint-config/scss-stylistic` (needs the JS
  tooling).

## Gate

`.agent/gate.json` runs on every `git commit` and `git push`, against the merge-base with
`master`:

1. `php -l` on every changed or untracked PHP file;
2. `git diff --check` (conflict markers, whitespace errors) on tracked changes.

Untracked files are only seen by check 1, so stage new files before committing. Next
additions (design): coding standards on changed PHP, JS lint and build, and the
permanent checks of feature 001.

## CI

- `.gitlab-ci.yml` (PHPUnit on PHP 7.4–8.2) and `.travis.yml` are inherited from upstream
  and do not run on this GitHub fork. `TODO: confirm` whether to add GitHub Actions.

## Git

- Conventional Commits, as in the history: `type(scope): subject`
  (for example `fix: …`, `chore(release): 7.5.5`).
- Branching (clarification C-9): `001-settings-ui-redesign` is the integration branch;
  work branches are cut from it and merged back by pull request; `master` is the mainline,
  merged in at least weekly and the target of the single release merge.
- Never commit secrets; the fork is public.

## Docs

- Feature folders: `docs/specs/NNN-slug/` (`spec.md`, `clarify.md`, later `plan.md` and
  `tasks.md`). ADRs: `docs/adr/ADR-NNN-slug.md`, started from `docs/adr/TEMPLATE.md`.
- Product docs by audience: `docs/users/`, `docs/developers/`, `docs/support/`.
  Reusable patterns: `docs/patterns/`. Session handoff: `docs/progress.md`.

## Local environment (maintainer's machine, 2026-10-06)

- PHP 8.5, Composer 2.9, Node 24, npm 11, pnpm 11, Docker 29. No WP-CLI; `vendor/` is not
  installed.
- The interactive shell is zsh (an unquoted `$VAR` is not word-split) and `grep` resolves
  to ugrep. In scripts, write flags out and use POSIX character classes.
