# Skill: Security Practices

## When to Use
Activate when working on authentication, authorization, API endpoints, form handling,
data storage, or any code that processes external input.

## Patterns

### Input Validation
Validate all external input at the boundary (REST endpoint, AJAX handler, form processor).
Use WordPress sanitization functions: `sanitize_text_field()`, `absint()`, `wp_kses()`.
Never trust `$_GET`, `$_POST`, `$_REQUEST` without sanitization.

### Secrets Management
- All secrets in wp-config.php or environment variables, never in code
- .env locally (gitignored), wp-config.php constants in production
- Never log secrets, tokens, passwords, or API keys
- Use `CMPLZ_SELF_HOSTED_API_URL` pattern for configurable endpoints

### Authentication & Authorization
- Nonce verification: `wp_verify_nonce()` on all state-changing requests
- Capability checks: `current_user_can('manage_options')` on admin actions
- REST API: always set `permission_callback` in `register_rest_route()`
- Never rely on client-side checks alone

### Database Security
- Always use `$wpdb->prepare()` for parameterized queries
- Use `$wpdb->insert()`, `$wpdb->update()`, `$wpdb->delete()` helpers
- Escape output: `esc_sql()` only as last resort, prefer prepared statements

### Data Privacy
- Minimize data collection. Only store what you need.
- Encrypt sensitive data at rest
- Implement data deletion in uninstall.php
- Never include PII in logs, error messages, or URLs

## Anti-Patterns
- String concatenation in SQL queries
- Missing nonce verification on AJAX handlers
- `current_user_can()` with wrong capability
- Using `wp_kses_post()` where `esc_html()` suffices
- Wildcard CORS headers in production

## Verification
- Run `composer run phpcs` (includes security rules)
- Check for `$wpdb->query()` without `prepare()`
- Verify nonces on all form handlers
