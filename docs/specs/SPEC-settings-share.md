# SPEC: Cross-Domain Settings Share

## Summary
Allow Complianz admins to share plugin settings from one WordPress site ("source") to another ("receiver") by generating a time-limited secret key. The receiver connects using that key, downloads the exported JSON, imports it, and saves — all without manual file transfers.

## Motivation
Managing Complianz across multiple domains currently requires manually exporting a JSON file, transferring it, and importing it. This feature automates that process with a secure, time-limited key exchange.

## User Flow

### Source Site (generates the key)
1. Admin navigates to **Complianz > Tools > Share Settings**
2. Clicks **"Generate Share Key"**
3. Plugin generates a cryptographic key valid for **24 hours**
4. Key is displayed to admin with a copy button
5. Source site stores the key + expiry in a transient and prepares the export JSON in a temp directory

### Receiver Site (downloads and imports)
1. Admin navigates to **Complianz > Tools > Share Settings**
2. Enters the **source site URL** and the **secret key**
3. Clicks **"Import from Remote Site"**
4. Receiver plugin calls the source's REST endpoint with the key
5. Source validates the key, returns the export JSON
6. Receiver imports settings + banners, saves, refreshes the UI
7. Source cleans up the temp file after successful download (or after 24h expiry)

## Technical Constraints
- Key must be cryptographically random (32+ bytes, hex-encoded)
- Key valid for exactly 24 hours, stored via `cmplz_set_transient()`
- Export JSON uses the existing format: `{"settings": {...}, "banners": [...]}` with `#--COMPLIANZ--#` suffix
- REST endpoint for download must be **public** (no WP auth) but **key-authenticated**
- Import logic must handle the same format as the existing manual import
- Temp file stored in `wp_upload_dir()['basedir'] . '/complianz/temp/'` with `.htaccess` deny-all
- Cleanup: cron job or lazy cleanup on expiry

## Acceptance Criteria
1. Source admin can generate a share key and see it in the UI
2. Key expires after 24 hours and cannot be reused
3. Receiver admin can enter source URL + key and import settings
4. Invalid/expired keys return a clear error message
5. Settings + banners are correctly imported on the receiver
6. Temp export files are cleaned up after download or expiry
7. All endpoints use `$wpdb->prepare()` or parameterized queries where applicable
8. PHPCS passes, PHPUnit tests cover key generation, validation, and import
