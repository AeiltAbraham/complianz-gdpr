Enter planning mode for a feature. Read the spec from docs/specs/SPEC-{feature}.md.
If no spec exists, prompt the user to create one first.

Decompose into tasks following these rules:
- Each task completable in one Claude Code session
- 3-6 acceptance criteria per task
- Ordered by dependency
- Complexity: S (< 50 lines), M (50-200 lines), L (200+, consider splitting)

Output to docs/plans/PLAN-{feature}.md using the plan template.

After writing the plan:
- Suggest creating a GitHub Issue (epic) for the feature if not already created
- Suggest creating sub-issues for each plan task
- Each sub-issue should reference its plan task number

Do NOT implement anything. Planning only.
