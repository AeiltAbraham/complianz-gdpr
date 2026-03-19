# Skill: Integrations

## When to Use
Activate when adding new plugin or service integrations, modifying existing
integrations, or working in the `integrations/` directory.

## Patterns

### Plugin Integration Structure
Each integration is a single PHP file in `integrations/plugins/`.
106 existing integrations covering form plugins, page builders, analytics, etc.

Standard integration file pattern:
1. Check if target plugin is active
2. Register cookies the plugin sets
3. Add blocking patterns for scripts/iframes
4. Hook into Complianz filters for consent-aware loading

### Service Integration Structure
Service integrations live in `integrations/services/`.
29 existing integrations (Google Maps, YouTube, Hotjar, etc.).
Each maps a service to its cookies, data processing, and blocking rules.

### Integration Registration
Use Complianz filter hooks to register:
- `cmplz_known_script_tags` — Script patterns to block
- `cmplz_known_iframe_tags` — Iframe patterns to block
- `cmplz_whitelisted_script_tags` — Scripts exempt from blocking

### Placeholder System
Blocked iframes/embeds get replaced with consent placeholders.
Placeholder templates in `placeholders/`. Each integration can define custom placeholders.

## Anti-Patterns
- Adding integration without corresponding cookie database entries
- Blocking scripts without providing a way to re-enable after consent
- Not checking if the integrated plugin is actually active

## Verification
Test with the target plugin active and inactive. Verify cookie blocking works.
