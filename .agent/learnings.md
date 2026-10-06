# Learnings

Lessons and scored instincts captured by `/flow:learn` and `/flow:retro`.

### 2026-10-06 flow gate hook matches the command text, not what actually runs
confidence: 0.3   # 0.3 first observation, +0.2 each recurrence, cap 1.0
context: The PreToolUse gate (flow `scripts/gate.js`) regex-matches the raw Bash command string. During `/flow:init`, a self-test whose JSON payload merely contained `git commit --no-verify` inside quotes was blocked before anything ran. The commit regex (`\bgit(\s+\S+)*\s+commit\b`) also spans chained commands, so any command with `git …` followed later by a space-separated `commit` or `push` word triggers the full check run first.
action: Keep the words `git … commit` / `git … push` and the skip-hooks flag out of any Bash command that is not a real commit or push. Put such text (test payloads, snippets) in a file with the Write tool and reference the file instead.
promote-at: 0.8 -> becomes a CLAUDE.md line, or a gate.js fix proposed upstream via `/flow:retro` (match executed commands, not quoted text)
