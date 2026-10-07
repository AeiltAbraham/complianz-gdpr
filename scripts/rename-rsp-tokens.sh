#!/bin/sh
# Rename the legacy Really Simple Plugins design-token prefix (ADR-004).
#
# Rewrites, in place and look-preserving:
#
#   --rsp-       ->  --cmplz-legacy-      (CSS custom properties)
#   $rsp-        ->  $cmplz-legacy-       (SCSS variables; only $rsp-break-* today)
#
# in every *.scss under assets/css/ and every *.js / *.scss under settings/src/,
# and deletes the two orphaned compiled files assets/css/admin/theme.css and
# assets/css/variables.css (nothing references them; they are rebuilt, not renamed).
#
# It runs against the current working directory and refuses to run unless
# assets/css/ is present, so it is scoped to the repository root. By only
# touching *.scss under assets/css/ and *.js/*.scss under settings/src/ it never
# reaches upgrade/ (its own self-contained --rsp- set), settings/build/ (generated)
# or docs/. Only files that actually contain a token are rewritten, so unrelated
# files keep their modification times.
#
# This is the exact, unmodified script task T-017 runs; it must be correct,
# idempotent and safe on its own. Beware the Perl trap: an unescaped $cmplz in the
# replacement interpolates to the empty string, so both the pattern and the
# replacement escape the dollar (\$), and the Perl program stays single-quoted so
# the shell leaves it alone.
#
# Usage: run from the repository root:  sh scripts/rename-rsp-tokens.sh

if [ ! -d assets/css ]; then
	echo "rename-rsp-tokens: assets/css/ not found; run from the repository root. Nothing changed." >&2
	exit 1
fi

# Collect the files that contain a token and rewrite only those, printing each
# rewritten path. The grep/perl run inside a subshell pipeline, so the rewritten
# paths are gathered through command substitution rather than a shared counter.
renamed=$(
	{
		find assets/css -type f -name '*.scss'
		if [ -d settings/src ]; then
			find settings/src -type f \( -name '*.js' -o -name '*.scss' \)
		fi
	} 2>/dev/null | while IFS= read -r file; do
		[ -f "$file" ] || continue
		if grep -q -e '--rsp-' -e '[$]rsp-' "$file"; then
			perl -pi -e 's/--rsp-/--cmplz-legacy-/g; s/\$rsp-/\$cmplz-legacy-/g' "$file"
			printf '%s\n' "$file"
		fi
	done
)

# Delete the orphaned compiled files when present (ADR-004: deleted, not renamed).
deleted=""
for orphan in assets/css/admin/theme.css assets/css/variables.css; do
	if [ -f "$orphan" ]; then
		rm -f "$orphan"
		deleted="${deleted:+$deleted
}$orphan"
	fi
done

# Summary.
n_renamed=$( printf '%s' "$renamed" | grep -c . )
n_deleted=$( printf '%s' "$deleted" | grep -c . )

if [ "$n_renamed" -gt 0 ]; then
	printf '%s\n' "$renamed" | sed 's/^/  renamed: /'
fi
if [ "$n_deleted" -gt 0 ]; then
	printf '%s\n' "$deleted" | sed 's/^/  deleted: /'
fi
echo "rename-rsp-tokens: $n_renamed file(s) rewritten, $n_deleted file(s) deleted."
