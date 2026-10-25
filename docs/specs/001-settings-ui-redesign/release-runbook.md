# 001 — Release runbook (reserved maintainer gates)

Everything in feature 001 is **code-complete and tagged `v7.6.0-rc1`** on the integration
branch `001-settings-ui-redesign` (head `7c07557b`; the RC tag sits on the Bundle F release
commit `25d7b6a3`). What remains are the **reserved maintainer gates** — actions held back
from autonomous execution because they are sign-offs, security settings, or the irreversible
release merge. This runbook prepares each one so it can be executed in a single pass.

**Execution order:** `C-6 / SC-07 bake` → `DB-06 sign-off` → `checks.yml master triggers` →
`DB-18 merge + tag` → `FR-022 required-checks` → (vendor) wordpress.org deploy.

Prepared 2026-10-25. Facts verified against `origin/master` (`8bc8bb00`) and
`origin/001-settings-ui-redesign` (`7c07557b`).

---

## 0. C-6 / SC-07 — the one-week RC self-QA bake  *(in progress)*

- **Started:** 2026-10-25 (at the `v7.6.0-rc1` tag). **Ends:** ~2026-11-01.
- **What it is:** a week of self-QA on the release candidate before promoting it to `master`.
  Nothing to build — it is elapsed-time validation. Exercise the redesigned admin (all six
  sections, the wizard flow, RTL, a screen reader pass) against the RC build.
- **Local RC for review:** wp-env is up at **http://localhost:8890/wp-admin** serving the
  001 tree; or check out the tag: `git checkout v7.6.0-rc1`.
