# SPEC: Admin Dark Mode

## Summary
Add dark mode to the Complianz admin UI. Follows system preference by default, with a manual toggle to override. Admin-only — the frontend cookie banner is not affected (it has its own user-configurable colors).

## Motivation
Many developers work in dark mode. The Complianz admin pages currently render as bright white regardless of OS/browser preference, causing visual strain and inconsistency with dark-themed WordPress dashboards.

## Scope
- **In scope:** Complianz admin pages (Dashboard, Settings, Wizard, Tools)
- **Out of scope:** Frontend cookie banner, public-facing policy documents

## User Flow
1. By default, Complianz follows the OS/browser `prefers-color-scheme` setting
2. A toggle in the admin header allows manual override (light/dark/system)
3. Preference is saved per user via `usermeta`
4. On page load, the saved preference is applied before React renders (no flash)

## Technical Context
- CSS variable system already exists in `assets/css/variables.scss` (~40 semantic color vars)
- A dark mode override block is already drafted (commented out) in `assets/css/admin/theme.scss`
- A dark mode SCSS import is commented out in `assets/css/admin.scss`
- 69 hardcoded color values across SCSS files need replacing with CSS variables
- ToastContainer in `Page.js` has a hardcoded `theme="light"` prop
- No React theme context exists yet

## Acceptance Criteria
1. Admin UI renders in dark mode when OS prefers dark
2. Toggle in header switches between light/dark/system
3. Preference persists across page loads (saved per user)
4. No flash of wrong theme on page load
5. All admin pages readable in dark mode (no white-on-white or black-on-black text)
6. Cookie banner preview in settings still shows accurate colors
7. Toast notifications respect dark mode
8. Modal dialogs respect dark mode
9. Date range picker respects dark mode
