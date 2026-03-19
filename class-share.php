<?php
defined( 'ABSPATH' ) or die( 'you do not have access to this page!' );

if ( ! class_exists( 'cmplz_share' ) ) {
	/**
	 * Class cmplz_share
	 *
	 * Handles cross-domain settings sharing via a time-limited secret key.
	 * Source site generates a key and exposes a REST endpoint for download.
	 * Receiver site fetches the export JSON using that key and imports it.
	 *
	 * @since 7.5.0
	 */
	class cmplz_share {
		private static $_this;

		/**
		 * Transient name for the share key data.
		 */
		const TRANSIENT_KEY = 'cmplz_share_key';

		/**
		 * Key validity in seconds (24 hours).
		 */
		const KEY_TTL = DAY_IN_SECONDS;

		/**
		 * Temp directory name inside uploads.
		 */
		const TEMP_DIR = 'complianz/temp';

		function __construct() {
			if ( isset( self::$_this ) ) {
				wp_die(
					sprintf(
						'%s is a singleton class and you cannot create a second instance.',
						get_class( $this )
					)
				);
			}

			self::$_this = $this;
			add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
			add_filter( 'cmplz_do_action', array( $this, 'handle_do_action' ), 10, 3 );
		}

		static function this() {
			return self::$_this;
		}

		/**
		 * Register public REST route for share download.
		 *
		 * @return void
		 */
		public function register_rest_routes() {
			register_rest_route(
				'complianz/v1',
				'share/download',
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'rest_api_share_download' ),
					'permission_callback' => '__return_true',
				)
			);
		}

		/**
		 * Handle do_action requests for share functionality.
		 *
		 * @param array           $data    Response data.
		 * @param string          $action  Action name.
		 * @param WP_REST_Request $request Request object.
		 *
		 * @return array
		 */
		public function handle_do_action( $data, $action, $request ) {
			if ( 'generate_share_key' === $action ) {
				$data = $this->generate_share_key();
			}

			if ( 'import_remote_settings' === $action ) {
				$url = $request->get_param( 'url' );
				$key = $request->get_param( 'key' );
				$url = ! empty( $url ) ? esc_url_raw( $url ) : '';
				$key = ! empty( $key ) ? sanitize_text_field( $key ) : '';
				$data = $this->import_from_remote( $url, $key );
			}

			return $data;
		}

		/**
		 * Generate a share key and prepare the export file.
		 *
		 * @return array Response with key and expiry.
		 */
		public function generate_share_key() {
			if ( ! cmplz_user_can_manage() ) {
				return array( 'success' => false, 'message' => __( 'Unauthorized.', 'complianz-gdpr' ) );
			}

			// Clean up any previous temp files.
			$this->cleanup();

			$key     = bin2hex( random_bytes( 32 ) );
			$expires = time() + self::KEY_TTL;

			// Write export JSON to temp file.
			$file_path = $this->write_export_file( $key );
			if ( ! $file_path ) {
				return array( 'success' => false, 'message' => __( 'Could not write export file.', 'complianz-gdpr' ) );
			}

			// Store key data in transient.
			cmplz_set_transient(
				self::TRANSIENT_KEY,
				array(
					'key'       => $key,
					'file_path' => $file_path,
					'expires'   => $expires,
				),
				self::KEY_TTL
			);

			return array(
				'success' => true,
				'key'     => $key,
				'expires' => gmdate( 'Y-m-d H:i:s', $expires ),
			);
		}

		/**
		 * REST callback: serve the export JSON if the key is valid.
		 *
		 * @param WP_REST_Request $request Request object.
		 *
		 * @return WP_REST_Response|WP_Error
		 */
		public function rest_api_share_download( $request ) {
			$key = sanitize_text_field( $request->get_param( 'key' ) );

			if ( empty( $key ) || ! ctype_xdigit( $key ) || strlen( $key ) !== 64 ) {
				return new WP_Error(
					'cmplz_invalid_key',
					__( 'Invalid share key format.', 'complianz-gdpr' ),
					array( 'status' => 403 )
				);
			}

			// Rate limiting: max 5 failed attempts per IP per hour.
			if ( $this->is_rate_limited() ) {
				return new WP_Error(
					'cmplz_rate_limited',
					__( 'Too many failed attempts. Please try again later.', 'complianz-gdpr' ),
					array( 'status' => 429 )
				);
			}

			$share_data = cmplz_get_transient( self::TRANSIENT_KEY );
			if ( ! $share_data || ! isset( $share_data['key'] ) ) {
				$this->record_failed_attempt();
				return new WP_Error(
					'cmplz_no_active_key',
					__( 'No active share key found. The key may have expired.', 'complianz-gdpr' ),
					array( 'status' => 403 )
				);
			}

			if ( ! hash_equals( $share_data['key'], $key ) ) {
				$this->record_failed_attempt();
				return new WP_Error(
					'cmplz_invalid_key',
					__( 'Invalid share key.', 'complianz-gdpr' ),
					array( 'status' => 403 )
				);
			}

			// Key is valid — read the export file.
			$file_path = $share_data['file_path'];
			if ( ! file_exists( $file_path ) ) {
				return new WP_Error(
					'cmplz_file_missing',
					__( 'Export file not found. Please generate a new key.', 'complianz-gdpr' ),
					array( 'status' => 404 )
				);
			}

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- reading local temp file
			$json = file_get_contents( $file_path );

			// Remove the Complianz suffix before decoding.
			$json = str_replace( '#--COMPLIANZ--#', '', $json );
			$data = json_decode( $json, true );

			if ( ! $data ) {
				return new WP_Error(
					'cmplz_invalid_export',
					__( 'Export file is corrupted. Please generate a new key.', 'complianz-gdpr' ),
					array( 'status' => 500 )
				);
			}

			return new WP_REST_Response( $data, 200 );
		}

		/**
		 * Import settings from a remote Complianz site.
		 *
		 * @param string $url Source site URL.
		 * @param string $key Share key.
		 *
		 * @return array
		 */
		public function import_from_remote( $url, $key ) {
			if ( ! cmplz_user_can_manage() ) {
				return array( 'success' => false, 'message' => __( 'Unauthorized.', 'complianz-gdpr' ) );
			}

			if ( empty( $url ) || empty( $key ) ) {
				return array( 'success' => false, 'message' => __( 'Please provide both a site URL and a share key.', 'complianz-gdpr' ) );
			}

			if ( ! ctype_xdigit( $key ) || strlen( $key ) !== 64 ) {
				return array( 'success' => false, 'message' => __( 'Invalid key format.', 'complianz-gdpr' ) );
			}

			// Build the endpoint URL.
			$endpoint = trailingslashit( $url ) . 'wp-json/complianz/v1/share/download';
			$endpoint = add_query_arg( 'key', $key, $endpoint );

			$response = wp_remote_get(
				$endpoint,
				array(
					'timeout'   => 30,
					'sslverify' => true,
				)
			);

			if ( is_wp_error( $response ) ) {
				return array(
					'success' => false,
					'message' => sprintf(
						/* translators: %s: error message */
						__( 'Could not connect to the remote site: %s', 'complianz-gdpr' ),
						$response->get_error_message()
					),
				);
			}

			$code = wp_remote_retrieve_response_code( $response );
			$body = wp_remote_retrieve_body( $response );
			$data = json_decode( $body, true );

			if ( 200 !== $code || ! is_array( $data ) ) {
				$message = isset( $data['message'] ) ? $data['message'] : __( 'Unknown error from the remote site.', 'complianz-gdpr' );
				return array( 'success' => false, 'message' => $message );
			}

			return $this->import_settings( $data );
		}

		/**
		 * General-purpose import handler.
		 * Parses the Complianz export format and applies settings + banners.
		 *
		 * @param array $data Decoded export data with 'settings' and/or 'banners' keys.
		 *
		 * @return array
		 */
		public function import_settings( $data ) {
			if ( ! cmplz_user_can_manage() ) {
				return array( 'success' => false, 'message' => __( 'Unauthorized.', 'complianz-gdpr' ) );
			}

			if ( ! is_array( $data ) ) {
				return array( 'success' => false, 'message' => __( 'Invalid import data.', 'complianz-gdpr' ) );
			}

			$imported = array();

			// Import settings.
			if ( isset( $data['settings'] ) && is_array( $data['settings'] ) ) {
				$current_settings = get_option( 'cmplz_options', array() );
				$new_settings     = array_merge( $current_settings, $data['settings'] );

				// Remove site-specific keys that should not transfer.
				unset( $new_settings['a_b_testing'] );
				unset( $new_settings['a_b_testing_buttons'] );

				update_option( 'cmplz_options', $new_settings );
				$imported[] = 'settings';
			}

			// Import banners.
			if ( isset( $data['banners'] ) && is_array( $data['banners'] ) ) {
				foreach ( $data['banners'] as $banner_data ) {
					if ( ! is_array( $banner_data ) ) {
						continue;
					}

					// Fields that reference source-site attachment IDs and should not transfer.
					$skip_fields = array( 'ID', 'logo_attachment_id' );

					$banner = new CMPLZ_COOKIEBANNER();
					foreach ( $banner_data as $field_name => $value ) {
						if ( in_array( $field_name, $skip_fields, true ) ) {
							continue;
						}
						if ( property_exists( $banner, $field_name ) ) {
							$banner->{$field_name} = $value;
						}
					}
					$banner->save();
				}
				$imported[] = 'banners';
			}

			if ( empty( $imported ) ) {
				return array( 'success' => false, 'message' => __( 'No settings or banners found in import data.', 'complianz-gdpr' ) );
			}

			return array(
				'success'  => true,
				'message'  => sprintf(
					/* translators: %s: comma-separated list of imported items */
					__( 'Successfully imported: %s', 'complianz-gdpr' ),
					implode( ', ', $imported )
				),
				'imported' => $imported,
			);
		}

		/**
		 * Write the export JSON to a temp file in the uploads directory.
		 *
		 * @param string $key The share key (used to generate the filename hash).
		 *
		 * @return string|false File path on success, false on failure.
		 */
		private function write_export_file( $key ) {
			$upload_dir = wp_upload_dir();
			$temp_dir   = trailingslashit( $upload_dir['basedir'] ) . self::TEMP_DIR;

			if ( ! file_exists( $temp_dir ) ) {
				wp_mkdir_p( $temp_dir );
			}

			// Protect temp directory from direct access.
			$htaccess = trailingslashit( $temp_dir ) . '.htaccess';
			if ( ! file_exists( $htaccess ) ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- writing .htaccess in plugin temp dir
				file_put_contents( $htaccess, "deny from all\n" );
			}

			// Build export data in the same format as class-export.php.
			$settings = get_option( 'cmplz_options' );
			if ( is_array( $settings ) ) {
				$settings['a_b_testing']         = false;
				$settings['a_b_testing_buttons'] = false;
			}

			$export = array(
				'settings' => $settings,
				'banners'  => cmplz_get_cookiebanners(),
			);

			$json      = wp_json_encode( $export ) . '#--COMPLIANZ--#';
			$file_hash = wp_hash( $key );
			$file_path = trailingslashit( $temp_dir ) . 'cmplz-share-' . $file_hash . '.json';

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- writing temp export file
			$written = file_put_contents( $file_path, $json );

			if ( false === $written ) {
				return false;
			}

			return $file_path;
		}

		/**
		 * Clean up expired temp files.
		 *
		 * @return void
		 */
		public function cleanup() {
			$upload_dir = wp_upload_dir();
			$temp_dir   = trailingslashit( $upload_dir['basedir'] ) . self::TEMP_DIR;

			if ( ! is_dir( $temp_dir ) ) {
				return;
			}

			$files = glob( trailingslashit( $temp_dir ) . 'cmplz-share-*.json' );
			if ( ! is_array( $files ) ) {
				return;
			}

			foreach ( $files as $file ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_unlink -- cleaning temp files
				unlink( $file );
			}
		}

		/**
		 * Check if current IP is rate-limited for failed key attempts.
		 *
		 * @return bool
		 */
		private function is_rate_limited() {
			$ip        = $this->get_client_ip();
			$cache_key = 'cmplz_share_fails_' . md5( $ip );
			$failures  = get_transient( $cache_key );

			return $failures && (int) $failures >= 5;
		}

		/**
		 * Record a failed key attempt for rate limiting.
		 *
		 * @return void
		 */
		private function record_failed_attempt() {
			$ip        = $this->get_client_ip();
			$cache_key = 'cmplz_share_fails_' . md5( $ip );
			$failures  = (int) get_transient( $cache_key );
			set_transient( $cache_key, $failures + 1, HOUR_IN_SECONDS );
		}

		/**
		 * Get client IP address for rate limiting.
		 *
		 * @return string
		 */
		private function get_client_ip() {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
			return sanitize_text_field( wp_unslash( $ip ) );
		}
	}
}
