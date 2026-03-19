Analyze the current git diff. If changes span multiple unrelated concerns,
suggest splitting into separate commits. For each commit:
1. Determine the type: feat, fix, docs, chore, refactor, test, ci
2. Write a concise subject line (max 72 chars) in imperative mood
3. Add a body if the change is non-obvious, explaining WHY not WHAT
4. ALWAYS include the GitHub Issue ID: `feat: add search bar [#123]`
   - If no GitHub Issue exists for this change, note it and suggest creating one
5. Never use --no-verify
6. Verify all tests pass before committing: `composer run phpcs && ./vendor/bin/phpunit`
7. After committing, comment on the GitHub Issue with a brief summary of
   what was committed and any remaining work