- **Exit:** no release-blocking defect found during the week. A trivial fix found during the
  bake can ride in (see the note under DB-18) — one already has (#24).

---

## 1. DB-06 — banner-preview fidelity sign-off  *(effectively clear)*

**What it is (ADR-008 / spec DB-06):** the admin banner preview must render like the actual
website banner, with the same layout — legacy admin leaks are not recreated in the preview.

**Evidence to review** — the isolation baselines capture the admin **preview** and the
frontend **website** banner for every layout; sign-off is confirming each pair matches:

```
tests/e2e/admin/__screenshots__/isolation.spec.js/admin/
  preview-banner-{bottom,center,bottom-left,bottom-right}.png   ↔  website-banner-{…}.png
  preview-manage-consent-{bottom,center,bottom-left,bottom-right}.png
```

**Status:** the Bundle E/REL-2 re-baseline left these **byte-stable**, and the release audit
re-confirmed the banner-preview isolation shots did not drift. So this is a visual eyeball of
the preview↔website pairs, expected to pass. Open the pairs side by side (or in the Figma/VS
Code image viewer) and sign off.

**Decision to record:** add one line to `docs/progress.md` — `DB-06 signed off <date>:
preview matches website across all layouts.`

---

## 2. checks.yml master triggers  *(prerequisite for FR-022 — a code change)*

**The gap:** `.github/workflows/checks.yml` triggers only on the integration branch:

```yaml
on:
  push:
    branches: [ '001-settings-ui-redesign' ]
  pull_request:
    branches: [ '001-settings-ui-redesign' ]
```

Two consequences: (a) a `001 → master` PR gets **no CI** (its base is `master`), and
(b) `master` has no checks to mark required. Also note `master` (`8bc8bb00`) predates the
feature, so it **does not yet contain `checks.yml` at all** — the workflow only reaches
`master` via the DB-18 merge. So the required-check config (FR-022) is necessarily a
**post-DB-18** step.

**The edit (apply on `001` before DB-18 so it rides into `master` with the merge):**

```yaml
on:
  push:
    branches: [ '001-settings-ui-redesign', 'master' ]
  pull_request:
    branches: [ '001-settings-ui-redesign', 'master' ]
```

Small, safe, uncontroversial. Can be a tiny PR to `001` (offer stands — ask and it's opened),
or folded into the DB-18 prep. After it lands on `001` and then `master` (via DB-18), pushes
to `master` run the two checks, which FR-022 then marks required.

---

## 3. DB-18 — the release merge `001 → master`  *(reserved; the irreversible step)*

**Mergeability — verified clean:** `master` is still at the 7.5.5 base `8bc8bb00`
(unmoved since the feature branched), so `001` is a strict descendant. `git merge-tree`
reports **0 conflicts**; the merge is fast-forwardable. Diff: **1001 files, +58,274 / −15,205**
(the whole redesign + the committed release build).

**Release metadata — verified on `001`:** `complianz-gpdr.php` Version `7.6.0` +
`CMPLZ_VERSION 7.6.0`; `readme.txt` Stable tag `7.6.0`; the 7.6.0 changelog entry is present.

**Steps:**

1. Confirm §0 (bake clean), §1 (DB-06 signed), §2 (checks.yml edit on `001`) are done.
2. Open the release PR (base `master`, head `001-settings-ui-redesign`) with the body below.
   Note: this PR will **not** show CI (master has no workflow until this merge lands) — the
   content is byte-identical to what CI already passed green on `001` (#23 `7a15ed5c`, #24
   `38b9fead`). State that in the PR.
3. Merge with a **merge commit** (`--no-ff` / "Create a merge commit" — **not squash**): a
   release should preserve the feature's commit history on `master`.
4. Cut the final tag on the merge commit: `git tag -a v7.6.0 -m "7.6.0 — settings-UI
   redesign" && git push origin v7.6.0`. (The `v7.6.0-rc1` tag stays as the RC record.)

**Draft PR body:**

```
## 7.6.0 — Settings-UI redesign (feature 001)

Promotes the settings-UI redesign from the integration branch to master for the 7.6.0
release. The full React settings app is migrated to the Tailwind + Radix + semantic-token
design system; the legacy admin SCSS is retired (ADR-005); release artifacts are rebuilt
(ADR-006) and the POT regenerated against the shipped build.

### Verification
- Tagged v7.6.0-rc1; one-week RC self-QA bake completed clean.
- SC-03 settings CSS −28.5% gzip; SC-04 JS +2.5% (accepted, documented); SC-05 axe a11y
  green on all 37 screens; 4-project Admin e2e green on the release build.
- Clean fast-forward from master (0 conflicts). Content is byte-identical to the
  CI-green 001 commits (#23 7a15ed5c, #24 38b9fead); master has no workflow until this
  merge, so CI does not re-run on the PR itself.
- Reserved gates cleared: DB-06 preview sign-off, FR-022 configured post-merge.

Closes feature 001.
```

5. **wordpress.org (vendor step, out of this fork's scope):** `readme.txt` Stable tag is
   already `7.6.0`. The real wp.org publish is the vendor's SVN deploy (push `trunk` +
   `tags/7.6.0`, Stable tag in `trunk/readme.txt`). No deploy workflow exists in this fork
   (`.github/workflows/` has only `checks.yml`), so this is manual/vendor-side.

---

## 4. FR-022 — mark the checks required on master  *(reserved; GitHub setting — maintainer only)*

**Precondition:** §2 (triggers include `master`) has landed on `master` via DB-18, so pushes
to `master` now produce the two checks: **`Build from source`** and
**`Admin e2e suite (fresh WordPress)`**.

**Via the GitHub UI:** repo **Settings → Branches → Branch protection rules → `master`** →
enable **Require status checks to pass before merging** → add **`Build from source`** and
**`Admin e2e suite (fresh WordPress)`**.

**Or via `gh` (adjust other protections to taste):**

```bash
gh api -X PUT repos/AeiltAbraham/complianz-gdpr/branches/master/protection \
  -H "Accept: application/vnd.github+json" \
  -f 'required_status_checks[strict]=true' \
  -f 'required_status_checks[checks][][context]=Build from source' \
  -f 'required_status_checks[checks][][context]=Admin e2e suite (fresh WordPress)' \
  -F 'enforce_admins=false' \
  -F 'required_pull_request_reviews=null' \
  -F 'restrictions=null'
```

This is a repository **security setting** — the maintainer applies it; it is not something
this session toggles.

---

## Status summary

| Gate | State | Who |
|---|---|---|
| C-6 / SC-07 bake | running (→ ~2026-11-01) | maintainer QA |
| DB-06 preview sign-off | evidence ready, expected pass | maintainer eyeball |
| checks.yml master triggers | diff ready (§2) | small PR (offer open) |
| DB-18 merge + `v7.6.0` tag | clean FF verified, PR body ready | maintainer (reserved) |
| FR-022 required checks | commands ready, post-DB-18 | maintainer (security setting) |
| wp.org deploy | Stable tag set; SVN publish | vendor (out of fork scope) |
