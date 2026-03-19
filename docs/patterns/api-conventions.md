# REST API Conventions

## Namespace
All endpoints under `complianz/v1`.

## Route Registration
```php
register_rest_route('complianz/v1', '/endpoint', array(
    'methods'             => 'GET',
    'callback'            => 'cmplz_rest_callback',
    'permission_callback' => function() {
        return current_user_can('manage_options');
    },
    'args' => array(
        'param' => array(
            'required'          => true,
            'sanitize_callback' => 'sanitize_text_field',
        ),
    ),
));
```

## Response Format
- Success: `new WP_REST_Response($data, 200)`
- Error: `new WP_Error('code', 'message', array('status' => 400))`
- Always return typed responses, not raw arrays

## Authentication
- Admin endpoints: `current_user_can('manage_options')`
- Public endpoints: `__return_true` with rate limiting
- Nonce handled by WordPress REST infrastructure for authenticated requests

## Existing Endpoints
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/documents` | GET | Public | Policy document content |
| `/banner` | GET | Public | Banner configuration |
| `/track` | POST | Public | Consent tracking |
| `/manage_consent_html` | GET | Public | Consent management UI |
| `/store_cookies` | POST | Admin | Cookie database updates |
