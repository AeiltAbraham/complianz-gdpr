# Testing

How to run the automated tests for this plugin locally. For now this covers the PHPUnit
suite (PHP logic against the WordPress test library). The JavaScript/end-to-end suite is
added by a later feature-001 task and will be documented in its own section below.

## PHPUnit suite

The PHP tests live in `tests/test-*.php` and run against the **WordPress test library**
(`bin/install-wp-tests.sh`), which needs a MySQL-compatible database. `phpunit.xml.dist`
is the suite configuration; `tests/bootstrap.php` boots WordPress and loads the plugin.

Tests that reach the network are tagged `@group external-http` (WordPress core's own
convention) and are excluded from the default run.

### Prerequisites

- PHP 8.x with the `mysqli` extension (verified on PHP 8.5.4, mysqlnd).
- Composer dev dependencies installed: `composer install` (provides
  `vendor/bin/phpunit`, PHPUnit 9.6).
- Docker, plus the host tools `svn` and `curl` (used by `bin/install-wp-tests.sh`).

### 1. Start a database container

We use **MariaDB**, not MySQL. The Homebrew MySQL 9.6 client no longer ships the
`mysql_native_password` *client* plugin, so it cannot authenticate to the server over TCP;
PHP's `mysqli`/mysqlnd has that auth method built in and connects to MariaDB without
trouble. Because the host client can't connect, we drive the one-time database setup
through the container's own client (steps 2) and tell the installer to skip database
creation (step 3).

The password below is a throwaway, **local-only** credential — never reuse it anywhere.

```bash
docker run -d --name cmplz-phpunit-db \
  -p 127.0.0.1:13306:3306 \
  -e MARIADB_ROOT_PASSWORD=root_local_only \
  mariadb:11.4
```

Port `13306` is bound to `127.0.0.1` only. Wait a second or two for it to come up:

```bash
docker exec cmplz-phpunit-db mariadb-admin ping -uroot -proot_local_only --silent
```

### 2. Create the test user and database

Run these through the container client (the host client can't authenticate — see step 1).
The `wp@'%'` user may connect from the host over the published port.

```bash
docker exec cmplz-phpunit-db mariadb -uroot -proot_local_only -e \
  "CREATE USER IF NOT EXISTS 'wp'@'%' IDENTIFIED BY 'wp_local_only'; \
   GRANT ALL PRIVILEGES ON *.* TO 'wp'@'%' WITH GRANT OPTION; \
   FLUSH PRIVILEGES;"

docker exec cmplz-phpunit-db mariadb -uroot -proot_local_only -e \
  "CREATE DATABASE IF NOT EXISTS wordpress_test;"
```

### 3. Install the WordPress test library

The final `true` is the installer's `skip-database-creation` flag: the database already
exists (step 2) and the host `mysql`/`mysqladmin` client can't connect, so we skip the
installer's own database step. Everything else (WordPress core, the test suite,
`wp-tests-config.php`) is still provisioned.

```bash
bash bin/install-wp-tests.sh wordpress_test wp wp_local_only 127.0.0.1:13306 latest true
```

This writes WordPress core to `$TMPDIR/wordpress` and the test library to
`$TMPDIR/wordpress-tests-lib` (on macOS, `$TMPDIR` is the per-user
`/var/folders/.../T` path). That is also where `tests/bootstrap.php` looks by default
(`sys_get_temp_dir() . '/wordpress-tests-lib'`), so no environment variable is needed when
running PHPUnit. To install elsewhere, export `WP_TESTS_DIR` and `WP_CORE_DIR` for both the
installer and PHPUnit.

> Note: the installer downloads a `wp-content/db.php` drop-in from `raw.github.com`, which
> now redirects; with `curl` (no `-L`) the file lands empty (0 bytes). This is harmless —
> WordPress falls back to its built-in `mysqli` database layer.

### 4. Run the suite

The default run excludes the `external-http` group. Both existing tests are in that group,
so today the default run executes no tests (PHPUnit prints `No tests executed!` and exits
0); offline unit tests added later, such as the Phase 4 dashboard-block tests, run here:

```bash
composer test
# equivalently:
vendor/bin/phpunit --configuration phpunit.xml.dist --exclude-group external-http
```

List the discovered tests (does not touch the network; this is task T-005's proof command):

```bash
vendor/bin/phpunit --configuration phpunit.xml.dist --list-tests
```

`--list-tests` always enumerates the whole suite (group filters do not affect listing), so
both `CmplzTestUrls::test_external_links` and `CmplzInstallerTest::test_plugin_installation`
appear.

### 5. The external-http group

Two tests need the network and are tagged `@group external-http`:
`CmplzTestUrls::test_external_links` (`tests/test-404.php`) calls `wp_remote_get()` against
live URLs, and `CmplzInstallerTest::test_plugin_installation` (`tests/test-installer.php`)
downloads and activates `complianz-terms-conditions` from wordpress.org. Selecting the group
on the command line overrides the exclusion in `phpunit.xml.dist`:

```bash
vendor/bin/phpunit --configuration phpunit.xml.dist --group external-http
```

### 6. Stop and remove the database

```bash
docker stop cmplz-phpunit-db
docker rm cmplz-phpunit-db
```

### Known issues

- **`CmplzInstallerTest` used to target `burst-statistics`,** a slug `class-installer.php`
  never supported, so it failed on every run. With the maintainer's approval (2026-10-07)
  it now installs `complianz-terms-conditions`, a supported slug; its assertions are
  unchanged. PHPUnit reports it as risky ("did not (only) close its own output buffers")
  because of the test's existing `ob_get_clean()` call; all four assertions pass.
- The harmless warning `Constant WP_DEBUG already defined` comes from both
  `tests/bootstrap.php` and the generated `wp-tests-config.php` defining it.

## End-to-end / JavaScript tests

Added by a later feature-001 task (SC-06). This section will document the Playwright
end-to-end and screenshot suites once that task lands.
