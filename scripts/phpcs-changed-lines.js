#!/usr/bin/env node
"use strict";
/**
 * Commit-gate check: WordPress Coding Standards on the lines a change adds or edits.
 *
 * Constitution §2 (clarified 2026-10-07): coding standards apply to touched lines, never
 * to the ~12k legacy findings already in the tree. This runs `vendor/bin/phpcs` on the
 * STAGED content of every staged PHP file and blocks only on findings whose line the
 * staged diff adds or changes against HEAD (the commit being made) -- not the master
 * merge-base, so lines already committed on this branch are never re-judged.
 *
 * Run from the repository root (as the flow gate does). Node 24, no npm dependencies.
 *
 *   exit 0  no in-scope staged PHP, or no finding on a changed line
 *   exit 1  a finding on a changed line, a missing phpcs, or a phpcs/parse failure
 */
const fs = require("fs");
const { execFileSync, spawnSync } = require("child_process");

const PHPCS = "vendor/bin/phpcs";
const STANDARD = ".phpcs.xml.dist";
const MAX_BUFFER = 64 * 1024 * 1024;

// Paths the ruleset excludes; no point linting them even when staged.
function isExcluded(file) {
	const parts = file.split("/");
	return (
		file.startsWith("vendor/") ||
		file.startsWith("settings/build/") ||
		parts.includes("node_modules")
	);
}

function git(args) {
	// Returns stdout as a string; throws on non-zero git exit.
	return execFileSync("git", args, { encoding: "utf8", maxBuffer: MAX_BUFFER });
}

function fail(lines) {
	for (const line of lines) {
		console.error(line);
	}
	process.exit(1);
}

// Staged PHP files, added/copied/modified/renamed, measured against HEAD.
let staged;
try {
	staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "HEAD", "--", "*.php"]);
} catch (e) {
	fail([
		"phpcs-changed-lines: could not list staged PHP files.",
		String((e && e.stderr) || (e && e.message) || e),
	]);
}
const files = staged
	.split("\n")
	.map((f) => f.trim())
	.filter((f) => f && !isExcluded(f));

if (files.length === 0) {
	process.exit(0); // Nothing in scope: silent pass.
}

if (!fs.existsSync(PHPCS)) {
	fail([
		"phpcs-changed-lines: " + PHPCS + " is missing but PHP changes are staged.",
		"Run `composer install` to install the coding-standards tooling, then retry.",
	]);
}

// Lines the staged diff adds or changes, from the new-side of each -U0 hunk header.
function changedLines(file) {
	let diff;
	try {
		diff = git(["diff", "--cached", "-U0", "HEAD", "--", file]);
	} catch (e) {
		fail([
			"phpcs-changed-lines: could not diff staged " + file + ".",
			String((e && e.stderr) || (e && e.message) || e),
		]);
	}
	const set = new Set();
	const header = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/;
	for (const line of diff.split("\n")) {
		const m = header.exec(line);
		if (!m) continue;
		const start = parseInt(m[1], 10);
		const count = m[2] === undefined ? 1 : parseInt(m[2], 10);
		for (let i = 0; i < count; i++) {
			set.add(start + i); // count 0 (pure deletion) adds nothing.
		}
	}
	return set;
}

const blocking = []; // { file, line, column, type, source, message }
const loud = []; // phpcs could not process a file / unparsable output

for (const file of files) {
	const changed = changedLines(file);
	if (changed.size === 0) {
		continue; // Only deletions staged for this file: nothing to judge.
	}

	let content;
	try {
		content = execFileSync("git", ["show", ":" + file], { maxBuffer: MAX_BUFFER }); // Buffer: staged bytes.
	} catch (e) {
		fail([
			"phpcs-changed-lines: could not read staged content of " + file + ".",
			String((e && e.stderr) || (e && e.message) || e),
		]);
	}

	const res = spawnSync(
		PHPCS,
		["-q", "--no-colors", "--standard=" + STANDARD, "--report=json", "--stdin-path=" + file, "-"],
		{ input: content, encoding: "utf8", maxBuffer: MAX_BUFFER }
	);

	// phpcs exit codes: 0 clean, 1 findings, 2 findings incl. fixable. Anything else
	// (config/processing error, killed) means it never produced a report -- fail loudly.
	if (res.error || res.status === null || res.status > 2) {
		loud.push("phpcs-changed-lines: phpcs failed while checking " + file + " (exit " + res.status + ").");
		if (res.stdout) loud.push(res.stdout.trim());
		if (res.stderr) loud.push(res.stderr.trim());
		continue;
	}

	let parsed;
	try {
		parsed = JSON.parse(res.stdout);
	} catch (e) {
		loud.push("phpcs-changed-lines: could not parse phpcs JSON for " + file + ": " + e.message);
		loud.push((res.stdout || "").trim());
		continue;
	}

	const entry = parsed && parsed.files && Object.values(parsed.files)[0];
	if (!entry || !Array.isArray(entry.messages)) {
		loud.push("phpcs-changed-lines: unexpected phpcs output for " + file + ".");
		loud.push((res.stdout || "").trim());
		continue;
	}

	for (const msg of entry.messages) {
		// Internal.* are phpcs's own processing errors: block regardless of line.
		const isInternal = typeof msg.source === "string" && msg.source.indexOf("Internal.") === 0;
		if (isInternal || changed.has(msg.line)) {
			blocking.push({
				file: file,
				line: msg.line,
				column: msg.column,
				type: msg.type,
				source: msg.source,
				message: msg.message,
			});
		}
	}
}

if (loud.length || blocking.length) {
	const out = [];
	for (const b of blocking) {
		out.push(b.file + ":" + b.line + ":" + b.column + " " + b.type + " " + b.source + " " + b.message);
	}
	for (const l of loud) {
		out.push(l);
	}
	const n = blocking.length;
	out.push(
		"phpcs-changed-lines: " +
			n +
			" coding-standards finding" +
			(n === 1 ? "" : "s") +
			" on changed lines. Fix them (do not weaken the ruleset)."
	);
	fail(out);
}

process.exit(0);
