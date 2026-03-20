# PLAN: Admin Dark Mode

**Spec:** `docs/specs/SPEC-dark-mode.md`
**Status:** Complete
**Estimated complexity:** M (4 tasks, ~300 lines total)

## Decisions (confirmed by user)
- **Admin-only** — cookie banner frontend not affected
- **Follow system by default**, manual toggle to override (light/dark/system)
- Preference saved per user

## Existing Foundation
- CSS variable system: `assets/css/variables.scss` (~40 semantic vars)
- Dark mode override block: already drafted in `assets/css/admin/theme.scss` (commented out)
- Dark mode import: commented out in `assets/css/admin.scss`
- 69 hardcoded colors across SCSS to replace

---

## Task 1 — Activate dark mode CSS and replace hardcoded colors

**Size:** M (~150 lines of SCSS changes)
**Status:** Complete
**Files:**
- `assets/css/admin/theme.scss` — uncomment and finalize dark mode block
- `assets/css/admin.scss` — uncomment dark mode import
- `assets/css/admin/modules/date-range.scss` — replace ~15 hardcoded colors
- `assets/css/admin/modules/modal.scss` — replace ~3 hardcoded whites
- `assets/css/admin/modules/inputs/Buttons.scss` — replace button color vars
- `assets/css/admin/modules/toast/_variables.scss` — replace toast bg/text colors
- `assets/css/admin/states.scss` — replace loader colors
- `assets/css/admin/modules/placeholder.scss` — replace background
- `assets/css/admin/modules/wizard/premium-fields.scss` — replace text color

**Description:**
Uncomment the existing dark mode CSS variable overrides in `theme.scss`, then replace all 69 hardcoded color values across SCSS files with existing CSS variables. The dark mode block uses `[data-theme="dark"]` selector on the `#complianz` wrapper div, so it doesn't affect the rest of wp-admin.

**Acceptance Criteria:**
1. `[data-theme="dark"] { ... }` block active in compiled CSS with all color overrides
2. Zero hardcoded `#fff`, `#000`, `white`, `black`, `rgb(255,255,255)` in admin SCSS (except in variable definitions)
3. All replaced values reference existing `--rsp-*` CSS variables
4. SCSS compiles without errors
5. Light mode visually unchanged (regression check)
6. Dark mode visually correct — no white-on-white or black-on-black text

---

## Task 2 — Add theme toggle React component and user preference

**Size:** M (~100 lines)
**Status:** Complete
**Files:**
- `settings/src/Settings/ThemeToggle.js` (new) — toggle component (light/dark/system icons)
- `settings/src/Header.js` — add ThemeToggle to header bar
- `settings/src/utils/theme.js` (new) — theme detection + persistence logic
- `settings/settings.php` — pass saved theme preference to JS via `wp_localize_script`

**Description:**
Add a 3-state toggle (☀️ light / 🌙 dark / 💻 system) to the admin header. On mount, read saved preference from `cmplz_settings.theme_preference`. Apply `data-theme` attribute to `#complianz` wrapper. Save changes via REST `do_action/save_theme_preference`.

**Acceptance Criteria:**
1. Toggle visible in admin header with 3 states: light, dark, system
2. Clicking cycles through states and immediately updates the UI
3. Preference saved to `usermeta` via REST call
4. On page load, correct theme applied before React hydration (no flash)
5. System mode responds to OS `prefers-color-scheme` changes in real-time
6. Default is "system" for new users

---

## Task 3 — Fix component-specific dark mode issues

**Size:** S (~50 lines)
**Status:** Complete (ToastContainer theme made dynamic, all hardcoded colors replaced)
**Files:**
- `settings/src/Page.js` — make ToastContainer theme dynamic
- `settings/src/Settings/ColorPicker/ColorPickerControl.js` — ensure color swatches visible in dark mode
- `settings/src/Settings/CookieBannerPreview/CookieBannerPreview.js` — ensure preview renders with its own colors, not affected by dark mode

**Description:**
Fix React components that have hardcoded theme assumptions. ToastContainer needs dynamic `theme` prop. Color picker swatches need visible borders in dark mode. Banner preview must be isolated from dark mode (it shows the actual frontend banner colors).

**Acceptance Criteria:**
1. Toast notifications render correctly in both light and dark mode
2. Color picker swatches have visible borders in dark mode
3. Cookie banner preview NOT affected by dark mode (shows real banner colors)
4. No inline `backgroundColor: '#fff'` or similar in React components
5. `npm run build` succeeds with 0 errors

---

## Task 4 — Tests, SCSS compilation, and visual verification

**Size:** S (~40 lines)
**Status:** Complete
**Files:**
- `tests/test-dark-mode.php` (new) — test preference save/load
- All SCSS files — final compilation check

**Description:**
Add PHPUnit tests for the theme preference save/load via usermeta. Compile SCSS. Visual smoke test in both modes.

**Acceptance Criteria:**
1. Test: default preference is "system" when no usermeta exists
2. Test: saving "dark" preference stores correctly in usermeta
3. Test: saving invalid value rejected
4. Test: non-admin user can save their own preference
5. `cd settings && npm run build && cd .. && ./vendor/bin/phpunit` passes
6. Smoke test: admin loads correctly in light mode, dark mode, and system mode

---

## Dependency Order

```
Task 1 (CSS foundation)
  └─> Task 2 (React toggle + preference) — needs CSS to be in place
  └─> Task 3 (component fixes) — can run parallel with Task 2
        └─> Task 4 (tests + verification) — after all changes
```

Tasks 2 and 3 can run in parallel after Task 1.

---

## Risks & Decisions
- **No flash on load:** The `data-theme` attribute must be set via inline PHP/JS before React mounts. A small inline script in `settings.php` that reads the preference and sets the attribute.
- **Banner preview isolation:** The banner preview in settings must NOT inherit dark mode colors. Scope dark mode to `#complianz` but exclude `.cmplz-cookiebanner-preview` with explicit light-mode variable resets.
- **Third-party components:** date-range picker (Material UI) and react-color may need additional CSS overrides.
- **No integration impact:** Dark mode is admin-only CSS. No effect on frontend banner, cookie blocking, or integrations.
