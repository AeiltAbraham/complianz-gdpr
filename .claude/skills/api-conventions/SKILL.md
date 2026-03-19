# Skill: REST API Conventions

## When to Use
Activate when working on REST API endpoints in `rest-api/`, AJAX handlers,
or any server-client communication.

## Patterns

### REST Route Registration
All routes registered under `complianz/v1` namespace.
Use `register_rest_route()` with explicit `permission_callback`.
Group related endpoints in a single registration file.

### Existing Endpoints
- `complianz/v1/documents` — Policy document retrieval
- `complianz/v1/banner` — Banner configuration
- `complianz/v1/track` — Consent tracking
- `complianz/v1/manage_consent_html` — Consent management UI
- `complianz/v1/store_cookies` — Cookie storage

### Permission Callbacks
Admin endpoints: `current_user_can('manage_options')`
Public endpoints: `__return_true` (with rate limiting consideration)
Always validate nonce for authenticated requests.

### Response Format
Return `WP_REST_Response` or `WP_Error`.
Use appropriate HTTP status codes.
Include meaningful error messages for debugging (without exposing internals).

### React Admin Communication
Settings UI in `settings/src/` communicates via REST API.
Uses `@wordpress/api-fetch` for authenticated requests.
Nonce handled automatically by WordPress REST infrastructure.

## Anti-Patterns
- REST routes without permission_callback (triggers WordPress deprecation notice)
- Returning raw arrays instead of WP_REST_Response
- Exposing internal error details to unauthenticated users
- Not sanitizing REST request parameters

## Verification
Test endpoints with and without authentication. Check response codes and formats.
