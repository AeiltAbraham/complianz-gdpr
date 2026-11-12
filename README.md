![Complianz](https://ps.w.org/complianz-gdpr/assets/banner-1544x500.png)

**This is the Complianz GitHub repository. The Only Privacy Suite for WordPress. We welcome everyone to work together creating a privacy-friendly website experience.**

## The Privacy Suite for WordPress

At Complianz we are working towards a full-featured privacy suite for all WordPress users to comply with the privacy guidelines for their targeted regions. And we try to make it as easy as possible, while respecting the different guidelines and variability. As privacy is not an easy subject we highly appreciate any feedback, pull requests and issues to further simplify this subject and improve our product, and therefore privacy-friendly websites world-wide and happy users.

### Developers Guide and Contributions

If you're a developer and want to help out, please feel free to contribute anyway you can. We respond to any pull request or issue on GitHub. Start with reading the [developers guide](https://complianz.io/developers-guide-for-third-party-integrations/) to get a head start.

**Bug report:** Please start an issue, and if you have a fix a pull request. Please explain your issue clearly, and use comments when adding a pull request. Your contribution will be acknowledges on WordPress.org.

**New Features:** New features can also be assigned to issues. If you want to add a new feature, please see if you can add it to our [integrations hub](https://github.com/Really-Simple-Plugins/complianz-integrations).

**Translations:** Looking for your own language to be improved or added? Contact [support](https://complianz.io/support/) if you want to be a premium contributor, or make your first changes on [translate.wordpress.org](https://translate.wordpress.org/projects/wp-plugins/complianz-gdpr/).

### Support

For support, we kindly ask you to start at our [support forum](https://wordpress.org/support/plugin/complianz-gdpr/) and our documentation at [complianz.io/docs/](https://complianz.io/docs). If you can't find a solution, do not hesitate to ask either on the forum or log a support ticket.

If you like Complianz - Please [rate us](https://wordpress.org/support/plugin/complianz-gdpr/reviews/) on WordPress.org

## Development

The dev tools are declared in `composer.json` (`require-dev`). The commands below are run from the plugin root.

**Install the dev tools** (PHP_CodeSniffer, WordPress Coding Standards, PHPCompatibility, PHPUnit):

```sh
composer install
```

**PHP syntax check** of a file you changed:

```sh
php -l complianz-gpdr.php
```

**Coding standards check** with PHP_CodeSniffer. It reads the ruleset in `.phpcs.xml.dist`; pass the files you changed:

```sh
vendor/bin/phpcs path/to/changed-file.php
```

`composer phpcs` runs `phpcs -p -s *.php` (the PHP files in the plugin root only).

**Unit tests** with PHPUnit (`phpunit.xml.dist`, bootstrap `tests/bootstrap.php`):

```sh
vendor/bin/phpunit
```

The tests need the WordPress test library and a MySQL database. Install them with `bin/install-wp-tests.sh`:

```sh
bash bin/install-wp-tests.sh <db-name> <db-user> <db-pass> [db-host] [wp-version]
```

Use a **disposable** database with a new, unique name on a local or throwaway MySQL server. The tests reset the tables of that database, so never use an existing database or a real site's credentials. If the library is installed outside the default location (`$TMPDIR/wordpress-tests-lib`), set `WP_TESTS_DIR` to its path before running PHPUnit.

Note: at the time of writing, `phpunit.xml.dist` points its test suite at `./tests/legacy/`, which does not exist, while the test files are `tests/test-*.php`. If `vendor/bin/phpunit` finds no tests, run the files directly, for example `vendor/bin/phpunit tests/test-404.php`.
