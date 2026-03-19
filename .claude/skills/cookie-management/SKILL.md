# Skill: Cookie Management

## When to Use
Activate when working on cookie detection, cookie database, service tracking,
banner configuration, or consent management.

## Patterns

### Cookie Model
`CMPLZ_COOKIE` class represents individual cookies in `wp_cmplz_cookies` table.
Key fields: name, slug, serviceID, cookieFunction, purpose, retention, domain.
Use class methods for CRUD, never raw SQL.

### Service Model
`CMPLZ_SERVICE` class represents third-party services in `wp_cmplz_services`.
Links to cookies via serviceID. Tracks data sharing, privacy statements.

### Cookie Banner
`CMPLZ_COOKIEBANNER` class manages banner templates in `wp_cmplz_cookiebanners`.
`cmplz_banner_loader` handles frontend rendering.
Banner settings are per-template, supporting multiple banner configurations.

### Consent Categories
Four consent categories: functional, statistics, preferences, marketing.
Category mapping determines which scripts/cookies are blocked until consent.

### Cookie Blocking
`cmplz_cookie_blocker` class intercepts page output to block non-consented scripts.
Uses output buffering and regex pattern matching.
Integration-specific blockers live in `integrations/`.

## Anti-Patterns
- Hardcoding cookie names (use database lookups)
- Bypassing the consent check for third-party scripts
- Modifying banner templates without updating version number

## Verification
After cookie changes: `./vendor/bin/phpunit` and manually test banner behavior.
