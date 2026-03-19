# Technical Debt Tracker

Items discovered during development that need attention but are outside the current feature scope.

---

## TD-001: File-based import has no PHP backend

**Severity:** Medium
**Discovered:** 2026-03-19 (settings-share feature)
**Location:** `settings/src/Settings/Export/ImportControl.js`

The React UI for file-based import exists and posts to `admin_url + '?page=complianz&cmplz_upload_file=1&action=import_settings'`, but no PHP handler processes that request. The import button exists in the admin but does nothing.

**Fix:** Wire the `cmplz_upload_file` handler to call `cmplz_share::import_settings()` (the general-purpose import handler built for the settings-share feature). This is ~20 lines of PHP.

---

## TD-002: PHPCS/WPCS incompatible with PHP 8.2+

**Severity:** Low (tooling only)
**Discovered:** 2026-03-19
**Location:** `composer.json` → `wp-coding-standards/wpcs`

The installed WPCS version uses deprecated nullable parameter syntax that crashes on PHP 8.2+. PHPCS reports `Internal.Exception` instead of actual linting results.

**Fix:** Upgrade to `wp-coding-standards/wpcs` 3.x when available and compatible. May require updating `phpcs.xml.dist` rule references.

---

## TD-003: Test bootstrap does not create plugin tables

**Severity:** Low
**Discovered:** 2026-03-19
**Location:** `tests/bootstrap.php`, `phpunit.xml.dist`

PHPUnit tests produce `Table 'wordpress_test.wptests_cmplz_cookiebanners' doesn't exist` errors because the plugin's `activate()` / table creation code is not called during test setup. Tests still pass (the code handles missing tables gracefully), but the noise makes it harder to spot real failures.

**Fix:** Add Complianz table creation to the test bootstrap, or mock the banner queries in tests that don't need real banner data.

---

## TD-004: `package.json` was not in the original repo

**Severity:** Low
**Discovered:** 2026-03-19
**Location:** `settings/package.json`

The original repo did not include `package.json` or `package-lock.json`. This was reconstructed during the settings-share feature. The `settings/build/` directory was the only source of truth for the JS bundle.

**Status:** Resolved — `package.json` and `package-lock.json` are now committed. Dependency versions pinned based on codebase import patterns.
