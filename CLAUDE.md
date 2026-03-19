# Complianz GDPR — The Privacy Suite for WordPress

PHP 7.4+ / WordPress 5.9+ / React admin UI via @wordpress/scripts / MySQL custom tables

## Commands
- `composer install` — Install PHP dependencies
- `cd settings && npm install && npm run build` — Build React admin UI
- `cd gutenberg && npm install && npm run build` — Build Gutenberg block
- `composer run phpcs` — PHP code style check (see PHPCS note below)
- `./vendor/bin/phpunit` — Run PHPUnit tests
- `cd settings && npm run start` — Dev mode for React admin

## Architecture
- `complianz-gpdr.php` — Main plugin entry, singleton COMPLIANZ class
- `config/` — Field definitions, constants, documents config
- `settings/src/` — React admin UI (Dashboard, Settings, Onboarding, Wizard)
- `settings/config/fields/` — All field ID registrations (wizard, tools, general, integrations)
- `cookie/` — Cookie DB model (CMPLZ_COOKIE, CMPLZ_SERVICE), sync engine
- `cookiebanner/` — Banner templates, loader, frontend rendering (CMPLZ_COOKIEBANNER class)
- `documents/` — Policy document generation (privacy, cookie, DNSMPD)
- `integrations/` — 106 plugin + 29 service integrations
- `websitescan/` — Site scanning engine with external API
- `rest-api/` — REST endpoints for settings, documents, banner, consent

## Code Standards
- WordPress Coding Standards (PHPCS enforced via .phpcs.xml.dist)
- All functions prefixed with `cmplz_`, classes with `cmplz_` or `CMPLZ_`
- No direct DB queries without `$wpdb->prepare()`
- React components in settings/src/ follow WordPress component patterns
- Dynamic component loading in Field.js requires **default exports** — always include `export default`
- Named exports may be added alongside default exports for direct imports

### WordPress-Specific Standards
- All user-facing strings MUST use `__()` or `_e()` with text domain `complianz-gdpr`
- Strings with placeholders MUST have translator comments: `/* translators: %s: description */`
- Never concatenate translated strings — use `sprintf()` with full sentences
- Sanitize all input: `sanitize_text_field()` for plain text, `wp_kses_post()` for HTML, `esc_url_raw()` for URLs
- Escape all output: `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses()`
- REST endpoints MUST have explicit `permission_callback` (use `cmplz_user_can_manage()` for admin endpoints)
- Public REST endpoints MUST validate and sanitize all parameters — the endpoint is the trust boundary
- File operations: use `wp_mkdir_p()` for directories, protect with `.htaccess` + `index.php`

## Critical Rules
- MUST run `./vendor/bin/phpunit` after any PHP code change
- MUST run `cd settings && npm run build` after any React change
- MUST NOT modify test assertions without explicit user approval
- MUST NOT modify database table schemas without an ADR
- Never use --no-verify when committing
- Never commit .env files, API keys, or credentials
- Never disable PHPCS rules without documented justification
- Always handle errors explicitly, never swallow exceptions

## Verification
After any code change, run the **full verification**:
```bash
cd settings && npm run build && cd .. && ./vendor/bin/phpunit
```

The React build is part of verification — a PHP-only check can miss broken JS imports.

### PHPCS Note
PHPCS/WPCS may crash on PHP 8.2+ due to deprecated nullable parameter syntax in the WPCS library.
If PHPCS crashes with `Internal.Exception`, the issue is tooling — not your code. In that case:
1. Verify manually against WordPress Coding Standards
2. Consider upgrading `wp-coding-standards/wpcs` when a compatible version is available
3. Do NOT suppress the error or skip linting entirely

### PHPUnit Note
The test bootstrap does not create Complianz custom tables (e.g., `cmplz_cookiebanners`).
DB error messages during tests about missing tables are expected and do not cause test failures.
To fix: add table creation to the test bootstrap's `setUp` or a custom `tests/bootstrap.php`.

## Dependencies
- `settings/package.json` and `settings/package-lock.json` are committed to the repo
- Pin major versions of packages that changed their export API:
  - `immer` pinned to `^9.x` (v10 removed default export, codebase uses `import produce from 'immer'`)
  - `dompurify` pinned to `^2.x` (v3 changed to factory function, codebase uses `import DOMPurify from 'dompurify'`)
- When upgrading dependencies, check all import statements for default vs named export compatibility

## Documents and Plans
- All specs, plans, progress logs, and ADRs live in `docs/`
- Active feature spec: `docs/specs/SPEC-{feature}.md`
- Active plan: `docs/plans/PLAN-{feature}.md`
- Session progress: `docs/progress.md`
- Architecture decisions: `docs/adr/ADR-{number}-{title}.md`
- Known broken features and debt: `docs/tech-debt.md`
- Release notes: `docs/RELEASE-NOTES-{feature}.md`
- QA manuals: `docs/QA-MANUAL-{feature}.md`

## GitHub Workflow
- Reference GitHub Issue IDs in all commits: `feat: add search [#123]`
- One logical change per commit, conventional commit format
- Branch format: `feature/{issue-id}-{description}`

## Integration Awareness
Complianz has 135+ integrations. For every new feature or change, consider:
- **Integration impact:** Does this change affect how any integration works?
- **Cookie blocking:** Does this change affect the cookie blocker or script center?
- **Banner rendering:** Does this change affect how the consent banner displays?
- If no impact, state "No integration impact" in the plan/PR description.

## Additional Context
- For integration patterns, see `docs/patterns/integration-patterns.md`
- For database schema decisions, see `docs/adr/`
- For REST API conventions, see `docs/patterns/api-conventions.md`
- For cookie banner patterns, see `docs/patterns/banner-patterns.md`
- For known technical debt, see `docs/tech-debt.md`
