# ADR-008: The banner preview renders like the frontend banner; legacy leaks are not recreated

## Status

Accepted

Source: input technical spec (draft 2026-10-01), decision D14, §4.5. Recorded 2026-10-06 during /flow:spec for 001-settings-ui-redesign.

## Context

`settings/src/Settings/CookieBannerPreview/` injects the real frontend banner markup (`#cmplz-cookiebanner-container .cmplz-cookiebanner`) and server-generated preview CSS straight into the admin DOM inside `#complianz`, with no iframe or shadow root (§3.4). The preview therefore receives legacy admin rules the frontend banner never gets: the element resets nested in the `.cmplz` rule of `assets/css/admin/base.scss` (margins and padding on `p`, `ul`, `h1`–`h6`, `img { height: auto }`, the `a` font size) and the global `button { all: unset; }` reset, so admins can see a banner that differs from what visitors see. It also inherits typography (font family, size, line height, colour, letter-spacing, numeric variant) from its ancestors, which the redesign changes. Admin-only rules in `assets/css/admin/modules/CookieBannerPreview.scss` reposition the fixed banner for the preview.

## Decision

We keep the banner preview in a `data-cmplz-isolate="preview"` zone without recreating the legacy leaks, hold it identical to its baseline through Phases 1–4, re-baseline it in Phase 5 after a reviewed diff and a spot check against the frontend banner, and pin only its inherited typography to the legacy `.cmplz` values.

## Alternatives considered

- **Recreate the leaks to keep pixel parity with today's preview**: lost because the preview would keep differing from the real frontend banner (§4.5).
- **Let the preview inherit the redesigned app typography**: lost because the preview would then change whenever the app's typography does; pinned legacy values keep it independent of the redesign (§4.5).

## Consequences

- No Tailwind classes go on the injected markup, the scoped base skips the zone without adding specificity (ADR-001, FR-005), and the frontend banner classes in the preview stay untouched (exempt from FR-020).
- The positioning rules move to `settings/src/styles/vendors/preview.css`, scoped to the zone and rewritten with logical properties (`inset-inline-end` instead of `right`). The off-canvas `translateX` below 1800px gets an explicit `[dir="rtl"]` rule, a documented exception to the logical-only rule (ADR-007). The 200px bottom margin that keeps the Save button visible above a bottom banner becomes a utility on the redesigned screen.
- `preview.css` sets the inherited typography on the zone root as commented literals of the legacy `.cmplz` values (`assets/css/admin/base.scss`, lines 1–15). The preview then matches the frontend except for typography, which on the frontend comes from the site theme.
- Enforced by FR-008 of the input spec: element screenshots of `[data-cmplz-isolate="preview"] .cmplz-cookiebanner` and `#cmplz-manage-consent` per banner layout at 1920×1080 (above the 1800px breakpoint, so no translate applies) with animations disabled. The baseline is captured on the legacy markup with the equivalent legacy selectors, and redesigning the surrounding screen does not affect the comparison.
- Phase 5 removes the leaks by deleting `legacy-globals.scss` and dropping `admin.css` from the settings screens (ADR-005). The re-baseline compares the preview with the frontend banner rendered with the same settings, and the release notes list the change as a preview fidelity fix.
- Harder: admins see the preview change at release, and the new semantic tokens must avoid every `--cmplz-*` name the frontend banner CSS uses, because tokens declared on `#complianz` reach the preview (ADR-004).

Related: ADR-001, ADR-004, ADR-005, ADR-007
