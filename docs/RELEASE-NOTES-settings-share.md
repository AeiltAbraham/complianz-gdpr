# Release Notes: Cross-Domain Settings Share

**Version:** 7.5.0
**Feature:** Share Complianz settings between WordPress sites via a secure, time-limited key

---

## What's New

### Share Settings Between Sites

Complianz admins can now transfer plugin settings (including cookie banner configuration) from one WordPress site to another without manual file exports. The feature uses a cryptographically secure key that is valid for 24 hours.

**How it works:**

1. On the **source site**, go to Complianz > Tools > Data > Share Settings and click "Generate Share Key"
2. Copy the generated key and share it with the admin of the receiving site
3. On the **receiving site**, go to Complianz > Tools > Data > Share Settings, enter the source site URL and the key, then click "Import from Remote Site"
4. Settings and banner configuration are transferred automatically

### What Gets Transferred

| Data | Transferred | Notes |
|---|---|---|
| All plugin settings | Yes | Region, consent type, statistics config, documents, etc. |
| Cookie banner styling | Yes | Colors, border radius, font size, position, animations |
| Cookie banner texts | Yes | All consent messages, button labels, category descriptions |
| Banner logo | No | Attachment IDs are site-specific; logo must be re-uploaded on the receiver |
| A/B testing config | No | Stripped on export to prevent test contamination |

### Security

- **Key format:** 64-character hex string generated with `random_bytes(32)`
- **Validity:** 24 hours from generation, supports multiple downloads within that window
- **Authentication:** The key itself authenticates the download request (no WordPress login needed on source)
- **Rate limiting:** Maximum 5 failed key attempts per IP per hour
- **Key comparison:** Timing-safe via `hash_equals()` to prevent timing attacks
- **Transport:** Key transmitted via POST body (not URL query string) to prevent leakage in server logs
- **Import validation:** Settings keys whitelisted against registered Complianz field IDs; banner values sanitized per field type
- **Temp files:** Protected by `.htaccess` deny-all and `index.php` silence file

---

## Technical Details

### New Files

| File | Purpose |
|---|---|
| `class-share.php` | Backend: key generation, REST endpoint, import/export logic, sanitization |
| `settings/src/Settings/Export/ShareControl.js` | React component: Generate Key UI + Import From Remote form |
| `tests/test-share.php` | 19 PHPUnit tests, 43 assertions |

### Modified Files

| File | Change |
|---|---|
| `complianz-gpdr.php` | Load `class-share.php` |
| `settings/config/fields/tools/data.php` | Register `share_settings` field in `tools-share` group |

### REST Endpoint

```
POST /wp-json/complianz/v1/share/download
Content-Type: application/json
Body: { "key": "<64-char-hex>" }

Success: 200 { "settings": {...}, "banners": [...] }
Failure: 403 { "code": "cmplz_invalid_key", "message": "..." }
Rate limited: 429 { "code": "cmplz_rate_limited", "message": "..." }
```

### WordPress Hooks

- `rest_api_init` — Registers the public download endpoint
- `cmplz_do_action` — Handles `generate_share_key` and `import_remote_settings` actions

### Dependencies

- No new PHP dependencies
- No new JS dependencies
- Requires PHP 7.4+ (for `random_bytes()`)

---

## Known Limitations

1. **Logo not transferred:** The banner logo uses a WordPress attachment ID which is site-specific. After import, the logo field will be empty and must be re-uploaded.
2. **HTTPS required in production:** The remote import enforces SSL verification. For local development, use `localhost` URLs which bypass SSL checks.
3. **One active key at a time:** Generating a new key invalidates and cleans up the previous export file.
4. **No multisite network sharing:** Each site in a multisite network manages its own key. There is no network-level batch share.
5. **PHPCS tooling:** The existing PHPCS/WPCS versions are incompatible with PHP 8.5. No actual code violations exist, but the linter crashes before it can report. This is a pre-existing issue unrelated to this feature.
