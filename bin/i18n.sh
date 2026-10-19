#!/usr/bin/env bash
#
# i18n regeneration — the fork-local release i18n step (feature 001, Phase 5; C-7, DB-14).
#
# This fork has no upstream `deploy.sh` (clarify.md C-7: premium's deploy.sh is re-created
# here as needed), so the translation-regeneration step lives here and runs wp-cli i18n
# INSIDE wp-env (or any WordPress container). Run it:
#   * at release, after the final `npm run build:all`, to refresh the committed POT and the
#     de_DE verification JSON (Bundle F); and
#   * from the e2e setup (tests/e2e/admin/setup/latest.setup.js), which calls
#     `bin/i18n.sh json de_DE` so the admin-i18n project sees the JS/chunk strings in German
#     against whatever build the suite just produced.
#
# Why this is a *release* step, and why it must re-run after any build-changing merge
# (the ADR-001 marker move, the Phase-5 legacy-CSS removal, a dependency bump):
#   The settings app code-splits into content-hashed chunks (settings/build/<id>.<hash>.js).
#   WordPress resolves a chunk's JSON translation file by md5() of the chunk's plugin-relative
#   path — see cmplz_get_chunk_translations() in settings/settings.php, which registers each
#   built chunk and calls load_script_textdomain($handle, 'complianz-gdpr', $path). In the FREE
#   edition $path is false, so WP looks in WP_LANG_DIR/plugins for
#       complianz-gdpr-<locale>-<md5("settings/build/<id>.<hash>.js")>.json
#   (wp-includes/l10n.php::_load_script_textdomain_from_src). The md5 embeds the content hash,
#   so every build invalidates the previous JSON set and the POT's `#:` chunk references. The
#   POT therefore must be regenerated from the exact build that ships, which is why it is a
#   release step, not a one-time commit.
#
# What it produces:
#   pot          regenerate languages/complianz-gdpr.pot from the current source + BUILT
#                chunks (committed; uploaded to wordpress.org, which generates the public
#                per-locale JSON packs from it).
#   json <loc>   regenerate the <loc> chunk JSON into WP_LANG_DIR/plugins, keyed to the
#                CURRENT build, from the wordpress.org <loc> plugin pack (the translation
#                source). This is the FREE-edition load path; it does NOT touch the committed
#                POT. Build output and locale JSON are never committed (ADR-006).
#   all <loc>    pot, then json <loc>  (default: all de_DE).
#
# Environment (so CI / a non-wp-env host can substitute its own WordPress container):
#   CMPLZ_WP_RUN            how to run `bash -c "<cmd>"` inside the WP container.
#                           Default: "npx wp-env run cli".
#   CMPLZ_PLUGIN_DIR        plugin path inside the container.
#                           Default: /var/www/html/wp-content/plugins/complianz-gdpr
#   CMPLZ_LANG_PLUGINS_DIR  WP_LANG_DIR/plugins inside the container.
#                           Default: /var/www/html/wp-content/languages/plugins
#   CMPLZ_PHP_MEMORY        PHP memory_limit for wp-cli (the JS parser needs more than the
#                           128M default on the large minified chunks). Default: 2048M.
#
set -euo pipefail

CMPLZ_WP_RUN="${CMPLZ_WP_RUN:-npx wp-env run cli}"
CMPLZ_PLUGIN_DIR="${CMPLZ_PLUGIN_DIR:-/var/www/html/wp-content/plugins/complianz-gdpr}"
CMPLZ_LANG_PLUGINS_DIR="${CMPLZ_LANG_PLUGINS_DIR:-/var/www/html/wp-content/languages/plugins}"
CMPLZ_PHP_MEMORY="${CMPLZ_PHP_MEMORY:-2048M}"

# make-pot must scan the BUILT chunks (settings/build, gutenberg/build) and the PHP, but NOT
# the un-built sources (settings/src, gutenberg/src) or tooling — this reproduces the file set
# of the upstream-shipped POT exactly (only the build hashes and genuinely new strings differ).
EXCLUDES="node_modules,settings/src,settings/node_modules,gutenberg/src,tests,docs,assets,bin,vendor,upgrade/vendor,pro"
HEADERS='{"Last-Translator":"Complianz <support@complianz.io>","Language-Team":"Complianz <support@complianz.io>"}'

# Run a command inside the WP container with a raised PHP memory_limit available as $WP.
in_container() {
	# shellcheck disable=SC2086
	$CMPLZ_WP_RUN bash -c "WP=\"php -d memory_limit=${CMPLZ_PHP_MEMORY} \$(which wp)\"; $1"
}

regen_pot() {
	local out="${1:-${CMPLZ_PLUGIN_DIR}/languages/complianz-gdpr.pot}"
	echo "i18n: regenerating POT -> ${out}"
	in_container "cd '${CMPLZ_PLUGIN_DIR}' && \$WP i18n make-pot . '${out}' \
		--slug=complianz-gdpr --domain=complianz-gdpr \
		--exclude='${EXCLUDES}' --headers='${HEADERS}'"
}

regen_json() {
	local locale="${1:?usage: i18n.sh json <locale>}"
	local lp="${CMPLZ_LANG_PLUGINS_DIR}"
	local po="${lp}/complianz-gdpr-${locale}.po"
	local tmp_pot="/tmp/cmplz-i18n-${locale}.pot"
	echo "i18n: regenerating ${locale} chunk JSON -> ${lp} (keyed to the current build)"
	# 1) A fresh POT (temp — does NOT overwrite the committed one) so the references match the
	#    build currently on disk. 2) Pull the wordpress.org <locale> plugin pack if absent (the
	#    translation source). 3) Re-key that pack's PO to the current build with update-po.
	#    4) Emit the chunk JSON into WP_LANG_DIR/plugins where the free loader reads it.
	in_container "set -e; cd '${CMPLZ_PLUGIN_DIR}'; \
		\$WP i18n make-pot . '${tmp_pot}' --slug=complianz-gdpr --domain=complianz-gdpr --exclude='${EXCLUDES}'; \
		[ -f '${po}' ] || \$WP language plugin install complianz-gdpr '${locale}'; \
		\$WP i18n update-po '${tmp_pot}' '${po}'; \
		\$WP i18n make-json '${po}' '${lp}' --no-purge"
}

cmd="${1:-all}"
case "$cmd" in
	pot)  regen_pot "${2:-}" ;;
	json) regen_json "${2:?usage: i18n.sh json <locale>}" ;;
	all)  regen_pot; regen_json "${2:-de_DE}" ;;
	*)    echo "usage: i18n.sh [pot | json <locale> | all [<locale>]]" >&2; exit 2 ;;
esac
echo "i18n: done (${cmd})."
