# Complianz GDPR — The Privacy Suite for WordPress

PHP 7.4+ / WordPress 5.9+ / React admin UI via @wordpress/scripts / MySQL custom tables

## Commands
- `composer install` — Install PHP dependencies
- `cd settings && npm install && npm run build` — Build React admin UI
- `cd gutenberg && npm install && npm run build` — Build Gutenberg block
- `composer run phpcs` — PHP code style check
- `./vendor/bin/phpunit` — Run PHPUnit tests
- `cd settings && npm run start` — Dev mode for React admin

## Architecture
- `complianz-gpdr.php` — Main plugin entry, singleton COMPLIANZ class
- `config/` — Field definitions, constants, documents config
- `settings/src/` — React admin UI (Dashboard, Settings, Onboarding, Wizard)
- `cookie/` — Cookie DB model (CMPLZ_COOKIE, CMPLZ_SERVICE), sync engine
- `cookiebanner/` — Banner templates, loader, frontend rendering
- `documents/` — Policy document generation (privacy, cookie, DNSMPD)
- `integrations/` — 106 plugin + 29 service integrations
- `websitescan/` — Site scanning engine with external API
- `rest-api/` — REST endpoints for settings, documents, banner, consent

## Code Standards
- WordPress Coding Standards (PHPCS enforced via .phpcs.xml.dist)
- All functions prefixed with `cmplz_`, classes with `cmplz_` or `CMPLZ_`
- No direct DB queries without `$wpdb->prepare()`
- React components in settings/src/ follow WordPress component patterns
- Named exports, functional components, WordPress data stores

## Critical Rules
- MUST run `./vendor/bin/phpunit` after any PHP code change
- MUST run `cd settings && npm run build` after any React change
- MUST NOT modify test assertions without explicit user approval
- MUST NOT modify database table schemas without an ADR
- Never use --no-verify when committing
- Never commit .env files, API keys, or credentials
- Never disable PHPCS rules without documented justification
- Always handle errors explicitly, never swallow exceptions

## Documents and Plans
- All specs, plans, progress logs, and ADRs live in `docs/`
- Active feature spec: `docs/specs/SPEC-{feature}.md`
- Active plan: `docs/plans/PLAN-{feature}.md`
- Session progress: `docs/progress.md`
- Architecture decisions: `docs/adr/ADR-{number}-{title}.md`

## GitHub Workflow
- Reference GitHub Issue IDs in all commits: `feat: add search [#123]`
- One logical change per commit, conventional commit format
- Branch format: `feature/{issue-id}-{description}`

## Verification
After any code change: `composer run phpcs && ./vendor/bin/phpunit`

## Additional Context
- For integration patterns, see `docs/patterns/integration-patterns.md`
- For database schema decisions, see `docs/adr/`
- For REST API conventions, see `docs/patterns/api-conventions.md`
- For cookie banner patterns, see `docs/patterns/banner-patterns.md`
