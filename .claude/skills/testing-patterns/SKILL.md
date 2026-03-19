# Skill: Testing Patterns

## When to Use
Activate when writing or modifying tests, setting up test fixtures,
or debugging test failures.

## Patterns

### Test Framework
PHPUnit 9 with WordPress test bootstrap (`tests/bootstrap.php`).
WordPress test library provides factory methods and assertions.

### Test File Naming
Files: `tests/test-{feature}.php`
Classes: `Test_{Feature}` extending `WP_UnitTestCase`
Methods: `test_{behavior_description}` in snake_case

### Test Structure
```php
class Test_Feature extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();
        // Setup per-test fixtures
    }

    public function test_descriptive_behavior_name() {
        // Arrange
        // Act
        // Assert
    }
}
```

### WordPress Test Helpers
- `$this->factory->post->create()` — Create test posts
- `$this->factory->user->create()` — Create test users
- `wp_set_current_user()` — Set auth context
- `$this->go_to()` — Simulate page visit
- `do_action()` / `apply_filters()` — Trigger hooks in tests

### Database Isolation
WordPress test suite rolls back DB after each test.
Custom tables (`wp_cmplz_*`) need explicit cleanup in `tearDown()`.

### Running Tests
- All tests: `./vendor/bin/phpunit`
- Single file: `./vendor/bin/phpunit tests/test-{feature}.php`
- Single test: `./vendor/bin/phpunit --filter test_method_name`

## Anti-Patterns
- Testing implementation details instead of behavior
- Modifying assertions to match buggy code
- Skipping database cleanup for custom tables
- Mocking WordPress core functions unnecessarily

## Verification
`./vendor/bin/phpunit` must pass with zero failures before committing.
