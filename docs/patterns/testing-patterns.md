# Testing Patterns

## Framework
PHPUnit 9 with WordPress test bootstrap.

## Test Location
All tests in `tests/` directory. Naming: `test-{feature}.php`.

## Setup
```bash
# Install WordPress test environment
bash bin/install-wp-tests.sh wordpress_test root '' localhost latest
# Run tests
./vendor/bin/phpunit
```

## Test Structure
- Extend `WP_UnitTestCase` for WordPress integration tests
- Use `setUp()` / `tearDown()` for fixtures
- Custom table cleanup needed in `tearDown()` for `wp_cmplz_*` tables

## Naming Convention
- Class: `Test_{Feature}` (e.g., `Test_Installer`)
- Method: `test_{behavior}` (e.g., `test_activation_creates_tables`)

## Key Existing Tests
- `test-404.php` (4734 lines) — Error handling and edge cases
- `test-installer.php` (2105 lines) — Plugin installation and upgrade paths

## Rules
- Write tests from spec, not implementation
- NEVER modify assertions to make tests pass
- Test behavior, not implementation details
- Clean up custom tables after each test
