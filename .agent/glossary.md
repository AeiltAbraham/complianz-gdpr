# Glossary

Domain terms as used in this codebase, plus the IDs used in specs and plans. Add a term
when a spec or review needs a definition.

## Product and compliance

- **Complianz**: this plugin. The free edition is this repository (`cmplz_free`); the
  premium edition is a separate, private repository.
- **CMP**: Consent Management Platform, which is what Complianz is.
- **Consent banner** (cookie banner): the notice visitors see on the website. Configured
  in the settings app's Consent banner section and rendered by `cookiebanner/`.
- **Consent type**: opt-in (consent before cookies are placed) or opt-out (cookies
  allowed until the visitor objects). Depends on the region.
- **Region**: the jurisdiction a configuration targets, as a code such as `eu`, `us`,
  `uk`, `ca`, `au`, `za` or `br`. Drives the consent type and the generated documents.
- **Category**: consent category, one of functional, preferences, statistics, marketing.
- **Service**: a third-party service (for example a video or map embed) that places
  cookies. Belongs to a category.
- **Cookie**: a single cookie record with purpose and retention. Descriptions are synced
  from cookiedatabase.org.
- **cookiedatabase.org**: external database of cookie and service descriptions
  (`CMPLZ_COOKIEDATABASE_URL`).
- **Cookie scan / website scan**: detection of the cookies and services a site uses
  (`cookie/`, `websitescan/`). The website scan is an external service.
- **Cookie blocker**: server-side blocking of scripts and iframes until consent
  (`class-cookie-blocker.php`).
- **Placeholder**: what is shown in place of blocked content such as a map or video.
- **Consent area**: block-editor block whose content only appears after consent.
- **Manage consent**: the control that lets visitors reopen and change their choices
  (`#cmplz-manage-consent` in the banner markup).
- **Google Consent Mode**: Google's consent-signal mechanism; the banner sets it.
- **WP Consent API**: WordPress's shared consent API for interoperability between plugins.
- **TCF**: IAB Transparency & Consent Framework. Premium only.
- **Proof of consent**: stored snapshots of the consent configuration and policies
  (`proof-of-consent/`).
- **Records of consent**: per-visitor consent records (premium screens in the settings
  app).
- **Data requests (DNSMPD)**: "Do not sell my personal information" requests from
  visitors (`DNSMPD/`).
- **Processing agreements, data breach reports**: premium document tools in the settings
  app.

## Settings app

- **Settings app**: the React admin app in `settings/`, with six sections: Dashboard,
  Wizard, Consent banner, Integrations, Settings, Tools.
- **Wizard**: the guided setup in the settings app. Its steps and questions come from the
  PHP field configuration.
- **Field / field type**: a PHP field definition (`settings/config/`) that React renders
  according to its `type` (`settings/src/Settings/Fields/Field.js`).
- **react_conditions**: rules in a field definition that show or hide the field based on
  other fields' values.
- **Dashboard block**: a dashboard tile defined by `cmplz_blocks()`
  (`settings/config/blocks.php`) and filterable through the `cmplz_blocks` filter.
- **Tour**: the guided tour of the settings app.
- **`manage_privacy`**: the default capability for Complianz admin access (filter
  `cmplz_capability`).
- **`cmplz_options`**: the option that stores the plugin's settings.
- **RSP**: Really Simple Plugins, the original vendor, and the source of the legacy
  `--rsp-*` CSS variables (renamed to `--cmplz-legacy-*` by ADR-004).

## Project IDs

- **DB-nn**: desired-behavior statement in a spec (for example DB-06).
- **SC-nn**: success criterion in a spec.
- **C-n**: clarification summarized in a spec; the full record is in `clarify.md` as Q-nn.
- **ADR-nnn**: decision record in `docs/adr/`.
- **D1–D15**: decision numbers in the input technical spec for feature 001; ADRs cite
  them.
- **Phase 0–5**: migration phases defined in the input technical spec (0 spikes,
  1 foundation, 2 primitives, 3 shell and layout, 4 screens, 5 legacy removal).
- **Input technical spec**: the internal migration document for feature 001, kept outside
  the repo (`~/Downloads/SETTINGS-UI/TAILWIND-MIGRATION-SPEC.md`).
