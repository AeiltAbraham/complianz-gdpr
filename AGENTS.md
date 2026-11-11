# AGENTS.md

Rules for coding agents (and humans) working in this repo. If something here conflicts with an explicit instruction from the task owner, ask in the task before acting.

## What this is

**Complianz | GDPR/CCPA Cookie Consent**, a WordPress plugin in PHP.
- **Main file:** `complianz-gpdr.php`. The filename has that spelling.
- **Text domain:** `complianz-gdpr`.
- **Requires:** WordPress 5.9+ and PHP 7.4+, from the plugin header.
- **Default branch:** `master`.

## Where things live

| Path | What |
|---|---|
| `complianz-gpdr.php`, `functions.php`, `class-*.php` | Bootstrap, shared functions, core classes (`cmplz_*`). |
| `settings/` | Admin settings app. `settings/src/` is the source, `settings/build/` the **committed build output**. |
| `cookiebanner/`, `cookie/`, `integrations/`, `documents/`, `onboarding/`, `rest-api/`, `upgrade/`, `websitescan/` | Feature areas. |
| `templates/` | PHP templates. |
| `assets/css/*.scss` → `*.css`, `*.min.css`; `cookiebanner/js/complianz.js` → `complianz.min.js` | Sources and committed build outputs (see `gulpfile.js`). |
| `assets/vendor/` | Bundled third-party PHP libraries (mpdf, setasign, …). |
| `languages/` | `complianz-gdpr.pot` only; translations come from translate.wordpress.org. |
| `tests/` | PHPUnit tests (`test-*.php`) and `bootstrap.php`; `bin/install-wp-tests.sh` sets up the WP test library. |

## Setup

```sh
composer install    # dev tools only (phpcs, WPCS, PHPCompatibility, phpunit); vendor/ is git-ignored
```

There is no `package.json` in the repo. The asset build in `gulpfile.js` and the `settings/` app build cannot be reproduced from this repo alone.

## Checks to run (and report honestly)

**Report every check you could not run in the PR description.** Never skip a check silently. If PHP or Composer is not available, say so in the PR and run what you can.

1. **Syntax.** Run `php -l <file>` on every PHP file you changed.
2. **PHP compatibility.** This works with the locked tools:
   ```sh
   vendor/bin/phpcs --config-set installed_paths vendor/wp-coding-standards/wpcs,vendor/phpcompatibility/php-compatibility,vendor/phpcompatibility/phpcompatibility-wp,vendor/phpcompatibility/phpcompatibility-paragonie
   vendor/bin/phpcs --standard=PHPCompatibilityWP --runtime-set testVersion 7.4- <changed files>
   ```
3. **WordPress Coding Standards.** Run `vendor/bin/phpcs --standard=.phpcs.xml.dist <changed files>`.
   - **Known issues:** with the locked WPCS 2.3, this aborted ("An error occurred during processing") on PHP 8.4. Also, `.phpcs.xml.dist` still has the placeholder prefix and text domain `my-plugin`.
   - **What to do:** if it aborts, say so in the PR. If it runs, ignore the prefix and text-domain findings caused by the placeholders.
   - **Scope:** fix only findings in lines you changed; the legacy code is not WPCS-clean.
4. **Tests.** Run `vendor/bin/phpunit`. It needs the WP test library and a MySQL database, set up with `bash bin/install-wp-tests.sh <db> <user> <pass> <host> latest`.
   - **Use only a disposable database** with a new, unique name (for example `cmplz_test_<task id>`), on a local or throwaway MySQL, with the WP test library in a temporary `WP_TESTS_DIR`.
   - **Never point the script at an existing database.** If the database exists, the script offers to drop and recreate it, and the tests reset its tables. Never answer "y" for a database you did not just create for this run.
   - **Never use a real site's database or credentials,** including production, staging or shared environments.
   - `phpunit.xml.dist` points its suite at `./tests/legacy/`, which does not exist. The tests are in `tests/test-*.php`.
   - If you cannot set this up, say so in the PR; do not claim tests passed. Add or adjust tests only where `tests/` already covers the area.

## Coding conventions

- **WordPress Coding Standards:** tabs, Yoda conditions, `snake_case`. Prefix globals, functions, classes and options with `cmplz_` (constants `CMPLZ_`). Match the style of the surrounding file.
- **Keep the existing guard:** `defined( 'ABSPATH' ) or die(...)` at the top of PHP files.
- **i18n:** every user-facing string goes through `__()`, `_e()`, `esc_html__()` and similar, with the text domain **`complianz-gdpr`**.
- **Escape on output:** `esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`.
- **Sanitize on input:** `sanitize_text_field`, `absint` and so on. Check capabilities and nonces for every admin action and REST endpoint.
- **PHP 7.4 compatibility:** no PHP 8-only syntax.

## Scope and safety rules

- **One task, one small PR:** a branch `side-hustle/<task id>` into `master`, with a PR description that links the task and summarizes the changes.
- **Never push to `master`, never merge, never force-push, never deploy.** The repo owner reviews and merges.
- **Do not touch** these unless the task explicitly asks:
  - `vendor/` and `assets/vendor/`;
  - built files: `settings/build/`, `*.min.js`, `*.min.css`, compiled `.css`;
  - `languages/` and translation files;
  - `composer.lock`.
- **Rebuilds:** if a change needs a rebuild you cannot run, say so in the PR.
- **No destructive changes:** no data deletion, no irreversible migrations or option and table removals, no permission or secret changes. Do not remove files, tests or features unless asked.
- **No unrelated changes.** No reformatting of untouched code, and no drive-by refactors.
