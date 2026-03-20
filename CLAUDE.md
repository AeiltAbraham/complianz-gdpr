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

### Smoke Test
After full verification, activate the plugin on a test site and confirm:
1. Admin page loads without JS console errors
2. The feature you changed is visible and interactive
3. No PHP warnings/errors in `wp-content/debug.log`

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

### Dependency Recovery
If `package.json` is missing or corrupted:
1. Check import statements for default vs named export patterns
2. Check `build/` output for version hints in comments
3. Pin major versions conservatively — prefer older stable over latest
4. Test with `npm run build` before committing

## React Field Types
Dynamic component loading in `Field.js` maps field `type` to component files.

Known types: `text`, `textarea`, `checkbox`, `radio`, `select`, `multicheckbox`,
`button`, `export`, `import`, `document`, `share`

When adding a new field type:
1. Create component in `settings/src/Settings/`
2. Must have a **default export** (Field.js uses dynamic `import()`)
3. Register the type mapping in Field.js
4. Add field definition in `settings/config/fields/`
5. Update this list

## Data Migrations
- Never change the meaning of an existing option key in `cmplz_options`
- New keys must work when absent (backward-compatible defaults)
- If restructuring data: add a version key, write a migration function, hook to `admin_init` with a version check
- Document migrations in `docs/adr/`

## Rollback
- All features must be deactivatable without data loss
- New options added to `cmplz_options` must have sensible defaults when absent
- New REST endpoints must fail gracefully if the class is missing
- New React components must not break the admin page if the backend field is absent

## Error Handling
- REST endpoints: always return `WP_Error` with HTTP status code, never `die()` or `wp_die()`
- Background tasks (cron, import): use `error_log()` with prefix `[CMPLZ]`
- React: show user-facing errors via `addHelpNotice` or `toast`, log details with `console.error`
- Never swallow exceptions silently — at minimum log them

## Feature Flags
For features spanning multiple PRs or longer timelines:
- Gate behind `defined( 'CMPLZ_FEATURE_X' ) && CMPLZ_FEATURE_X`
- Add the constant to `wp-config.php` on test sites only
- Remove the gate when the feature is complete and tested
- Never ship a half-built UI to production

## Multisite
- `get_option` / `update_option` = site-scoped (correct for most features)
- `get_site_option` / `update_site_option` = network-scoped (licenses, network settings)
- `cmplz_set_transient` uses `get_option` — site-scoped by design
- Test features on both standalone and multisite installs
- REST endpoints: verify they work on subdomain AND subdirectory multisite

## Performance
- React bundle: check build output size warnings (>250KB per chunk = too large, consider code splitting)
- New DB queries: must use indexes, no full table scans
- New REST endpoints: consider caching with `cmplz_set_transient` for expensive responses
- New `admin_init` hooks: must bail early if not on a Complianz page (`if ( ! cmplz_user_can_manage() ) return;`)
- Avoid `file_get_contents` for remote URLs — use `wp_remote_get()` with timeouts

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

## Review Checklist
Include in every plan and verify before merging:
- [ ] All input sanitized at REST boundary
- [ ] All output escaped at render
- [ ] No integration impact (or impact documented)
- [ ] i18n: all strings use `__()` with `complianz-gdpr` domain, translator comments on placeholders
- [ ] Tests cover happy path + at least 2 error paths
- [ ] No new PHPCS violations
- [ ] React build passes with 0 errors
- [ ] Smoke test on a real WP instance passes
- [ ] No performance regressions (bundle size, query count)

## Additional Context
- For integration patterns, see `docs/patterns/integration-patterns.md`
- For database schema decisions, see `docs/adr/`
- For REST API conventions, see `docs/patterns/api-conventions.md`
- For cookie banner patterns, see `docs/patterns/banner-patterns.md`
- For known technical debt, see `docs/tech-debt.md`
