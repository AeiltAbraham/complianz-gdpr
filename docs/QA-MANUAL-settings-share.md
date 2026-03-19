# QA Manual: Cross-Domain Settings Share

## Prerequisites

- Two WordPress sites with Complianz activated (referred to as **Source** and **Receiver**)
- Admin access on both sites
- Sites must be able to reach each other over the network (both on the internet, or both on the same local network)

---

## Test Cases

### TC-01: Generate Share Key (Happy Path)

**Steps:**
1. Log in to the **Source** site as admin
2. Navigate to Complianz > Tools > Data tab
3. Scroll to the "Share Settings" section
4. Click "Generate Share Key"

**Expected:**
- A 64-character hex string is displayed
- An expiry date/time is shown (24 hours from now)
- The key is selectable/copyable

**Pass criteria:** Key is displayed, expiry is correct, no errors in browser console.

---

### TC-02: Copy Key to Clipboard

**Steps:**
1. Complete TC-01
2. Click the "Copy" button next to the generated key

**Expected:**
- Button text changes to "Copied!" for ~2 seconds
- Key is in the clipboard (paste somewhere to verify)

**Pass criteria:** Key pastes correctly from clipboard.

**Edge case:** Test on HTTP (non-HTTPS) — the fallback copy mechanism should work via `document.execCommand('copy')`.

---

### TC-03: Import Settings from Remote (Happy Path)

**Steps:**
1. Complete TC-01 and TC-02 on the **Source** site
2. On the **Source** site, go to Complianz > Settings and note the values of:
   - Region selection
   - Organisation name
   - Cookie banner position
   - Cookie banner primary color
3. Log in to the **Receiver** site as admin
4. Navigate to Complianz > Tools > Data > Share Settings
5. Enter the Source site URL (e.g., `https://source-site.com`)
6. Paste the share key
7. Click "Import from Remote Site"

**Expected:**
- Success notification: "Successfully imported: settings, banners"
- The page reloads field data automatically

**Verification:**
8. Navigate to Complianz > Settings and verify:
   - Region selection matches Source
   - Organisation name matches Source
9. Navigate to Complianz > Cookie Banner and verify:
   - Banner position matches Source
   - Primary color matches Source
   - Logo is **empty** (not transferred)

**Pass criteria:** All settings and banner styling match the Source site. Logo is not set.

---

### TC-04: Import with Invalid Key

**Steps:**
1. On the **Receiver** site, go to Share Settings
2. Enter a valid Source site URL
3. Enter an obviously wrong key: `abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`
4. Click "Import from Remote Site"

**Expected:**
- Error message: "Invalid share key."
- No settings are modified on the Receiver

**Pass criteria:** Clear error shown, no data changed.

---

### TC-05: Import with Malformed Key

**Steps:**
1. Enter a short key: `abc123`
2. Click "Import from Remote Site"

**Expected:**
- Error message about invalid key format
- Request should fail client-side or on the remote endpoint

**Pass criteria:** Error shown, no import attempt with bad key format.

---

### TC-06: Import with Expired Key

**Steps:**
1. Generate a key on the Source site
2. Wait 24 hours (or manually delete the transient: `cmplz_share_key` from the `cmplz_transients` option)
3. Attempt to import on the Receiver using the expired key

**Expected:**
- Error message: "No active share key found. The key may have expired."

**Pass criteria:** Clear expiry message, no data imported.

**Shortcut for testing:** Use a database tool or WP-CLI to manually delete the transient:
```sql
-- Find the cmplz_transients option and remove the cmplz_share_key entry
```
Or via PHP:
```php
cmplz_delete_transient('cmplz_share_key');
```

---

### TC-07: Import with Wrong URL

**Steps:**
1. Generate a valid key on the Source site
2. On the Receiver, enter a URL that doesn't run Complianz (e.g., `https://google.com`)
3. Paste the valid key
4. Click Import

**Expected:**
- Error message about connection failure or invalid response

**Pass criteria:** Clear error, no crash, no data modified.

---

### TC-08: Import with Unreachable URL

**Steps:**
1. Enter a URL that doesn't resolve: `https://does-not-exist-12345.com`
2. Enter any 64-char hex key
3. Click Import

**Expected:**
- Error message: "Could not connect to the remote site: ..."
- Loading state appears and eventually resolves

**Pass criteria:** Network error handled gracefully with user-facing message.

---

### TC-09: Multiple Downloads with Same Key

**Steps:**
1. Generate a key on the Source site
2. Import on Receiver site A — should succeed
3. Import on Receiver site B (or same site again) — should also succeed
4. Import a third time — should still succeed

**Expected:**
- All three imports succeed (key is valid for 24h, not single-use)

