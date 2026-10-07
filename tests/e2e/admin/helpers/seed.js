/**
 * Shared fixture-seeding helper for the setup projects (T-008, ADR-011 / §8.1.2).
 *
 * Runs tests/e2e/admin/fixtures/seed.php through the instance's own wp-cli via `wp eval-file`,
 * so both instances are seeded identically from their setup project without duplicating the
 * invocation. The path is resolved inside the container, where this checkout is mapped at
 * wp-content/plugins/complianz-gdpr and wp-cli runs from the WordPress root (/var/www/html).
 */

// Path to the seed script as seen from inside the wp-env container (relative to the wp-cli
// working directory, the WordPress root). The plugin is mapped at this location by .wp-env.json.
const SEED_FILE = 'wp-content/plugins/complianz-gdpr/tests/e2e/admin/fixtures/seed.php';

/**
 * Seed the fixture on one instance.
 *
 * @param {function(string, object=): string} wp The setup file's wp-cli wrapper; receives the
 *        arguments after `wp` and returns stdout (throws on failure).
 * @return {string} The wp-cli output of the eval-file run.
 */
function seed( wp ) {
	return wp( `eval-file ${ SEED_FILE }` );
}

module.exports = { seed, SEED_FILE };
