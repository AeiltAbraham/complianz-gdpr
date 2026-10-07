#!/bin/sh
# Report the raw and gzip byte weight of the Complianz settings-screen assets.
#
# Baseline tool for success criteria SC-03 (the settings screens download less
# styling than today) and SC-04 (less script, by at least the weight of the removed
# component sets). At release a fresh build is measured again and compared against
# the numbers recorded in docs/specs/001-settings-ui-redesign/baselines.md.
#
# It prints, to stdout only, the raw and gzip size of each asset group a visitor of
# the settings screens downloads:
#
#   * legacy admin CSS    assets/css/admin.min.css      (single file)
#   * settings chunk CSS  settings/build/*.css          (sum over the group)
#   * settings entry JS   settings/build/index.*.js     (the entry chunk)
#   * settings other JS   settings/build/*.js sans entry (sum over the group)
#
# For a group both figures are the SUM over its files: raw is the sum of file sizes;
# gzip is the sum of each file's gzip size, because each chunk is fetched and
# compressed independently over the wire. gzip uses its default compression level.
#
# Usage: report-asset-weight.sh [ROOT]
#   ROOT is the plugin root to measure. It defaults to the parent of this script's
#   directory (the repository root), so the proof runs from anywhere. Point ROOT at
#   a tree that has no build (e.g. an empty directory) to exercise the
#   missing-artifact path: the script names the first missing path on stderr and
#   exits non-zero.
#
# The script is read-only: it makes no network calls and creates no files. Output
# goes to stdout; a missing-artifact diagnostic goes to stderr.

set -eu

# --- resolve the root to measure -------------------------------------------------
if [ "$#" -gt 0 ]; then
	root=$1
else
	script_dir=$( CDPATH= cd -- "$( dirname -- "$0" )" && pwd )
	root=$( CDPATH= cd -- "$script_dir/.." && pwd )
fi

admin_css="$root/assets/css/admin.min.css"
build_dir="$root/settings/build"

# die PATH -- name a missing artifact on stderr and stop with a non-zero status.
die() {
	printf 'report-asset-weight: missing build artifact: %s\n' "$1" >&2
	exit 1
}

# row LABEL RAW GZIP -- print one labelled measurement line.
row() {
	printf '%-52s raw=%s gzip=%s\n' "$1" "$2" "$3"
}

# --- legacy admin CSS (single file) ----------------------------------------------
[ -f "$admin_css" ] || die "$admin_css"
admin_raw=$( wc -c < "$admin_css" ); admin_raw=$(( admin_raw ))
admin_gzip=$( gzip -c "$admin_css" | wc -c ); admin_gzip=$(( admin_gzip ))

# --- settings chunk CSS: sum over settings/build/*.css ---------------------------
css_raw=0
css_gzip=0
for f in "$build_dir"/*.css; do
	[ -f "$f" ] || die "$f"
	n=$( wc -c < "$f" ); css_raw=$(( css_raw + n ))
	n=$( gzip -c "$f" | wc -c ); css_gzip=$(( css_gzip + n ))
done

# --- settings entry JS: settings/build/index.*.js --------------------------------
entry_raw=0
entry_gzip=0
for f in "$build_dir"/index.*.js; do
	[ -f "$f" ] || die "$f"
	n=$( wc -c < "$f" ); entry_raw=$(( entry_raw + n ))
	n=$( gzip -c "$f" | wc -c ); entry_gzip=$(( entry_gzip + n ))
done

# --- settings other JS: settings/build/*.js except the entry chunk ---------------
other_raw=0
other_gzip=0
for f in "$build_dir"/*.js; do
	[ -f "$f" ] || die "$f"
	case ${f##*/} in
		index.*.js) continue ;;
	esac
	n=$( wc -c < "$f" ); other_raw=$(( other_raw + n ))
	n=$( gzip -c "$f" | wc -c ); other_gzip=$(( other_gzip + n ))
done

# --- report (stdout only) --------------------------------------------------------
echo "Complianz settings-screen asset weight (SC-03 styling, SC-04 script)"
echo "root: $root"
echo "sizes in bytes; a group figure is the sum over its files; gzip = default level"
echo
row "legacy admin CSS   [assets/css/admin.min.css]"       "$admin_raw"  "$admin_gzip"
row "settings chunk CSS [settings/build/*.css]"           "$css_raw"    "$css_gzip"
row "settings entry JS  [settings/build/index.*.js]"      "$entry_raw"  "$entry_gzip"
row "settings other JS  [settings/build/*.js sans entry]" "$other_raw"  "$other_gzip"