**Pass criteria:** Key remains valid for multiple uses within 24h window.

---

### TC-10: Generating New Key Invalidates Previous

**Steps:**
1. Generate Key A on Source
2. Copy Key A
3. Generate Key B on Source (new key)
4. Try to import on Receiver using Key A

**Expected:**
- Key A fails: "Invalid share key."
- Key B works

**Pass criteria:** Only the latest key is valid.

---

### TC-11: Rate Limiting

**Steps:**
1. Generate a key on the Source site
2. From the Receiver, attempt to import with wrong keys 5 times in a row
3. On the 6th attempt (even with the correct key), observe the response

**Expected:**
- First 5 attempts: "Invalid share key." (403)
- 6th attempt: "Too many failed attempts. Please try again later." (429)

**Pass criteria:** Rate limiting kicks in after 5 failures. Resets after 1 hour.

---

### TC-12: Non-Admin Cannot Generate Key

**Steps:**
1. Log in to the Source site as a user with Editor or Subscriber role
2. Navigate to Complianz > Tools > Data

**Expected:**
- The Share Settings section should not be actionable (the `cmplz_user_can_manage()` check blocks it)
- If they somehow call the API directly, the response is: `{ "success": false, "message": "Unauthorized." }`

**Pass criteria:** Non-admin users cannot generate keys or import settings.

---

### TC-13: Non-Admin Cannot Import

**Steps:**
1. Log in to the Receiver site as a Subscriber
2. Attempt to call the import action directly (via browser console or API tool)

**Expected:**
- Response: `{ "success": false, "message": "Unauthorized." }`

**Pass criteria:** Import blocked for non-admin roles.

---

### TC-14: XSS Prevention on Import

**Steps:**
1. On the Source site, set the organisation name to: `<script>alert('xss')</script>Acme Corp`
2. Generate a key and import on the Receiver

**Expected:**
- The `<script>` tag is stripped during import
- Organisation name on Receiver shows: `Acme Corp` (or `alert('xss')Acme Corp` without script tags)
- No JavaScript executes

**Pass criteria:** Script tags stripped, no XSS execution.

---

### TC-15: Banner Colors and Styling Transfer

**Steps:**
1. On the Source site, customize the cookie banner:
   - Set background color to `#FF0000` (red)
   - Set text color to `#FFFFFF` (white)
   - Set accept button color to `#00FF00` (green)
   - Set border radius to 12px
   - Set position to "bottom-left"
   - Set animation to "slide"
2. Generate key and import on Receiver

**Expected:**
- All color values match on the Receiver banner settings
- Border radius is 12px
- Position is "bottom-left"
- Animation is "slide"

**Pass criteria:** All visual banner properties transfer correctly.

---

### TC-16: A/B Testing Flags Not Transferred

**Steps:**
1. On the Source site, enable A/B testing (if available)
2. Generate key and import on Receiver

**Expected:**
- A/B testing is NOT enabled on the Receiver
- The `a_b_testing` and `a_b_testing_buttons` settings are stripped during import

**Pass criteria:** A/B testing flags do not transfer.

---

### TC-17: Import with Empty Fields (Client-Side Validation)

**Steps:**
1. On the Receiver, leave both URL and Key fields empty
2. Click "Import from Remote Site"

**Expected:**
- Button is disabled (greyed out) when fields are empty
- If somehow clicked, shows: "Please provide both a site URL and a share key."

**Pass criteria:** Client-side validation prevents empty submissions.

---

### TC-18: Loading States

**Steps:**
1. Click "Generate Share Key" and observe the button
2. Click "Import from Remote Site" and observe the button

**Expected:**
- Both buttons show a loading spinner while the operation is in progress
- Both buttons are disabled during loading to prevent double-clicks

**Pass criteria:** Loading indicators visible, buttons disabled during operations.

---

## Regression Checks

| Area | What to verify |
|---|---|
| Existing Export | The "Export settings" button still downloads a JSON file |
| Existing Import | The "Import" field (if premium) still appears and functions |
| Reset | The "Reset" button still works |
| Cookie Banner | After import, the cookie banner renders correctly on the frontend |
| Wizard | The setup wizard still loads and functions after import |
| Settings Save | Saving settings on the Receiver after import works normally |

---

## Environment Matrix

| Environment | Priority | Notes |
|---|---|---|
| Production HTTPS | **High** | Primary use case |
| Local HTTP (localhost) | Medium | Dev testing, SSL verification bypassed |
| Multisite (subsite to subsite) | Medium | Each subsite has its own key |
| Behind CDN/proxy | Low | Verify POST body not cached/stripped |
| PHP 7.4 | **High** | Minimum supported version |
| PHP 8.0+ | **High** | Primary target |
