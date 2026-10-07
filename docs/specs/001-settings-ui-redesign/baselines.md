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
