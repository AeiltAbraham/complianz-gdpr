Read the active plan in docs/plans/ and find the next uncompleted task.
Before implementing:
1. Read the spec for feature context
2. Read relevant docs/patterns/ files
3. Identify all files to create or modify
4. State approach and ask for approval
5. Comment on the GitHub Issue that work is starting

Implement the task following all CLAUDE.md conventions.

After completion:
1. Run the full verification command: `composer run phpcs && ./vendor/bin/phpunit`
2. Mark the task as complete in the plan
3. If all tests pass, commit using the /commit workflow
4. Comment on the GitHub Issue with completion summary
5. If the task is fully done and tests pass, note it can be closed
6. If partially complete, comment with remaining items
