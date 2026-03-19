# PLAN: Cross-Domain Settings Share

**Spec:** `docs/specs/SPEC-settings-share.md`
**Status:** Approved
**Estimated complexity:** L (5 tasks, ~500 lines total)

## Decisions (confirmed by user)
- Key allows **multiple downloads** within 24h window (not single-use)
- Import includes **both settings + banners**
- UI placed in **Tools > Data, dedicated block** alongside existing export/import
- Feature is **free** (not premium-gated)
- Build **general-purpose import handler** in PHP as foundation

---

## Task 1 — Key generation, storage & general import handler (Backend)

**Size:** M (~120 lines)
**Status:** Complete
**Files:**
- `class-share.php` (new) — singleton `cmplz_share` class
- `complianz-gpdr.php` — require the new class

**Description:**
Create the backend class with two concerns:
1. **Key gen**: generates a cryptographic share key, stores it with 24h TTL, writes export JSON to a protected temp dir
2. **Import handler**: general-purpose `import_settings($json)` method that parses the Complianz JSON format and applies settings + banners — this also becomes the backend for the existing (currently UI-only) file import

**Acceptance Criteria:**
1. `cmplz_share::generate_key()` returns a 64-char hex string (`bin2hex(random_bytes(32))`)
2. Key stored via `cmplz_set_transient('cmplz_share_key', [...], DAY_IN_SECONDS)`
3. Export JSON written to `wp_upload_dir()/complianz/temp/cmplz-share-{hash}.json`
4. `.htaccess` with `deny from all` auto-created in temp directory
5. `import_settings($json)` parses `{"settings": {...}, "banners": [...]}#--COMPLIANZ--#` format
6. Import updates `cmplz_options` and saves each banner via the existing banner model
7. `cleanup()` deletes expired temp files (called on generate + via cron)

---

## Task 2 — REST endpoint for key-authenticated download (Source side)

**Size:** S (~60 lines)
**Status:** Complete (implemented in Task 1 within class-share.php)
**Files:**
- `class-share.php` — add REST route registration + callback

**Description:**
Register a public REST endpoint that validates the share key and returns the export JSON. No WordPress authentication required — the key IS the authentication. Key remains valid for multiple downloads within 24h.

**Acceptance Criteria:**
1. `GET /complianz/v1/share/download?key={key}` registered with `__return_true` permission callback
2. Valid key → returns JSON response with export data (200)
3. Invalid/expired/missing key → returns `WP_Error` with 403 and clear message
4. Key **stays valid** after successful download (reusable within 24h)
5. Rate limiting: max 5 failed attempts per IP per hour (stored in transient)
6. Response uses existing export format (`{"settings": {...}, "banners": [...]}`)

---

## Task 3 — Admin UI: Generate Key + Import Form (React)

**Size:** M (~120 lines)
**Status:** Complete
**Files:**
- `settings/src/Settings/Export/ShareControl.js` (new) — React component
- `settings/config/fields/tools/data.php` — add share field definitions in dedicated group
- `settings/settings.php` — pass share-related data to JS + register `do_action` handlers

**Description:**
Add a **"Share Settings"** block in Tools > Data (separate from existing Export/Import/Reset) with:
1. **Generate Key** button → calls `do_action/generate_share_key` → displays key + expiry with copy button
2. **Import from Remote** form → URL + Key inputs → calls `do_action/import_remote_settings`

**Acceptance Criteria:**
1. Dedicated "Share Settings" group visible in Tools > Data, separate from existing export/import
2. "Generate Share Key" button calls `generate_share_key` action, displays key + expiry
3. Copy-to-clipboard button works
4. "Import from Remote Site" form has URL + Key fields with client-side validation
5. Submit calls `import_remote_settings` action, shows success/error notification
6. Loading states shown during both operations

---

## Task 4 — Remote import logic (Receiver side)

**Size:** M (~80 lines)
**Status:** Complete (implemented in Task 1 within class-share.php)
**Files:**
- `class-share.php` — add `import_from_remote($url, $key)` method
- `settings/settings.php` — wire `do_action` handlers for `generate_share_key` and `import_remote_settings`

**Description:**
Implement the receiver-side logic: fetch JSON from source REST endpoint using the key, validate, and pass to `import_settings()` from Task 1.

**Acceptance Criteria:**
1. `import_from_remote($url, $key)` uses `wp_remote_get()` to fetch from source endpoint
2. Validates response is valid JSON with expected structure
3. Calls `import_settings()` to apply settings + banners
4. Returns success/error array consumed by the React `do_action` handler
5. Handles network errors, invalid JSON, HTTP errors with clear messages
6. URL sanitized and validated (must be HTTPS or localhost for dev)

---

## Task 5 — PHPUnit tests + PHPCS compliance

**Size:** S (~60 lines)
**Status:** Complete
**Files:**
- `tests/test-share.php` (new)

**Description:**
Unit tests for key generation, validation, import logic, and temp file management. PHPCS pass on all new code.

**Acceptance Criteria:**
1. Test: `generate_key()` returns 64-char hex string
2. Test: key stored in transient with correct TTL
3. Test: expired key returns error on validation
4. Test: `import_settings()` correctly updates options and banners
5. Test: temp file created and cleaned up correctly
6. `composer run phpcs` passes with zero new violations on changed files

---

## Dependency Order

```
Task 1 (key gen + storage + import handler)
  └─> Task 2 (REST endpoint)
  └─> Task 3 (React UI)
        └─> Task 4 (remote import) — depends on Task 1 + 2 + 3
              └─> Task 5 (tests) — after all logic is in place
```

Tasks 2 and 3 can run in parallel after Task 1 is done.

---

## Risks & Decisions
- **Security**: Share key is a bearer token. 24h expiry + rate limiting mitigates risk. Temp file protected by `.htaccess`.
- **Import foundation**: Building the general import handler also enables the existing file-based import UI to work (currently broken — no PHP backend).
- **Multisite**: `cmplz_set_transient` is site-scoped via `get_option`. Correct for per-site sharing.
- **HTTPS**: Remote import should enforce HTTPS in production (allow HTTP only for localhost dev).
