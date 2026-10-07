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
- No one-time Prettier reformat of `settings/src` (plan 001 §4, confirmed 2026-10-06).

## Build

- Settings app: `settings/webpack.config.js` extends `@wordpress/scripts` (content-hashed
  chunks plus a `react-jsx-runtime` polyfill bundle). Root CSS: `gulpfile.js` (sass,
  rtlcss, uglify).
- **There is no `package.json` in this repo yet**, so neither can be built here. Plan 001
  tasks T-001 and T-002 create both manifests with npm on Node 24 (ADR-010, confirmed
  2026-10-06).
- Build output is tracked: `settings/build/`, `assets/css/*.min.css`, `assets/css/rtl/`.

## Tests

- PHPUnit 9 against the WordPress test library (`bin/install-wp-tests.sh`, needs MySQL);
  tests live in `tests/test-*.php`.
- `phpunit.xml.dist` points at `tests/legacy/`, which does not exist here, so the suite
  runs nothing. Plan 001 task T-005 fixes it.
- No JavaScript or end-to-end tests yet; feature 001 adds the end-to-end suite (SC-06).

## Lint

- `.phpcs.xml.dist` is filled for this plugin: prefixes `cmplz`/`CMPLZ`, text domain
  `complianz-gdpr`, PHP `testVersion` `7.4-`, minimum WordPress 5.9; it excludes `vendor/`,
  `node_modules/` and generated `settings/build/` (webpack `*.asset.php`). `composer.lock`
  pins the dev tools that install and run on PHP 8.5 (T-004): PHP_CodeSniffer 3.13.6,
  WPCS 3.4.1, PHPCompatibilityWP 2.1.8 (PHPCompatibility 9.3.5), PHPUnit 9.6.38 (kept on 9
  for the WordPress test library), yoast/phpunit-polyfills 1.1.5 and
  wp-cli/wp-cli-bundle 2.12.0. WPCS 3's sniff registration needs the
  `dealerdirect/phpcodesniffer-composer-installer` plugin, allowed in `composer.json`
  `config.allow-plugins`. Run `composer install`, then `vendor/bin/phpcs
  --standard=.phpcs.xml.dist`. T-006 adds coding standards to the gate on changed files
  only; the whole-repo baseline it will NOT enforce is ~12k errors / 2.6k warnings.
- `.stylelintrc.json` extends `@wordpress/stylelint-config/scss-stylistic` (needs the JS
  tooling).

## Gate

`.agent/gate.json` runs on every `git commit` and `git push`, against the merge-base with
`master`:

1. `php -l` on every changed or untracked PHP file;
2. `git diff --cached --check` (conflict markers, whitespace errors) on the staged
   changes, so unstaged rebuilt artifacts never block a commit.

Stage files in a separate call before committing: check 2 only sees staged content.
Planned additions (plan 001): coding standards on changed PHP (T-006) and the
permanent token checks (T-018).

## CI

- `.gitlab-ci.yml` (PHPUnit on PHP 7.4–8.2) and `.travis.yml` are inherited from upstream
  and do not run on this GitHub fork. CI moves to GitHub Actions (ADR-012, accepted
  2026-10-06); the workflow is plan 001 task T-019.

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
