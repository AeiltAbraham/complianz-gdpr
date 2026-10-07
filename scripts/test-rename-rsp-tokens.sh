#!/bin/sh
# Test scripts/rename-rsp-tokens.sh (ADR-004 legacy token prefix rename).
#
# POSIX sh. Builds a throwaway fixture tree with mktemp, runs the rename there,
# and asserts the exact byte content of every file, then:
#
#   * the two token patterns are rewritten: --rsp- -> --cmplz-legacy- and
#     $rsp-break-* -> $cmplz-legacy-break- (the $rsp-break-m fixture guards the
#     Perl "$cmplz interpolates to empty" trap);
#   * an already-renamed --cmplz-legacy- value is left untouched (no double rename);
#   * the orphan compiled files assets/css/admin/theme.css and
#     assets/css/variables.css are deleted;
#   * files under upgrade/, settings/build/ and docs/ are left byte-for-byte alone;
#   * a second run changes nothing (empty recursive diff);
#   * in a directory without assets/css/ the script exits non-zero, prints a
#     message, and changes nothing.
#
# Exits 0 only when every assertion holds; non-zero with a diagnostic otherwise.
# Proof command for task T-031.

here=$( CDPATH= cd -- "$( dirname -- "$0" )" && pwd )
rename="$here/rename-rsp-tokens.sh"

if [ ! -f "$rename" ]; then
	echo "FAIL: rename script not found at $rename" >&2
	exit 1
fi

tmp=$( mktemp -d "${TMPDIR:-/tmp}/cmplz-rsp.XXXXXX" ) || {
	echo "FAIL: could not create temp dir" >&2
	exit 1
}
trap 'rm -rf "$tmp"' EXIT INT TERM

root="$tmp/tree"       # the fixture tree the rename runs against
exp="$tmp/expected"    # expected content of every surviving file
fails=0

note() { printf '  %s\n' "$1"; }
fail() { printf 'FAIL: %s\n' "$1" >&2; fails=$(( fails + 1 )); }

# writemk DIR REL  <<heredoc : create DIR/REL (and parents) from stdin.
writemk() {
	_d=$1; _r=$2
	mkdir -p "$_d/$( dirname -- "$_r" )"
	cat > "$_d/$_r"
}

# ---------------------------------------------------------------------------
# Fixtures. Heredoc delimiters are quoted so the shell never expands $rsp- etc.
# For rewritten files, the expected copy is the hand-computed rename result.
# For untouched files, the expected copy is identical to the input.
# Orphan files go only into the tree (they must be deleted, so have no expected).
# ---------------------------------------------------------------------------

# A. assets/css/variables.scss : both token kinds, the $rsp-break-m trap guard,
#    and an already-renamed value that must survive unchanged.
writemk "$root" assets/css/variables.scss <<'EOF'
// Break points
$rsp-break-m: 1280px;

:root {
  --rsp-spacing-m: 20px;
  --rsp-border: 1px solid var(--rsp-border-color);
  --cmplz-legacy-already: #fff;
}

.box {
  max-width: $rsp-break-m;
  margin: var(--rsp-spacing-m);
}
EOF
writemk "$exp" assets/css/variables.scss <<'EOF'
// Break points
$cmplz-legacy-break-m: 1280px;

:root {
  --cmplz-legacy-spacing-m: 20px;
  --cmplz-legacy-border: 1px solid var(--cmplz-legacy-border-color);
  --cmplz-legacy-already: #fff;
}

.box {
  max-width: $cmplz-legacy-break-m;
  margin: var(--cmplz-legacy-spacing-m);
}
EOF

# B. assets/css/admin/base.scss : a nested .scss, $rsp-break-s in admin.
writemk "$root" assets/css/admin/base.scss <<'EOF'
@media (max-width: $rsp-break-s) {
  .cmplz-wrap { padding: var(--rsp-spacing-s); }
}
EOF
writemk "$exp" assets/css/admin/base.scss <<'EOF'
@media (max-width: $cmplz-legacy-break-s) {
  .cmplz-wrap { padding: var(--cmplz-legacy-spacing-s); }
}
EOF

# C. settings/src/Modal.js : a JS inline style under settings/src.
writemk "$root" settings/src/Modal.js <<'EOF'
const style = { borderRadius: 'var(--rsp-border-radius)' };
EOF
writemk "$exp" settings/src/Modal.js <<'EOF'
const style = { borderRadius: 'var(--cmplz-legacy-border-radius)' };
EOF

# D. settings/src/Settings/Debug/debug.scss : a deeply nested .scss.
writemk "$root" settings/src/Settings/Debug/debug.scss <<'EOF'
.cmplz-debug { background: var(--rsp-grey-100); }
EOF
writemk "$exp" settings/src/Settings/Debug/debug.scss <<'EOF'
.cmplz-debug { background: var(--cmplz-legacy-grey-100); }
EOF

