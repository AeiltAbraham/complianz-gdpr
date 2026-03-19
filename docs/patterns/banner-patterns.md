# Cookie Banner Patterns

## Banner Architecture
- `CMPLZ_COOKIEBANNER` class: banner template data model (DB table `wp_cmplz_cookiebanners`)
- `cmplz_banner_loader`: frontend rendering, CSS generation, script enqueuing

## Banner Configuration
Banners are configured per-template. Multiple templates supported.
Key settings: position, styling, consent categories, text strings.

## Consent Flow
1. Page loads → banner_loader checks consent status
2. No consent → banner displayed with category options
3. User accepts → consent stored (cookie + optional server-side proof)
4. Consented scripts unblocked → page reloads or scripts injected dynamically
5. Proof of consent logged to `proof-of-consent/` system

## Customization
- Banner text: configurable per region (GDPR, CCPA, etc.)
- Styling: CSS custom properties, template-based
- Position: bottom bar, popup, floating
- Categories: functional (always on), statistics, preferences, marketing

## Frontend Assets
- Banner JS: `assets/js/`
- Banner CSS: generated dynamically based on template settings
- Placeholder images: `placeholders/`
