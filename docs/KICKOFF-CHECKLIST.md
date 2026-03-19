# Complianz GDPR — Project Kickoff Checklist

## Agentic Infrastructure (DONE)
- [x] Root CLAUDE.md (under 80 lines)
- [x] .claude/agents/ — planner, implementer, reviewer, test-writer, documenter
- [x] .claude/skills/ — wordpress-patterns, cookie-management, integrations, security-practices, api-conventions, testing-patterns
- [x] .claude/commands/ — catchup, commit, plan, task, review, document, status
- [x] docs/ directory — specs/, plans/, adr/, patterns/
- [x] ADR template in docs/adr/
- [x] Pattern guides in docs/patterns/
- [x] Updated .gitignore

## Developer Setup (TODO)
- [ ] Run `composer install` to install PHP dependencies
- [ ] Run `cd settings && npm install` for React admin UI dependencies
- [ ] Run `cd gutenberg && npm install` for Gutenberg block dependencies
- [ ] Set up local WordPress environment (Local, DDEV, or Docker)
- [ ] Activate plugin in local WordPress
- [ ] Run `bash bin/install-wp-tests.sh wordpress_test root '' localhost latest` for test DB
- [ ] Verify `./vendor/bin/phpunit` passes
- [ ] Verify `composer run phpcs` passes

## GitHub Setup (TODO)
- [ ] Set up GitHub Actions CI workflow (replace Travis/GitLab CI)
- [ ] Configure branch protection on main
- [ ] Set up issue labels: Type (Feature, Bug, Chore, Tech-Debt, Spike) and Area (Auth, Cookie, Banner, Integration, Scanner, API, Admin, Docs)
- [ ] Create project board for tracking

## First Feature Workflow
1. Create a GitHub Issue for the feature
2. Write spec: `docs/specs/SPEC-{feature}.md` (use `/plan` to interview)
3. Plan: run `/plan` to decompose into tasks
4. Execute: run `/task` for each task (fresh context each)
5. Between tasks: `/document` then `/clear` then `/catchup`
6. Review: `/review` before merging
7. Commit: `/commit` with `[#issue-id]`
