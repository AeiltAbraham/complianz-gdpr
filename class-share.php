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
					'methods'             => 'POST',
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
			$params = $request->get_json_params();
			$key    = isset( $params['key'] ) ? sanitize_text_field( $params['key'] ) : '';

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

			$response = wp_remote_post(
				$endpoint,
				array(
					'timeout'   => 30,
					'sslverify' => true,
					'body'      => wp_json_encode( array( 'key' => $key ) ),
					'headers'   => array( 'Content-Type' => 'application/json' ),
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
				$message = isset( $data['message'] ) ? sanitize_text_field( $data['message'] ) : __( 'Unknown error from the remote site.', 'complianz-gdpr' );
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

				// Whitelist: only allow known Complianz field IDs.
				$valid_ids        = $this->get_valid_field_ids();
				$filtered_import  = array();
				foreach ( $data['settings'] as $setting_key => $setting_value ) {
					if ( in_array( $setting_key, $valid_ids, true ) ) {
						$filtered_import[ $setting_key ] = $this->sanitize_setting_value( $setting_value );
					}
				}

				$new_settings = array_merge( $current_settings, $filtered_import );

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
							// Sanitize before setting: save() also sanitizes during DB write,
							// but we sanitize here as defense-in-depth.
							$banner->{$field_name} = $this->sanitize_banner_field( $field_name, $value );
						}
					}
					// save() applies its own field-specific sanitization before writing to DB.
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

			// Protect temp directory from direct access (Apache + Nginx + fallback).
			$htaccess  = trailingslashit( $temp_dir ) . '.htaccess';
			$index_php = trailingslashit( $temp_dir ) . 'index.php';
			if ( ! file_exists( $htaccess ) ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- writing .htaccess in plugin temp dir
				file_put_contents( $htaccess, "deny from all\n" );
			}
			if ( ! file_exists( $index_php ) ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- writing index.php in plugin temp dir
				file_put_contents( $index_php, "<?php\n// Silence is golden.\n" );
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
		 * Clean up all previous share temp files.
		 *
		 * Called before generating a new key to remove stale exports.
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
		 * Uses WordPress core transients (not cmplz_set_transient) intentionally:
		 * per-IP keys would bloat the single cmplz_transients option array.
		 * Core transients auto-expire via the DB and are per-key.
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

		/**
		 * Get all valid Complianz field IDs for import whitelisting.
		 *
		 * @return array List of valid field ID strings.
		 */
		private function get_valid_field_ids() {
			$fields = cmplz_fields( false );
			return array_column( $fields, 'id' );
		}

		/**
		 * Sanitize an imported setting value.
		 *
		 * @param mixed $value The value to sanitize.
		 *
		 * @return mixed Sanitized value.
		 */
		private function sanitize_setting_value( $value ) {
			if ( is_string( $value ) ) {
				return sanitize_text_field( $value );
			}
			if ( is_array( $value ) ) {
				return array_map( array( $this, 'sanitize_setting_value' ), $value );
			}
			if ( is_bool( $value ) || is_int( $value ) || is_float( $value ) ) {
				return $value;
			}
			return '';
		}

		/**
		 * Sanitize a banner field value before setting it on the model.
		 *
		 * Defense-in-depth: the banner save() method applies its own sanitization,
		 * but we sanitize here too so unsanitized values never sit in memory.
		 *
		 * @param string $field_name Banner property name.
		 * @param mixed  $value      Value to sanitize.
		 *
		 * @return mixed Sanitized value.
		 */
		private function sanitize_banner_field( $field_name, $value ) {
			// HTML fields that support limited markup.
			$html_fields = array( 'message_optin', 'message_optout', 'message_optin_x', 'message_optout_x', 'custom_css' );
			if ( in_array( $field_name, $html_fields, true ) ) {
				if ( 'custom_css' === $field_name ) {
					return wp_strip_all_tags( $value );
				}
				return wp_kses_post( $value );
			}

			// Array fields (color palettes, border radius, etc.).
			if ( is_array( $value ) ) {
				// Serialized text+checkbox arrays (e.g., header, dismiss).
				if ( isset( $value['text'] ) ) {
					$value['text'] = sanitize_text_field( $value['text'] );
					$value['show'] = isset( $value['show'] ) ? (int) $value['show'] : 0;
					return $value;
				}
				return array_map( 'sanitize_text_field', $value );
			}

			// Numeric fields.
			if ( is_int( $value ) || is_float( $value ) || is_bool( $value ) ) {
				return $value;
			}

			// Default: plain text sanitization.
			return sanitize_text_field( $value );
		}
	}
}
