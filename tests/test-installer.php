<?php

require( 'class-installer.php' );

class CmplzInstallerTest extends WP_UnitTestCase {
    /**
     * @throws Exception
     */
    public function setUp(): void {
        // Gitlab pipeline requires direct filesystem methods! Without FS_METHOD tests will fail
        if ( ! defined('FS_METHOD') ) {
            define('FS_METHOD', 'direct');
        }

        // Load WordPress environment
        // Make it suitable for localhost and pipeline
        $max_dirs = 10;
        // Let's locate wp-load.php, if not loaded already
        $found_wp_load = defined('WPINC');
        if ( ! $found_wp_load ) {
            for ($i = 1; $i <= $max_dirs; $i++) {
                $path = dirname(__FILE__, $i) . '/wp-load.php';
                if ( file_exists( $path ) ) {
                    require_once($path);
                    break;
                }
            }
        }

        // Set an active user, otherwise capability checks will fail
        wp_set_current_user(1);
        $user = wp_get_current_user();
        if ( ! $user->has_cap('manage_burst_statistics') ) {
            $user->add_cap('manage_burst_statistics');
        }

        // Activate any required plugins, account for multisite
        if ( ! is_multisite() ) {
            activate_plugin('complianz-gpdr.php');
        } else {
            activate_plugin('complianz-gpdr.php', '', true);
        }
    }

    /**
     * Downloads and activates a plugin from wordpress.org; excluded from the default run.
     *
     * @group external-http
     */
    public function test_plugin_installation() {

        $installer = new cmplz_installer( 'complianz-terms-conditions' );

        $this->assertTrue( $installer->download_plugin(), 'Download of complianz-terms-conditions plugin failed.' );
        // Get clean after every download, otherwise issues with ob_level going up
        ob_get_clean();

        $this->assertTrue( $installer->plugin_is_downloaded(), 'complianz-terms-conditions plugin is not downloaded.' );

        $this->assertTrue( $installer->activate_plugin(), 'Activation of complianz-terms-conditions plugin failed.' );

        $this->assertTrue( $installer->plugin_is_activated(), 'complianz-terms-conditions plugin is not activated.' );
    }
}
