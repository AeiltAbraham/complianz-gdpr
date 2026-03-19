# Integration Patterns

## Adding a New Plugin Integration

1. Create a new file in `integrations/plugins/{plugin-name}.php`
2. Check if the target plugin is active before registering
3. Register known cookies the plugin sets via `cmplz_known_script_tags` filter
4. Add blocking patterns for scripts/iframes
5. Test with the target plugin active and inactive
6. Add the integration to the cookie database

## Standard Integration Template

```php
<?php
defined('ABSPATH') or die();

/**
 * Check if {Plugin Name} is active
 */
function cmplz_{plugin_slug}_active() {
    return defined('{PLUGIN_CONSTANT}') || class_exists('{Plugin_Class}');
}

if (!cmplz_{plugin_slug}_active()) return;

/**
 * Add known script tags for blocking
 */
function cmplz_{plugin_slug}_script_tags($tags) {
    $tags['{script-pattern}'] = array(
        'category' => 'marketing', // or statistics, preferences
    );
    return $tags;
}
add_filter('cmplz_known_script_tags', 'cmplz_{plugin_slug}_script_tags');
```

## Service Integration

Service integrations in `integrations/services/` follow the same pattern
but focus on external services (Google Maps, YouTube, etc.) rather than
WordPress plugins.
