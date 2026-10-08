#!/usr/bin/env node
"use strict";
/**
 * ADR-007 enforcement: ban physical (left/right) Tailwind utilities in settings/src.
 *
 * RTL is handled with logical properties and a single stylesheet (ADR-007). Layout is
 * written with logical utilities (`ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`,
 * `text-start`/`text-end`, `rounded-s/e-*`, `border-s/e-*`, `gap-*`); physical left/right
 * utilities are banned. `rtl:`/`ltr:` variants are the only escape hatch, kept for what
 * logical properties cannot express (mirrored icons, `translate-x-*`, background position,
 * gradient direction).
 *
 * The script extracts class tokens from `className` attributes (string, `{'...'}`, and
 * template literals) and from clsx()/classnames()/cva() calls and their variant maps. For
 * each token it strips the `tw-` prefix (ADR-014; v3 class-prefix, NOT `tw:`), a leading `-`
 * (negative utilities, either side of the prefix) and the variant segments (everything up to
 * and including the last `:` outside `[...]`), then fails on a banned utility UNLESS the
 * token's variant chain contains an `rtl:` or `ltr:` segment.
 *
 * Usage:
 *   node settings/scripts/check-physical-utilities.js [path ...]   default: settings/src
 *   node settings/scripts/check-physical-utilities.js --self-test  bundled in-memory fixtures
 *
 * Node 24, no npm dependencies, CommonJS (matches the repo's other scripts/*.js).
 *
 *   exit 0  no banned physical utilities found (or the self-test's assertions all held)
 *   exit 1  a banned utility found (named file:line:col and token), or the self-test failed
 */
const fs = require("fs");
const path = require("path");

// --- Banned physical (left/right) utilities (ADR-007 §4.6 "Consequences") ------------------
// Each entry matches a BASE utility token after the prefix, leading `-` and variant segments
// have been stripped. Logical replacements (ms/me, ps/pe, start/end, text-start/-end,
// rounded-s/e, border-s/e, gap, rounded-t/b, space-y, divide-y, bg-top/bottom, to-t/b) and
// Tailwind colours (border-red-*, bg-right? no) are intentionally NOT matched.
const BANNED = [
	{ re: /^m[lr]-/, rule: "physical margin ml-*/mr-* (use ms-*/me-*)" },
	{ re: /^p[lr]-/, rule: "physical padding pl-*/pr-* (use ps-*/pe-*)" },
	{ re: /^scroll-m[lr]-/, rule: "physical scroll-margin (use scroll-ms-*/scroll-me-*)" },
	{ re: /^scroll-p[lr]-/, rule: "physical scroll-padding (use scroll-ps-*/scroll-pe-*)" },
	{ re: /^(left|right)-/, rule: "physical inset left-*/right-* (use start-*/end-*)" },
	{ re: /^text-(left|right)$/, rule: "physical text-align (use text-start/text-end)" },
	{ re: /^float-(left|right)$/, rule: "physical float (use float-start/float-end)" },
	{ re: /^clear-(left|right)$/, rule: "physical clear (use clear-start/clear-end)" },
	{ re: /^border-[lr](-.+)?$/, rule: "physical border side border-l*/border-r* (use border-s/border-e)" },
	{ re: /^rounded-(l|r|tl|tr|bl|br)(-.+)?$/, rule: "physical corner radius (use rounded-s*/rounded-e* / rounded-ss/se/es/ee)" },
	{ re: /^space-x(-.+)?$/, rule: "physical horizontal space-x-* (use gap-*)" },
	{ re: /^divide-x(-.+)?$/, rule: "physical horizontal divide-x-* (use a logical layout)" },
	{ re: /^origin-(left|right|top-left|top-right|bottom-left|bottom-right)$/, rule: "physical transform origin (use a logical/center origin or rtl: variant)" },
	{ re: /^bg-(left|right)(-.+)?$/, rule: "physical background-position bg-left*/bg-right* (use a center/top/bottom position or rtl: variant)" },
	{ re: /^bg-gradient-to-(l|r|tl|tr|bl|br)$/, rule: "physical gradient direction (use to-t/to-b or an rtl: variant)" },
];

// --- Token processing ----------------------------------------------------------------------

