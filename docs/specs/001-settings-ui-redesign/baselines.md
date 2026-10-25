# 001 — SC-03 / SC-04 asset-weight baselines

The settings-screen asset weights that success criteria **SC-03** (the settings screens
download *less styling* than today) and **SC-04** (*less script*, by at least the weight
of the removed component sets) are measured against at release. Both criteria consume the
numbers below; the release build re-runs the same tool and compares.

## Tool

`scripts/report-asset-weight.sh` (run by the T-003 proof):

```
sh scripts/report-asset-weight.sh            # measures the repo it lives in
sh scripts/report-asset-weight.sh ROOT       # measures an alternate plugin root
```

It prints, to stdout only, the raw and gzip byte size of each group a settings-screen
visitor downloads. It makes no network calls and creates no files.

Method (kept identical at release so the comparison is apples-to-apples):

- **raw** — `wc -c < FILE`.
- **gzip** — `gzip -c FILE | wc -c`, gzip's default compression level.
- **group figure** — the **sum over the group's files** for both raw and gzip; each chunk
  is fetched and compressed independently over the wire, so the gzip figure is the sum of
  the per-file gzip sizes, not the gzip of the concatenation.
- **groups** — `assets/css/admin.min.css`; `settings/build/*.css` (chunk CSS); the entry
  `settings/build/index.*.js`; and all other `settings/build/*.js`.

## Baseline (fresh build) — the SC-03 / SC-04 comparison point

Captured from a fresh `npm run build:all` (root) at the state below, then the build output
was restored (ADR-006: build artifacts are not committed on work branches).

- Commit: `8f2861c1`
- Date: 2026-10-07
- Toolchain: Node 24; `@wordpress/scripts` 30.27.0 (settings bundle); gulp + sass 1.76.0
  (admin CSS) — the T-001/T-002 manifests.

| Group | File(s) | raw (bytes) | gzip (bytes) |
|---|---|--:|--:|
| legacy admin CSS | `assets/css/admin.min.css` | 98434 | 16572 |
| settings chunk CSS | `settings/build/*.css` | 81330 | 22598 |
| settings entry JS | `settings/build/index.*.js` | 260658 | 86367 |
| settings other JS | `settings/build/*.js` sans entry | 3677301 | 1056828 |

- **SC-03 (styling = CSS)** gzip subtotal: 16572 + 22598 = **39170 bytes** (≈ 38.3 KiB);
  raw 98434 + 81330 = 179764 bytes.
- **SC-04 (script = JS)** gzip subtotal: 86367 + 1056828 = **1143195 bytes** (≈ 1.09 MiB);
  raw 260658 + 3677301 = 3937959 bytes.

**Why the fresh build is the comparison point (not the shipped bundle):** the release ships
a fresh build too, so comparing a fresh pre-migration build against a fresh post-migration
build isolates the migration's effect (removed component sets, retired SCSS) from toolchain
drift introduced by rebuilding 7.5.5 with the reconstructed Node/webpack/sass toolchain.

## Context (shipped 7.5.5 bundle)

The tracked build output as committed on this branch (inherited from 7.5.5) — what customers
download today. Recorded for context only; **not** the SC-03/SC-04 comparison point. It is
heavier/lighter than the fresh build purely because of toolchain drift: the reconstructed
`@wordpress/scripts` emits a larger JS bundle (entry 236028 → 260658; other 3517272 →
3677301), and the rebuilt `admin.css` adds rules its SCSS already had (97916 → 98434) — both
recorded in the T-001 and T-002 outcomes, neither caused by any migration work.

| Group | File(s) | raw (bytes) | gzip (bytes) |
|---|---|--:|--:|
| legacy admin CSS | `assets/css/admin.min.css` | 97916 | 16460 |
| settings chunk CSS | `settings/build/*.css` | 81514 | 22640 |
| settings entry JS | `settings/build/index.*.js` | 236028 | 79807 |
| settings other JS | `settings/build/*.js` sans entry | 3517272 | 1029785 |

## Missing-artifact failure mode

The criterion asks for this to be probed "before T-001's build output exists". The build
output is now tracked, so that state cannot occur literally; the probe instead points the
documented `ROOT` argument at a tree without a build (an empty directory):

```
sh scripts/report-asset-weight.sh "$(mktemp -d)"
```

The script names the first missing path on stderr and exits non-zero (status 1). Recorded
message (the leading path is the `ROOT` that was passed):

```
report-asset-weight: missing build artifact: <ROOT>/assets/css/admin.min.css
```

## Visual baselines — first intentional re-baseline (Stage-G exit, T-043)

