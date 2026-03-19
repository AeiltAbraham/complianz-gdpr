# Skill: WordPress Plugin Patterns

## When to Use
Activate when working on plugin core, hooks, filters, admin pages, settings API,
or any WordPress-specific functionality.

## Patterns

### Singleton Pattern (Main Plugin Class)
Complianz uses a singleton for the main `COMPLIANZ` class. Access via `COMPLIANZ::instance()`.
Never instantiate directly. Module instances are static properties on the main class.

### Hook Registration
Register hooks in class constructors or dedicated `init()` methods.
Use WordPress action/filter priority system. Complianz uses priority 9 on `plugins_loaded`.

### Options Storage
All settings stored in single `cmplz_options` serialized array.
Access via `cmplz_get_option($key)` and `cmplz_update_option($key, $value)`.
Never access `get_option('cmplz_options')` directly.

### Multisite Handling
Use `switch_to_blog()` / `restore_current_blog()` when iterating sites.
Per-blog tables created via `cmplz_install_tables` on blog creation.

### Nonce Verification
All form submissions: `wp_verify_nonce()` before processing.
All AJAX handlers: `check_ajax_referer()` at handler start.
REST API: use `permission_callback` in route registration.

## Anti-Patterns
- Direct `$wpdb->query()` without `$wpdb->prepare()`
- Echoing unescaped user data (use `esc_html()`, `esc_attr()`, `wp_kses()`)
- Missing capability checks on admin actions
- Loading admin assets on all pages (check `$hook` parameter)
- Using `extract()` on user input

## Verification
After any WordPress-specific changes: `composer run phpcs && ./vendor/bin/phpunit`