// Split a raw class token into its variant chain and base utility, treating `:` as a variant
// separator only at bracket depth 0 (so arbitrary values like `[mask-type:luminance]` and
// `[&:hover]` are not mis-split). Returns { variants: string[], base: string }.
function splitVariants(token) {
	let depth = 0;
	let lastColon = -1;
	for (let i = 0; i < token.length; i++) {
		const c = token[i];
		if (c === "[") depth++;
		else if (c === "]") depth = Math.max(0, depth - 1);
		else if (c === ":" && depth === 0) lastColon = i;
	}
	if (lastColon === -1) return { variants: [], base: token };
	const chain = token.slice(0, lastColon); // without the trailing ':'
	return { variants: chain.split(":").filter(Boolean), base: token.slice(lastColon + 1) };
}

// Normalise a base token: strip a leading `-`, then the `tw-` prefix (ADR-014), then a
// leading `-` again (v3 negatives can read `tw--scale-x-100`).
function normaliseBase(base) {
	let b = base.replace(/^-/, "");
	if (b.startsWith("tw-")) b = b.slice(3);
	b = b.replace(/^-/, "");
	return b;
}

// Decide whether a raw class token is a banned physical utility. Returns the matching rule
// string, or null. A token escapes the ban when its variant chain carries `rtl:` or `ltr:`.
function violatingRule(token) {
	// Ignore anything that is obviously not a utility token (e.g. interpolation leftovers).
	if (!token || /[^A-Za-z0-9_:/\[\].%#!&>*,+~=()?-]/.test(token)) return null;
	const { variants, base } = splitVariants(token);
	const b = normaliseBase(base);
	for (const { re, rule } of BANNED) {
		if (re.test(b)) {
			if (variants.includes("rtl") || variants.includes("ltr")) return null; // escape hatch
			return rule;
		}
	}
	return null;
}

// --- Source scanning -----------------------------------------------------------------------

function matchingClose(ch) {
	if (ch === "{") return "}";
	if (ch === "(") return ")";
	if (ch === "[") return "]";
	return null;
}

// Skip a string or template literal that begins at content[i]. Returns the index just after
// the closing quote/backtick. Template literals consume their `${ ... }` interpolations.
function skipString(content, i, quote) {
	i++;
	if (quote === "`") {
		while (i < content.length) {
			const c = content[i];
			if (c === "\\") { i += 2; continue; }
			if (c === "`") return i + 1;
			if (c === "$" && content[i + 1] === "{") {
				const close = readBalanced(content, i + 1);
				i = close === -1 ? content.length : close + 1;
				continue;
			}
			i++;
		}
		return content.length;
	}
	while (i < content.length) {
		const c = content[i];
		if (c === "\\") { i += 2; continue; }
		if (c === quote) return i + 1;
		if (c === "\n") return i; // unterminated: bail at end of line
		i++;
	}
	return content.length;
}

function skipLineComment(content, i) {
	i += 2;
	while (i < content.length && content[i] !== "\n") i++;
	return i;
}

function skipBlockComment(content, i) {
	i += 2;
	while (i < content.length && !(content[i] === "*" && content[i + 1] === "/")) i++;
	return Math.min(content.length, i + 2);
}

// Given content[openIdx] is an opening delimiter, return the index of its matching close,
// skipping nested strings, template literals and comments. -1 if unbalanced.
function readBalanced(content, openIdx) {
	let depth = 0;
	let i = openIdx;
	while (i < content.length) {
		const c = content[i];
		if (c === '"' || c === "'" || c === "`") { i = skipString(content, i, c); continue; }
		if (c === "/" && content[i + 1] === "/") { i = skipLineComment(content, i); continue; }
		if (c === "/" && content[i + 1] === "*") { i = skipBlockComment(content, i); continue; }
		if (c === "{" || c === "(" || c === "[") depth++;
		else if (c === "}" || c === ")" || c === "]") { depth--; if (depth === 0) return i; }
		i++;
	}
	return -1;
}

// Emit whitespace-separated tokens from a literal's inner text, each with its source offset.
function emitTokens(text, baseOffset, push) {
	const re = /\S+/g;
	let m;
	while ((m = re.exec(text)) !== null) push(m[0], baseOffset + m.index);
}

// Walk a template literal beginning at content[i] (a backtick): emit tokens from the static
// chunks and recurse into each `${ ... }` interpolation. Returns the index after the close.
function extractTemplate(content, i, push) {
	i++; // past opening backtick
	let chunkStart = i;
	while (i < content.length) {
		const c = content[i];
		if (c === "\\") { i += 2; continue; }
		if (c === "`") { emitTokens(content.slice(chunkStart, i), chunkStart, push); return i + 1; }
		if (c === "$" && content[i + 1] === "{") {
			emitTokens(content.slice(chunkStart, i), chunkStart, push);
			const close = readBalanced(content, i + 1);
			const end = close === -1 ? content.length : close;
			extractLiteralsInRange(content, i + 2, end, push);
			i = close === -1 ? content.length : close + 1;
			chunkStart = i;
			continue;
		}
		i++;
	}
	emitTokens(content.slice(chunkStart, i), chunkStart, push);
	return i;
}

// Extract class tokens from every string/template literal in [start, end), skipping comments.
function extractLiteralsInRange(content, start, end, push) {
	let i = start;
	while (i < end) {
		const c = content[i];
		if (c === "/" && content[i + 1] === "/") { i = skipLineComment(content, i); continue; }
		if (c === "/" && content[i + 1] === "*") { i = skipBlockComment(content, i); continue; }
		if (c === '"' || c === "'") {
			const strEnd = skipString(content, i, c);
			emitTokens(content.slice(i + 1, Math.max(i + 1, strEnd - 1)), i + 1, push);
			i = strEnd;
			continue;
		}
		if (c === "`") { i = extractTemplate(content, i, push); continue; }
		i++;
	}
}

const RE_CLASSNAME = /(?<![A-Za-z0-9_$])className\s*=\s*/g;
const RE_CLSX = /(?<![A-Za-z0-9_$.])(?:clsx|classnames|classNames|cx|cva)\s*\(/g;

// Collect every (token, offset) pair that appears in a class context in `content`.
function collectTokens(content) {
	const found = []; // { token, offset }
	const push = (token, offset) => found.push({ token, offset });

	RE_CLASSNAME.lastIndex = 0;
	let m;
	while ((m = RE_CLASSNAME.exec(content)) !== null) {
		const p = m.index + m[0].length; // first char of the value
		const c = content[p];
		if (c === '"' || c === "'" || c === "`") {
			extractLiteralsInRange(content, p, skipString(content, p, c), push);
		} else if (c === "{") {
			const close = readBalanced(content, p);
			if (close !== -1) extractLiteralsInRange(content, p + 1, close, push);
		}
	}

	RE_CLSX.lastIndex = 0;
	while ((m = RE_CLSX.exec(content)) !== null) {
		const openParen = m.index + m[0].length - 1; // the '('
		const close = readBalanced(content, openParen);
		if (close !== -1) extractLiteralsInRange(content, openParen + 1, close, push);
	}

	return found;
}

// Map a character offset to a 1-based { line, col } using precomputed line-start offsets.
function makeLocator(content) {
	const starts = [0];
	for (let i = 0; i < content.length; i++) if (content[i] === "\n") starts.push(i + 1);
	return (offset) => {
		let lo = 0;
		let hi = starts.length - 1;
		while (lo < hi) {
			const mid = (lo + hi + 1) >> 1;
			if (starts[mid] <= offset) lo = mid;
			else hi = mid - 1;
		}
		return { line: lo + 1, col: offset - starts[lo] + 1 };
	};
}

// Check one file's content; return an array of { file, line, col, token, rule }, de-duplicated
// per (line, token) so a clsx call nested in a className value is not reported twice.
function checkContent(file, content) {
	const locate = makeLocator(content);
	const seen = new Set();
	const violations = [];
	for (const { token, offset } of collectTokens(content)) {
		const rule = violatingRule(token);
		if (!rule) continue;
		const { line, col } = locate(offset);
		const key = line + "\u0000" + token;
		if (seen.has(key)) continue;
		seen.add(key);
		violations.push({ file, line, col, token, rule });
	}
	return violations;
}

// --- File discovery ------------------------------------------------------------------------

function isSourceFile(f) {
	return /\.(js|jsx)$/.test(f);
}

function walk(target, out) {
	let stat;
	try {
		stat = fs.statSync(target);
	} catch (e) {
		return; // non-existent path arg: skip silently (self-test uses in-memory fixtures)
	}
	if (stat.isDirectory()) {
		if (/(^|\/)(node_modules|build)$/.test(target)) return;
		for (const name of fs.readdirSync(target)) walk(path.join(target, name), out);
	} else if (stat.isFile() && isSourceFile(target)) {
		out.push(target);
	}
}

function formatViolation(v) {
	return v.file + ":" + v.line + ":" + v.col + "  " + v.token + "  — " + v.rule;
}

// --- Self-test -----------------------------------------------------------------------------

function selfTest() {
	// Inline fixtures (no files committed). Each asserts the checker's behaviour.
	const fixtures = [
		{
			name: "banned.js",
			content:
				"import { __ } from '@wordpress/i18n';\n" +
				"export default () => <div className=\"ml-4 cmplz-row\">{__('Hi')}</div>;\n",
			expect: { token: "ml-4", line: 2 },
		},
		{
			name: "banned-prefixed.js",
			content: "export default () => <span className=\"tw-pr-2\" />;\n",
			expect: { token: "tw-pr-2", line: 1 },
		},
		{ name: "rtl-escape.js", content: "export default () => <div className=\"rtl:ml-4\" />;\n", expect: null },
		{ name: "logical.js", content: "export default () => <div className=\"ms-4\" />;\n", expect: null },
		{
			name: "clsx-map.js",
			content:
				"import clsx from 'clsx';\n" +
				"export const cls = (on) => clsx('tw-ps-2', { 'tw-me-2': on });\n",
			expect: null,
		},
		{
			name: "negative-rtl.js",
			content: "export default () => <i className=\"rtl:tw--scale-x-100\" />;\n",
			expect: null,
		},
	];

	const failures = [];
	let sample = null;
	for (const fx of fixtures) {
		const vs = checkContent(fx.name, fx.content);
		if (fx.expect) {
			const hit = vs.find((v) => v.token === fx.expect.token);
			if (!hit) {
				failures.push("expected a violation for `" + fx.expect.token + "` in " + fx.name + ", got none");
			} else {
				if (hit.line !== fx.expect.line) {
					failures.push(
						fx.name + ": expected `" + fx.expect.token + "` on line " + fx.expect.line + ", got line " + hit.line
					);
				}
				if (!sample) sample = hit; // record a real failure message for the spike doc
			}
		} else if (vs.length !== 0) {
			failures.push(fx.name + ": expected no violations, got " + vs.map((v) => v.token).join(", "));
		}
	}

	if (failures.length) {
		console.error("self-test: FAIL");
		for (const f of failures) console.error("  - " + f);
		process.exit(1);
	}

	console.log("self-test: PASS (" + fixtures.length + " fixtures)");
	console.log("  banned `ml-4` is flagged; its `rtl:ml-4` escape, the logical `ms-4`,");
	console.log("  `clsx('tw-ps-2', { 'tw-me-2': on })` and `rtl:tw--scale-x-100` all pass.");
	if (sample) {
		console.log("  sample failure message (probe-at-build — what a real violation prints):");
		console.log("    " + formatViolation(sample));
	}
	process.exit(0);
}

// --- CLI -----------------------------------------------------------------------------------

function main(argv) {
	const args = argv.slice(2);
	if (args.includes("--self-test")) return selfTest();

	const repoRoot = path.resolve(__dirname, "..", "..");
	const targets = args.length ? args.map((a) => path.resolve(a)) : [path.join(repoRoot, "settings", "src")];

	const files = [];
	for (const t of targets) walk(t, files);

	const violations = [];
	for (const file of files) {
		let content;
		try {
			content = fs.readFileSync(file, "utf8");
		} catch (e) {
			console.error("check-physical-utilities: could not read " + file + ": " + e.message);
			process.exit(1);
		}
		for (const v of checkContent(path.relative(repoRoot, file), content)) violations.push(v);
	}

	if (violations.length) {
		for (const v of violations) console.error(formatViolation(v));
		console.error(
			"check-physical-utilities: " +
				violations.length +
				" banned physical utilit" +
				(violations.length === 1 ? "y" : "ies") +
				" (ADR-007). Use logical utilities, or an rtl:/ltr: variant where logical properties cannot express the intent."
		);
		process.exit(1);
	}

	console.log("check-physical-utilities: " + files.length + " file(s) scanned, no banned physical utilities.");
	process.exit(0);
}

if (require.main === module) main(process.argv);

module.exports = { checkContent, violatingRule, splitVariants, normaliseBase, collectTokens };