Separate from the SC-03/SC-04 asset-weight figures above: this records the e2e SCREENSHOT
baselines under `tests/e2e/admin/__screenshots__/`. They were first captured against the
shipped 7.5.5 look (T-010 `admin`, T-013 `admin-rtl`) and are **regenerated here, for the
first time, against the redesigned shell** (Phase 3 / Stage G). The gate-G3 sign-off
authorizes it: the redesigned screenshots become the new baseline.

- **When / how:** on a RESET wp-env DB (`npx wp-env clean all` → `start`) plus a fresh
  `npm run build:all`, via `npm run e2e -- --update-snapshots` across the 4 admin projects —
  the real CI condition (learnings 2026-10-08), one pass.
- **Which projects have baselines:** `visual.spec.js` runs in `admin` and `admin-rtl`
  (per-screen app-container shots at 1440 and 768); `isolation.spec.js` runs in `admin` only
  (banner preview/website per layout, wp-admin chrome, media modal, non-Complianz screen).
  `admin-min-wp` and `admin-i18n` run no screenshot spec, so they carry no PNG baselines.
- **What the new baselines capture:** the redesigned shell FRAME — the Page grid
  (spacing/tracks), Header (tokens, section tabs, active underline, black Go-Pro CTA), Menu +
  per-section sub-menu (active wash, step-progress icons) and the Placeholder/Skeleton loading
  states — wrapping still-LEGACY screen BODIES (fields, panels, data tables, dashboard blocks,
  date range), which migrate per section in Phase 4. So every app-container shot drifts
  intentionally at the frame; the bodies are unchanged pending their Phase-4 section PR.
- **Real redesign drift vs stale-admin.css noise:** the pre-migration baselines were captured
  against the committed, STALE `admin.css` (ADR-006: build artifacts are rebuilt only at
  release, so the tracked CSS lags its SCSS — the recurring pre-existing drift on dynamic
  screens noted in T-021/T-030). These new baselines are captured against a FRESH build
  (admin.css rebuilt from SCSS + the new scoped `index.css` pipeline), so they no longer carry
  that staleness. The drift from the old PNGs therefore = the intended shell redesign PLUS the
  one-time correction of that stale-CSS noise.
- **Gating:** the visual + isolation screenshot assertions stay NON-BLOCKING (Option B /
  ADR-008 — macOS-captured baselines cannot pixel-match the Linux CI render, and the snapshot
  path has no `{platform}` token); the committed PNGs are the human review reference and the
  Phase-5 re-baseline starting point. The banner PREVIEW/website shots are re-baselined again
  in Phase 5 against the frontend banner (ADR-008, DB-06).

## Release build (post-redesign) — 2026-10-25 (Bundle E, SC-03/SC-04 comparison)

Fresh `npm run build:all` at the post-Bundle-D tree (legacy `admin.css` + chunk CSS removed;
single `settings/build/index.css` + the slim `assets/css/premium.min.css`). Same tool/method
as the 2026-10-07 baseline above (gzip = default level; a visitor loads ONE direction, so
`index-rtl.css` is excluded as the same-size RTL alternate of `index.css`).

| Group | File(s) | raw (bytes) | gzip (bytes) |
|---|---|--:|--:|
| legacy admin CSS | REMOVED (`admin.min.css` deleted) | 0 | 0 |
| settings entry CSS | `settings/build/index.css` | 227528 | 26929 |
| premium block CSS | `assets/css/premium.min.css` | 4693 | 1078 |
| settings entry JS | `settings/build/index.*.js` | 285186 | 93974 |
| settings other JS | `settings/build/*.js` sans entry | 3752213 | 1077708 |

- **SC-03 (styling = CSS) — MET on the download (gzip) metric.** gzip 39170 → **28007** bytes
  (−11163, **−28.5%**): the legacy `admin.css` (16572 gzip) is gone, and `index.css` (26.9 KB
  gzip) + slim premium (1.1 KB gzip) replace it + the chunk CSS. Raw rose 179764 → 232221
  (+29%) because Tailwind utility classes are verbose raw but compress ~8.4×, so the
  over-the-wire download (gzip) is what drops.
- **SC-04 (script = JS) — NOT met.** gzip 1143195 → **1171682** bytes (+28487, **+2.5%**); raw
  3937959 → 4037399 (+2.5%). The Radix primitives + new component infrastructure net-ADD JS
  rather than shedding it by the weight of the removed component sets. **Maintainer decision
  required** before the release claims SC-04: accept with the +2.5% documented, re-scope the
  criterion, or investigate/trim the JS.
