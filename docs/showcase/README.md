# Design showcase — `design-dashboard-ctas`

> **This branch is a design showcase, not production code.** It demonstrates redesigned
> upsell / onboarding / dashboard / consent-banner surfaces for the Complianz GDPR free
> edition. It must **never** be merged toward `master` or the wordpress.org stable tag.
> It is cut from the shipped feature-001 line (`v7.6.0-rc1`, which *is* code-complete) and
> layers demo scaffolding on top. Before any of this ships, the **[Showcase-only — strip
> before production](#showcase-only--strip-before-production)** section must be worked through.

This document is the handoff for a developer continuing the fork. It covers how to run it,
what each change does, what is a real reusable primitive vs. demo scaffolding, and the known
cleanup items.

---

## 1. Branch & remote facts

| | |
|---|---|
| Branch | `design-dashboard-ctas` |
| Remote | `origin` = `https://github.com/AeiltAbraham/complianz-gdpr.git` (public fork) |
| Base | Cut from `001-settings-ui-redesign` at commit `3bacc677` (that base is on `origin`) |
| Unique commits | ~37 commits on top of the base (the showcase) |
| Upstream of record | `complianz/complianz-gdpr` (the `upstream` remote) — do not push the showcase there |

The React app lives in `settings/src/`. Field/menu/block config and the REST routes are in
`settings/config/` and `settings/settings.php`. See the root `CLAUDE.md` for the full
workspace conventions (ADRs, the commit gate, coding standards).

---

## 2. Running it

The admin UI is a webpack React build. On this showcase branch the **compiled output is
committed** (`settings/build/`, a deliberate deviation from ADR-006) so the fork runs in
`wp-env` without a build step — a fresh checkout works as-is.

```bash
# from the repo root
npx wp-env start            # boots WordPress + MySQL in Docker; prints the URL + port
```

Then open the printed admin URL (default dev login `admin` / `password`) and go to
**Complianz → any page**, i.e. `wp-admin/admin.php?page=complianz`.

**If you edit anything under `settings/src/`, you must rebuild**, or the committed build (and
the running UI) won't reflect your change:

```bash
npm --prefix settings ci          # first time only
npm --prefix settings run build   # after every source change
git add settings/build            # this branch commits the build — keep it in sync
```

> ⚠️ **Build/source drift trap.** The commit gate stages only PHP for its checks; it does
> **not** rebuild JS. It is easy to commit a source change and forget the build, which ships
> a stale UI (this already happened once — the gold-crown source landed with a pre-gold build;
> fixed in `build(showcase): compile the settings app to match source`). After touching
> `settings/src/`, always rebuild and commit `settings/build/` in the same change.

---

## 3. The Customer Preview harness (how to drive the demo)

Most of the showcase is gated on a demo "customer state" so one install can present three
audiences. **This entire harness is showcase-only** (see
[§5](#showcase-only--strip-before-production)).

- A floating **"Customer Preview"** card sits bottom-right on every settings page
  (`settings/src/preview/CustomerPreviewLauncher.js`, mounted unconditionally in `Page.js`).
- It writes a state read by `getCustomerState()` (`settings/src/preview/customerState.js`):
  `'new' | 'current' | 'unauthenticated' | null`.
- Resolution order: the **`?cmplz_customer=` URL param first**, then the localStorage key
  `cmplz_preview_customer`. The param is shareable and survives in-app `#hash` routing;
  localStorage is the fallback for a param-less reload.
- You can drive it by URL directly, e.g.
  `wp-admin/admin.php?page=complianz&cmplz_customer=new#banner/appearance`
  (also `=current`, `=unauthenticated`).
- **"Open onboarding ▸"** in the launcher adds the `websitescan` param (keeping
  `cmplz_customer`), which makes `Page.js` lazy-mount the onboarding modal in that audience.
- It is a **visual override only** — it never touches real WordPress Site Control (WSC) auth
  or dismissed DB flags. With **no** state set, `getCustomerState()` returns `null` and every
  consumer no-ops, so the app renders exactly as baseline.

> To get the real, unmodified app back: clear **both** the `?cmplz_customer` param **and** the
> localStorage key `cmplz_preview_customer`.

The state key is `unauthenticated` even though the launcher labels it "Current · unauthenticated".

---

## 4. Feature map

Five bundles. Each lists what it does, where it lives, and how to see it.

### 4.1 Dashboard — 3-up feature-CTA row
- **What:** The bottom dashboard row (was Tips & Tricks + Other Plugins) is now three
  config-driven promo cards: a wide **Upgrade to Premium** card (gold crown, "Go Pro",
  "Free plan" pill, usage-metrics legend) + **TCF v2.4** + **Geolocation**, laid out 50/25/25.
  Each card's button opens a shared Radix upsell modal.
- **Where:** `settings/src/Dashboard/FeatureCTAs/FeatureCTA.js` (the card + per-block `MODALS`
  / `METRICS` / `ICONS` maps), `settings/src/Dashboard/GridBlock.js` (card frame / width-variant
  mapping), `settings/config/blocks.php` (the three `cta-*` block definitions),
  `settings/src/styles/components.css` (the auto-fit grid rule).
- **View:** `#dashboard`, any customer state (identical across states — not coupled to the harness).

### 4.2 Onboarding — per-audience flow
- **What:** The website-scan onboarding modal is now a per-audience flow. One zustand store
  (`NewOnboardingData.js`) drives a Radix Dialog (`NewOnboarding.js`) whose entry step and copy
  diverge by audience: **new** → `Welcome` (email + premium-license card), **current** →
  `BannerUpdate` (banner-changed + upgrade offer), **unauthenticated** → `ServiceDisruption`
  (paused-services list) → verify. The old `ThankYou` step was deleted; the final `Plugins`
  step now hands off to `#wizard`.
- **Where:** `settings/src/Onboarding/NewOnboarding.js`, `NewOnboardingData.js`,
  `steps/{Welcome,BannerUpdate,ServiceDisruption,Plugins}.js`,
  `components/{PremiumLicense,CommunicationHistory}.js`.
- **View:** pick an audience in the launcher, then **"Open onboarding ▸"**; or by URL
  `…&websitescan&cmplz_customer=new`.

### 4.3 Consent Banner — per-customer differentiation
- **What:** On `#banner/*`, new/unauthenticated customers see Appearance/Colors/Texts rendered
  as premium-locked (dimmed, non-clickable, gold crown) + a "Premium design" upsell card in the
  submenu; the Notifications sidebar leads with a **red** notice (unauthenticated →
  "Authenticate your domain", current → "Your consent banner has changed"); and a **new**
  customer's live banner preview is re-skinned **green**.
- **Where:** `settings/src/Menu/{Menu,MenuItem}.js`, `settings/src/Settings/Settings.js`,
  `settings/src/Settings/Help.js` (the `error`→red tint branch),
  `settings/src/Settings/CookieBannerPreview/CookieBannerPreview.js` (`NEW_CUSTOMER_BANNER_CSS`).
- **View:** `#banner/appearance` in each state.

### 4.4 Premium upsells (field + support)
- **What:** The field "Upgrade" pill became a contextual **callout** (first premium field on a
  wizard page) / **inline crown** (the rest) that opens a shared modal, with copy keyed by field
  id (`UPSELLS`, e.g. `regions` → geo-targeting). The generic locked-scrim over **Tools →
  Support** became a flattened **Premium Support** block rendered straight in the Support card,
  with the card title swapped to a crown + "Premium Support".
- **Where:** `settings/src/Settings/Premium.js`,
  `settings/src/Settings/Support/PremiumSupportBlock.js`, `settings/src/Settings/SettingsGroup.js`
  (the wiring), `settings/src/Settings/Fields/{Field,LabelWrapper}.js`.
- **View:** `#tools/support` (support block); `#wizard` (callout + inline crowns). Gated on
  `cmplz_settings.is_premium` (PHP global) — **not** the preview state.

### 4.5 Design-system additions
- **What:** `--cmplz-premium-gold: #d4a017` (the gold crown signifier — showcase), plus genuine
  reusable work: `--cmplz-space-xl: 32px` (standardizes modal padding, consumed by
  `Dialog.js`/`AlertDialog.js`), `iconColors['orange-strong'] = #b45309`, the `Alert.js` C-2 card
  refactor + compact variant, and a **real bug fix** in `base.css` (Tailwind transform-var
  defaults — with Preflight off these were undefined, which silently broke the Switch thumb slide
  and the Panel/Help chevron rotate).
- **Where:** `settings/src/styles/tokens.css`, `settings/src/styles/base.css`,
  `settings/src/utils/{Alert,Icon}.js`, `settings/src/components/ui/{Dialog,AlertDialog}.js`.

---

## 5. Showcase-only — strip before production

Everything here is demo scaffolding or fake data. The guard pattern is deletion-friendly:
`getCustomerState()` returns `null` by default and every consumer no-ops, so removing the
`preview/` folder + the guarded branches restores exact baseline behaviour with no logic rework.

> ⚠️ **Delete the `preview/` folder and the import/branch in each consumer *together*** —
> deleting the folder alone leaves dangling imports and **breaks the webpack build**.

**The harness itself**
- Delete `settings/src/preview/` entirely (`customerState.js`, `CustomerPreviewLauncher.js`,
  `CustomerNotice.js`).
- Remove the `<CustomerPreviewLauncher/>` render + import in `settings/src/Page.js`.
- localStorage keys `cmplz_preview_customer`, `cmplz_customer_launcher_collapsed` and the
  `cmplz_customer` URL param are demo-only (not a settings contract).

**`getCustomerState()` consumers** (remove the import + its guarded branch in each):
- `Settings/Settings.js` — `<CustomerNotice/>` render + the injected red (`label:'error'`)
  Notifications block.
- `Settings/CookieBannerPreview/CookieBannerPreview.js` — the `NEW_CUSTOMER_BANNER_CSS`
  constant + the `state === 'new'` `<style>` injection.
- `Menu/Menu.js` — the "Premium design" upsell card branch.
- `Menu/MenuItem.js` — `BANNER_LOCKED_IDS` + the `locked` nav-disabling branch.
- `Onboarding/NewOnboarding.js` — the audience-override block (forces the modal + picks the
  variant regardless of real auth flags).

**Coupled onboarding scaffolding** (fed by the same state — treat as part of the teardown):
- `Onboarding/NewOnboardingData.js` — the `variant` state + per-audience branching.
- `Onboarding/steps/Welcome.js` — the `VARIANT_INTRO` copy wrapper.
- Delete `Onboarding/steps/ServiceDisruption.js`, `Onboarding/steps/BannerUpdate.js`,
  `Onboarding/components/PremiumLicense.js`, `Onboarding/components/CommunicationHistory.js`,
  and drop the `serviceDisruption`/`bannerUpdate` entries from the `steps` graph.

**Fake / placeholder data (replace with real sources or remove):**
- `Dashboard/FeatureCTAs/FeatureCTA.js` `METRICS` — "43/50 posts", "Scanned yesterday",
  "Synced yesterday" are hardcoded; wire to real post-count / last-scan / last-sync or remove
  (the "Free plan" pill + legend render only for `cta-premium`).
- `Onboarding/steps/BannerUpdate.js` — `PROMO_CODE='BANNER50'`, the "50% off" badge,
  `PROMO_EXPIRY`, `POST_LIMIT`, `POST_COUNT`, `DAYS_LEFT` are literals; no promo/entitlement
  backend is wired.
- `Onboarding/components/CommunicationHistory.js` — the `HISTORY` rows are illustrative.
- `Onboarding/components/PremiumLicense.js` — the key field is visual only (no activate handler).
- `cta-tcf` / `cta-geolocation` hrefs point at the generic `complianz.io/` placeholder;
  `Plugins.js` `ARTICLE_URL` is a placeholder doc link.
- `CustomerNotice.js` copy is explicit placeholder text (several strings end in "(placeholder)").

**Design proposals pending the reserved maintainer design sign-off** (not showcase scaffolding,
but they re-baseline visual snapshots, so they can't land on feature-001 as-is):
- `--cmplz-premium-gold` / the gold-crown treatment.
- The `Premium.js` callout/crown/modal redesign and the flattened `PremiumSupportBlock`
  (they replace shipped baseline screens — the pill and the generic locked scrim).

---

## 6. Reusable production code (worth keeping)

Even if the audiences are trimmed, these are genuine, well-structured primitives:

- **Radix Dialog migration** of the onboarding shell (`NewOnboarding.js`) — real focus trap,
  `role=dialog`/`aria-modal`, Esc-dismiss, portal into the `#complianz-portal-root` island,
  `onInteractOutside` prevented. Plus the store's real REST plumbing (`signup_wsc`,
  `signup_newsletter`, `dismiss_wsc_onboarding`, terms fetch, `isValidEmail`) and the
  `closeModal(true)` (persist dismissal) vs `closeModal()` (DB-neutral) distinction.
- **Config-driven dashboard cards** — chrome/copy from `blocks.php` (translatable), richer modal
  copy from the JS `MODALS` map; `GridBlock.js`'s width/variant → literal-tw-class architecture
  and the `cmplz_normalize_blocks()` PHP normalizer are backward-compatible (the `cmplz_blocks`
  filter + signature unchanged; unknown widths warn + degrade). Each block is in an
  `ErrorBoundary`.
- **`Alert.js` C-2 card** + compact variant — already consumed by WebSiteScanStatus, CookieScan,
  Integrations, CookieDatabaseSync.
- **`--cmplz-space-xl` token** and the **`base.css` transform-var fix** — keep regardless of the
  showcase outcome (the transform fix is a real latent bug fix, not premium-specific).
- **`Help.js` `error`→`DANGER_TINT` branch** — a self-contained design-system extension reusing
  the pre-existing `--cmplz-danger-surface` token; harmless even when nothing triggers it.
- The guarded-branch pattern itself and `customerState.js`'s defensive try/catch I/O are good
  patterns if any surface is promoted to drive off the *real* WSC auth state (the genuine
  client-id/secret check already exists at `NewOnboarding.js:61-62`).

---

## 7. Known dead code / cleanup TODOs

Surfaced while documenting; safe to clean when productionising:

- `Dashboard/GridBlock.js` — the `fullWidth` / `tw-col-span-full` branch is no longer exercised
  (leftover from the first CTA iteration, replaced by the 50/25/25 grid blocks). It also still
  imports/registers `TipsTricks`, `TipsTricksFooter`, `OtherPlugins`, `OtherPluginsHeader`, which
  `blocks.php` no longer references; the `Dashboard/TipsTricks` and `Dashboard/OtherPlugins`
  directories still exist.
- `Onboarding/NewOnboardingData.js` — `suggestedPlugins`, `fetchPlugins`,
  `handlePluginInstallation`, `enablePluginInstallation`, `isInstalling` remain in the store but
  no step renders the plugin picker anymore.
- `FeatureCTA.js` — the metric "warning" tone uses a raw literal (`tw-text-[#b45309]`) instead of
  a `--cmplz-*` token; normalize if it graduates.
- The **Crown** glyph is duplicated as a local inline SVG in 7 files (`Premium.js`,
  `PremiumSupportBlock.js`, `Dashboard/FeatureCTAs/FeatureCTA.js`, `Menu/Menu.js`,
  `Menu/MenuItem.js`, `Onboarding/components/PremiumLicense.js`, and the field crown) per the
  project's per-file icon convention — a stroke/shape change must be made in all of them. Only the
  Crown uses `stroke=var(--cmplz-premium-gold,#d4a017)`; the literal fallback matters because it
  renders in markerless contexts (menu, dashboard) outside the token island.

---

## 8. Gotchas quick reference

- **Onboarding modal only mounts with the `websitescan` URL param** — no param, no modal,
  regardless of `cmplz_customer`.
- **`getCustomerState()` is a synchronous render-time read, not a React hook** — there's no
  reactivity, which is why switching state does a full-page reload (`window.location.assign`).
  Preserve that if you refactor.
- **`closeModal()` arg matters:** no-arg = DB-neutral close (BannerUpdate "Understood",
  Plugins "Start the Wizard"); `closeModal(true)` persists a dismissal via REST (×, Esc,
  ServiceDisruption "Not now"). Changing this changes what's written to the DB.
- **The launcher uses `tw-pointer-events-auto`** so it stays clickable while an open Radix modal
  sets `body { pointer-events: none }`. Any sibling control over the modal needs the same.
- **Premium upsells are gated on `cmplz_settings.is_premium`** (PHP global), not the preview
  state — they render for the free edition in every state and vanish in a premium build.
- **The callout-vs-crown split only happens on the wizard** (`SettingsGroup` sets
  `firstPremiumId` to `null` elsewhere) — other pages get only the inline crown.
- **`NEW_CUSTOMER_BANNER_CSS` is coupled to the preview container id
  `#cmplz-preview-banner-container`** and the live-banner class hooks; if the banner markup
  changes, the green override silently no-ops.

---

*Generated as a developer handoff for the `design-dashboard-ctas` showcase branch.*