# E + F. Orphan compiled files : must be deleted (no expected copy).
writemk "$root" assets/css/admin/theme.css <<'EOF'
.x { color: var(--rsp-black); }
EOF
writemk "$root" assets/css/variables.css <<'EOF'
:root { --rsp-white: #fff; }
EOF

# G. upgrade/ : self-contained --rsp- set, must stay (input == expected).
writemk "$root" upgrade/upgrade-to-pro.css <<'EOF'
:root { --rsp-spacing-xxs: 5px; }
EOF
writemk "$exp" upgrade/upgrade-to-pro.css <<'EOF'
:root { --rsp-spacing-xxs: 5px; }
EOF

# H. docs/ : documents the rename, must stay even though it holds both patterns.
writemk "$root" docs/adr/ADR-004-token-prefix-rename.md <<'EOF'
This doc mentions --rsp- and $rsp-break-m on purpose.
EOF
writemk "$exp" docs/adr/ADR-004-token-prefix-rename.md <<'EOF'
This doc mentions --rsp- and $rsp-break-m on purpose.
EOF

# I. settings/build/ : generated output, excluded (not under settings/src).
writemk "$root" settings/build/123.css <<'EOF'
.cmplz-block { background: var(--rsp-background-block-color); }
EOF
writemk "$exp" settings/build/123.css <<'EOF'
.cmplz-block { background: var(--rsp-background-block-color); }
EOF

# ---------------------------------------------------------------------------
# Run the rename inside the fixture tree.
# ---------------------------------------------------------------------------
echo "== run 1: rename in fixture tree =="
out=$( cd "$root" && sh "$rename" 2>&1 )
rc=$?
printf '%s\n' "$out" | sed 's/^/  | /'
[ "$rc" -eq 0 ] || fail "first run exited $rc (expected 0)"

# Orphans must be gone.
[ -e "$root/assets/css/admin/theme.css" ] && fail "orphan theme.css was not deleted"
[ -e "$root/assets/css/variables.css" ]   && fail "orphan variables.css was not deleted"

# The surviving file set must be exactly the expected set (no stray, none missing).
got=$( cd "$root" && find . -type f | sort )
want=$( cd "$exp" && find . -type f | sort )
if [ "$got" != "$want" ]; then
	fail "surviving file set differs from expected"
	printf 'got:\n%s\nwant:\n%s\n' "$got" "$want" >&2
fi

# Every expected file must match byte-for-byte.
( cd "$exp" && find . -type f | sort ) | while IFS= read -r rel; do
	if [ ! -f "$root/$rel" ]; then
		echo "MISS $rel" >&2
		continue
	fi
	if ! diff -u "$exp/$rel" "$root/$rel" >/dev/null 2>&1; then
		echo "DIFF $rel" >&2
		diff -u "$exp/$rel" "$root/$rel" >&2
	fi
done > "$tmp/mismatches" 2>"$tmp/diffs"
if [ -s "$tmp/diffs" ]; then
	fail "file content did not match expected"
	cat "$tmp/diffs" >&2
fi

# ---------------------------------------------------------------------------
# Idempotency: a second run must change nothing.
# ---------------------------------------------------------------------------
echo "== run 2: idempotency =="
snap="$tmp/snap"
cp -R "$root" "$snap"
out2=$( cd "$root" && sh "$rename" 2>&1 )
rc2=$?
[ "$rc2" -eq 0 ] || fail "second run exited $rc2 (expected 0)"
if ! diff -r "$snap" "$root" >/dev/null 2>&1; then
	fail "second run changed the tree (not idempotent)"
	diff -r "$snap" "$root" >&2
fi

# ---------------------------------------------------------------------------
# Failure path: no assets/css/ -> non-zero, a message, and no changes.
# ---------------------------------------------------------------------------
echo "== run 3: missing assets/css/ =="
nocss="$tmp/nocss"
mkdir -p "$nocss"
: > "$nocss/sentinel"            # a file that must survive untouched
before=$( cd "$nocss" && find . -type f | sort; md5 -q sentinel 2>/dev/null || true )
err=$( cd "$nocss" && sh "$rename" 2>&1 >/dev/null )
rc3=$?
after=$( cd "$nocss" && find . -type f | sort; md5 -q sentinel 2>/dev/null || true )
[ "$rc3" -ne 0 ] || fail "missing assets/css/ should exit non-zero (got $rc3)"
[ -n "$err" ]    || fail "missing assets/css/ should print a message to stderr"
[ "$before" = "$after" ] || fail "missing assets/css/ run changed files"

# ---------------------------------------------------------------------------
if [ "$fails" -eq 0 ]; then
	echo "PASS: all assertions held"
	exit 0
fi
echo "FAILED: $fails assertion(s)" >&2
exit 1
