# Learnings

Lessons and scored instincts captured by `/flow:learn` and `/flow:retro`.

### 2026-10-06 flow gate hook matches the command text, not what actually runs
confidence: 0.3   # 0.3 first observation, +0.2 each recurrence, cap 1.0
context: The PreToolUse gate (flow `scripts/gate.js`) regex-matches the raw Bash command string. During `/flow:init`, a self-test whose JSON payload merely contained `git commit --no-verify` inside quotes was blocked before anything ran. The commit regex (`\bgit(\s+\S+)*\s+commit\b`) also spans chained commands, so any command with `git …` followed later by a space-separated `commit` or `push` word triggers the full check run first.
action: Keep the words `git … commit` / `git … push` and the skip-hooks flag out of any Bash command that is not a real commit or push. Put such text (test payloads, snippets) in a file with the Write tool and reference the file instead.
promote-at: 0.8 -> becomes a CLAUDE.md line, or a gate.js fix proposed upstream via `/flow:retro` (match executed commands, not quoted text)

### 2026-10-07 don't set a verification bar that normal e2e flake can't clear
confidence: 0.3   # 0.3 first observation, +0.2 each recurrence, cap 1.0
context: For T-010 (visual/isolation screenshot baselines) the dispatcher demanded "5x double-proof all green + repeat-each + throttle" — 12+ cold runs, each perfect. Against a suite with ~1/10 residual flake (a login-cookie race + one banner screen at 768px), any single flake fails the campaign, so the implementer looped regenerate->fail->restart for ~4.5h without converging. The plan's own policy (§8.1.4) was the right bar all along: green with CI retries (`retries: 2`), anything that only passes on retry flagged flaky. After taking over, fixing the real login race (retry + nav wait) and seeding the documents the banner preview needs, the suite went 3x clean with retries unused.
action: When accepting an inherently flaky e2e/screenshot suite, use the project's retry policy (green with retries, flaky flagged) as the bar, not "N cold runs all green". Fix the identifiable root-cause flakes (races, missing deterministic state) directly; let retries absorb irreducible transient flake. Watch for an agent thrashing (repeated full re-runs, same ~1 failure each pass) as the signal the bar is wrong, and intervene rather than wait.
promote-at: 0.8 -> becomes a line in the planning or tdd skill: proof commands for flaky suites specify the retry policy, never a perfect-cold-run count
