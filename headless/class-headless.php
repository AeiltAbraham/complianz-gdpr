<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
defined( 'ABSPATH' ) || die( 'you do not have access to this page!' );

/**
 * Headless / cross-domain delivery — hub & spoke.
 *
 * The same plugin can play two roles, both off by default (a normal install is unchanged):
 *
 *   HUB (server)   — "Serve consent to other domains".
 *                    Exposes complianz/v1/embed/ + /cmplz-embed.js so any site can render
 *                    this install's banner via one <script> tag. Reuses Complianz's own JS/CSS.
 *                    (The appliance enables this automatically.)
 *
 *   SPOKE (client) — "Get consent from a hub".
 *                    Point a root WordPress site at a hub URL; it suppresses its own banner
 *                    and pulls the hub's banner/consent in — a one-field setup. Ideal when the
 *                    appliance runs on a subdomain and the root domain is also WordPress.
 *
 * Settings live in the dedicated `cmplz_headless_settings` option (kept out of the
 * React-managed cmplz_options), managed by the admin page below. Additive, no core files touched.
 */
class CMPLZ_HEADLESS {

	const OPTION = 'cmplz_headless_settings';

	public function __construct() {
		// Admin page is always available (it's how you turn the modes on).
		add_action( 'admin_menu', array( $this, 'register_admin_page' ), 60 );
		add_action( 'admin_post_cmplz_headless_save', array( $this, 'save_settings' ) );

		$s = $this->settings();

		// --- HUB (server) mode ---
		if ( $s['server_enabled'] ) {
			add_action( 'rest_api_init', array( $this, 'register_routes' ) );
			add_action( 'init', array( $this, 'maybe_serve_embed_js' ), 1 );
			add_action( 'cmplz_store_consent', array( $this, 'record_consent_origin' ), 10, 3 );
		}

		// --- SPOKE (client) mode: pull from a hub ---
		if ( $s['hub_url'] ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_hub_embed' ), PHP_INT_MAX );
		}

		// Suppress this install's own banner (a hub has no real visitors; a spoke uses the hub's banner).
		if ( $s['suppress_banner'] || $s['hub_url'] ) {
			add_filter( 'cmplz_banner_html', '__return_empty_string', 100 );
			add_filter( 'cmplz_manage_consent_html', '__return_empty_string', 100 );
			add_action( 'wp_enqueue_scripts', array( $this, 'dequeue_local_banner' ), PHP_INT_MAX );
		}
	}

	/**
	 * @return array{server_enabled:int,suppress_banner:int,allowed_origins:string,hub_url:string}
	 */
	public function settings() {
		$defaults = array(
			'server_enabled'  => 0,
			'suppress_banner' => 0,
			'allowed_origins' => '',
			'hub_url'         => '',
		);
		$stored = get_option( self::OPTION, array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}
		$s                   = wp_parse_args( $stored, $defaults );
		$s['server_enabled'] = (int) $s['server_enabled'];
		$s['suppress_banner'] = (int) $s['suppress_banner'];
		$s['allowed_origins'] = (string) $s['allowed_origins'];
		$s['hub_url']         = $s['hub_url'] ? esc_url_raw( $s['hub_url'] ) : '';
		return $s;
	}

	/* ===================== HUB (server) ===================== */

	public function register_routes() {
		register_rest_route(
			'complianz/v1',
			'embed/',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'rest_embed_payload' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/** Only allow the configured origins (empty = any). */
	private function origin_allowed() {
		$allowed = trim( $this->settings()['allowed_origins'] );
		if ( '' === $allowed ) {
			return true;
		}
		$list   = array_filter( array_map( 'trim', explode( ',', strtolower( $allowed ) ) ) );
		$origin = get_http_origin();
		$source = $origin ? $origin : ( $_SERVER['HTTP_REFERER'] ?? '' );
		$host   = $source ? strtolower( (string) wp_parse_url( $source, PHP_URL_HOST ) ) : '';
		return $host && in_array( $host, $list, true );
	}

	public function rest_embed_payload( $request ) {
		if ( ! $this->origin_allowed() ) {
			return new WP_Error( 'cmplz_origin_forbidden', 'This origin is not allowed to embed.', array( 'status' => 403 ) );
		}
		$site_id = sanitize_text_field( (string) $request->get_param( 'site_id' ) );
		$this->ledger_touch( $this->request_host(), 'embeds', null, $site_id );

		$banner_id    = cmplz_get_default_banner_id();
		$banner       = cmplz_get_cookiebanner( $banner_id );
		$consent_type = COMPLIANZ::$company->get_default_consenttype();
		$minified     = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

		$config = $banner->get_front_end_settings();
		// Cookie should be first-party on the embedding (root) domain, not this appliance's domain.
		if ( isset( $config['cookie_domain'] ) ) {
			$config['cookie_domain'] = '';
		}

		$css_file = cmplz_upload_dir( 'css' ) . "banner-{$banner_id}-{$consent_type}.css";
		$payload  = array(
			'version'     => CMPLZ_VERSION . '.' . ( file_exists( $css_file ) ? filemtime( $css_file ) : 0 ),
			'config'      => $config,
			'banner_html' => $this->get_banner_html( $banner, $consent_type ),
			'css'         => array( cmplz_upload_url( 'css' ) . "banner-{$banner_id}-{$consent_type}.css" ),
			'js'          => CMPLZ_URL . "cookiebanner/js/complianz{$minified}.js",
			'origin'      => get_rest_url( null, 'complianz/v1/' ),
		);
		if ( ob_get_length() ) {
			ob_clean();
		}
		// Cacheable at the edge/CDN: config changes rarely and is versioned above.
		$response = new WP_REST_Response( $payload );
		$response->header( 'Cache-Control', 'public, max-age=300, stale-while-revalidate=86400' );
		return $response;
	}

	/** Reproduce the on-site banner markup (mirrors banner_loader->cookiebanner_html()). */
	private function get_banner_html( $banner, $consent_type ) {
		$path       = trailingslashit( CMPLZ_PATH ) . 'cookiebanner/templates/';
		$banner_tpl = cmplz_get_template( 'cookiebanner.php', array( 'consent_type' => $consent_type ), $path );
		$manage_tpl = cmplz_get_template( 'manage-consent.php', false, $path );
		$settings   = $banner->get_html_settings();
		foreach ( $settings as $field => $value ) {
			if ( isset( $value['text'] ) ) {
				$value = $value['text'];
			}
			if ( is_array( $value ) ) {
				continue;
			}
			if ( 'logo' !== $field ) {
				$value = nl2br( $value );
			}
			$banner_tpl = str_replace( '{' . $field . '}', $value, $banner_tpl );
			$manage_tpl = str_replace( '{' . $field . '}', $value, $manage_tpl );
		}
		$manage_tpl = str_replace( '{consent_type}', $consent_type, $manage_tpl );
		// Build the embed markup directly — independent of the local "suppress own banner"
		// filters, which only govern whether THIS site shows its own banner.
		return '<div id="cmplz-cookiebanner-container">' . $banner_tpl . '</div>'
			. '<div id="cmplz-manage-consent" data-nosnippet="true">' . $manage_tpl . '</div>';
	}

	/** Serve the loader at /cmplz-embed.js (no rewrite rules needed). */
	public function maybe_serve_embed_js() {
		$uri = strtok( $_SERVER['REQUEST_URI'] ?? '', '?' );
		if ( '/cmplz-embed.js' !== substr( $uri, -15 ) ) {
			return;
		}
		header( 'Content-Type: application/javascript; charset=utf-8' );
		header( 'Access-Control-Allow-Origin: *' );
		if ( ! $this->origin_allowed() ) {
			header( 'Cache-Control: no-store' );
			echo '/* Complianz: this origin is not allowed to embed. */';
			exit;
		}
		header( 'Cache-Control: public, max-age=3600' );
		echo $this->get_loader_js( get_rest_url( null, 'complianz/v1/embed/' ) ); // phpcs:ignore
		exit;
	}

	private function get_loader_js( $endpoint ) {
		$endpoint  = esc_url_raw( $endpoint );
		$reset_css = wp_json_encode( $this->get_embed_reset_css(), JSON_UNESCAPED_SLASHES );
		return <<<JS
/* Complianz embed loader */
(function () {
	if (window.__cmplzEmbedLoaded) { return; }
	window.__cmplzEmbedLoaded = true;
	var self = document.currentScript;
	var siteId = self ? self.getAttribute("data-site-id") : null;
	var url = "$endpoint" + (siteId ? "?site_id=" + encodeURIComponent(siteId) : "");
	function start() {
		fetch(url).then(function (r) { return r.json(); }).then(function (d) {
			if (!d || !d.config) { return; }
			window.complianz = d.config;
			(d.css || []).forEach(function (href) {
				var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href;
				document.head.appendChild(l);
			});
			// Shield the banner from the host page's CSS (loaded last so it wins on source order).
			var st = document.createElement("style"); st.id = "cmplz-embed-reset"; st.textContent = $reset_css;
			document.head.appendChild(st);
			var wrap = document.createElement("div"); wrap.innerHTML = d.banner_html;
			while (wrap.firstChild) { document.body.appendChild(wrap.firstChild); }
			var s = document.createElement("script"); s.src = d.js; s.defer = true;
			document.body.appendChild(s);
		}).catch(function (e) { if (window.console) { console.error("Complianz embed failed:", e); } });
	}
	if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); } else { start(); }
})();
JS;
	}

	/**
	 * Defensive CSS for cross-domain embedding, scoped strictly to the banner.
	 *
	 * The banner stylesheet assumes a WordPress page: a theme baseline for
	 * typography and WP core utility classes (e.g. .screen-reader-text). A
	 * non-WordPress host has neither, so its own body font and box model leak
	 * into the banner — the category switches are drawn with pseudo-elements
	 * pinned to a ~20px line box, so an inherited line-height shoves the knob
	 * out of alignment, and the screen-reader-only category names render as
	 * visible text. Pin only the few properties the layout depends on.
	 *
	 * Two utility classes the banner's own JS relies on also live outside the
	 * per-banner stylesheet and so are undefined off-WordPress:
	 *   - .screen-reader-text — keeps SR-only category labels visually hidden;
	 *   - .cmplz-hidden — the JS hides every document link, then un-hides only
	 *     the ones present in page_links. Defining it here makes that resolution
	 *     dynamic: a Cookie/Privacy/Impressum doc that is premium-gated, opted
	 *     out, or simply not created stays hidden instead of leaking "{title}".
	 */
	private function get_embed_reset_css() {
		return <<<CSS
.cmplz-cookiebanner,.cmplz-cookiebanner *,#cmplz-manage-consent,#cmplz-manage-consent *{box-sizing:border-box}
.cmplz-cookiebanner,#cmplz-manage-consent .cmplz-manage-consent{font-size:14px;line-height:1.5}
.cmplz-cookiebanner .cmplz-banner-checkbox .cmplz-label{font-size:12px;line-height:20px}
.cmplz-cookiebanner .cmplz-hidden,#cmplz-manage-consent .cmplz-hidden{display:none!important}
.cmplz-cookiebanner .screen-reader-text,#cmplz-manage-consent .screen-reader-text{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
CSS;
	}

	public function record_consent_origin( $categories, $services, $consenttype ) {
		$cats = is_array( $categories ) ? array_map( 'sanitize_key', $categories ) : array();
		$this->ledger_touch( $this->request_host(), 'consents', $cats );
	}

	/** Host of the embedding site, from Origin (or Referer fallback). */
	private function request_host() {
		$origin = get_http_origin();
		$source = $origin ? $origin : ( $_SERVER['HTTP_REFERER'] ?? '' );
		$host   = $source ? (string) wp_parse_url( $source, PHP_URL_HOST ) : '';
		return strtolower( $host );
	}

	/**
	 * Per-domain consent ledger: embeds served + consents recorded + category tallies + site_id.
	 * Stored in an option for simplicity (bounded); for high volume, switch to a custom table.
	 */
	private function ledger_touch( $host, $field, $cats = null, $site_id = '' ) {
		if ( ! $host ) {
			return;
		}
		$ledger = get_option( 'cmplz_consent_ledger', array() );
		if ( ! is_array( $ledger ) ) {
			$ledger = array();
		}
		if ( ! isset( $ledger[ $host ] ) ) {
			if ( count( $ledger ) >= 1000 ) {
				return; // bound the option size; production: custom table.
			}
			$ledger[ $host ] = array( 'site_id' => '', 'embeds' => 0, 'consents' => 0, 'last' => 0, 'cats' => array() );
		}
		if ( '' !== $site_id ) {
			$ledger[ $host ]['site_id'] = $site_id;
		}
		if ( $field && isset( $ledger[ $host ][ $field ] ) ) {
			$ledger[ $host ][ $field ] = (int) $ledger[ $host ][ $field ] + 1;
		}
		$ledger[ $host ]['last'] = time();
		if ( is_array( $cats ) ) {
			foreach ( $cats as $c ) {
				$ledger[ $host ]['cats'][ $c ] = (int) ( $ledger[ $host ]['cats'][ $c ] ?? 0 ) + 1;
			}
		}
		update_option( 'cmplz_consent_ledger', $ledger, false );
	}

	/* ===================== SPOKE (client) ===================== */

	/** Load the hub's banner on this site via its embed loader. */
	public function enqueue_hub_embed() {
		$hub = $this->settings()['hub_url'];
		if ( ! $hub ) {
			return;
		}
		wp_enqueue_script( 'cmplz-hub-embed', trailingslashit( $hub ) . 'cmplz-embed.js', array(), null, true );
	}

	/** Remove this install's own banner script so only the hub's banner shows. */
	public function dequeue_local_banner() {
		wp_dequeue_script( 'cmplz-cookiebanner' );
	}

	/* ===================== Admin ===================== */

	public function register_admin_page() {
		if ( ! function_exists( 'cmplz_user_can_manage' ) || ! cmplz_user_can_manage() ) {
			return;
		}
		add_submenu_page(
			'complianz',
			__( 'Headless / Hub', 'complianz-gdpr' ),
			__( 'Headless / Hub', 'complianz-gdpr' ),
			'manage_privacy',
			'complianz-headless',
			array( $this, 'render_admin_page' )
		);
	}

	public function save_settings() {
		if ( ! cmplz_user_can_manage() || ! check_admin_referer( 'cmplz_headless_save' ) ) {
			wp_die( 'Not allowed' );
		}
		$value = array(
			'server_enabled'  => isset( $_POST['server_enabled'] ) ? 1 : 0,
			'suppress_banner' => isset( $_POST['suppress_banner'] ) ? 1 : 0,
			'allowed_origins' => isset( $_POST['allowed_origins'] ) ? sanitize_text_field( wp_unslash( $_POST['allowed_origins'] ) ) : '',
			'hub_url'         => isset( $_POST['hub_url'] ) ? esc_url_raw( wp_unslash( $_POST['hub_url'] ) ) : '',
		);
		update_option( self::OPTION, $value );
		wp_safe_redirect( add_query_arg( array( 'page' => 'complianz-headless', 'updated' => 1 ), admin_url( 'admin.php' ) ) );
		exit;
	}

	public function render_admin_page() {
		$s       = $this->settings();
		$snippet = '<script src="' . esc_url( home_url( '/cmplz-embed.js' ) ) . '" async></script>';
		$ledger  = get_option( 'cmplz_consent_ledger', array() );
		$cb      = function ( $name, $on ) {
			return '<label style="display:block;margin:8px 0"><input type="checkbox" name="' . esc_attr( $name ) . '" value="1" ' . checked( $on, 1, false ) . '> ';
		};
		echo '<div class="wrap"><h1>' . esc_html__( 'Headless / Hub', 'complianz-gdpr' ) . '</h1>';
		if ( isset( $_GET['updated'] ) ) {
			echo '<div class="notice notice-success is-dismissible"><p>Saved.</p></div>';
		}
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="max-width:680px">';
		echo '<input type="hidden" name="action" value="cmplz_headless_save">';
		wp_nonce_field( 'cmplz_headless_save' );

		echo '<h2>Serve consent to other domains (hub)</h2>';
		echo $cb( 'server_enabled', $s['server_enabled'] ) . 'Enable — expose the embed endpoint &amp; <code>/cmplz-embed.js</code></label>';
		echo $cb( 'suppress_banner', $s['suppress_banner'] ) . 'Don\'t show the banner on this site itself (it\'s a hub)</label>';
		echo '<p><label>Allowed origins (comma-separated hostnames, blank = any)</label><br>';
		echo '<input type="text" name="allowed_origins" value="' . esc_attr( $s['allowed_origins'] ) . '" class="regular-text" placeholder="example.com, shop.example.com" style="width:100%"></p>';
		if ( $s['server_enabled'] ) {
			echo '<p><strong>Embed snippet</strong> — add this one line to any site:</p>';
			echo '<textarea readonly rows="2" style="width:100%;font-family:monospace;padding:10px;border-radius:8px" onclick="this.select()">' . esc_textarea( $snippet ) . '</textarea>';
			echo '<p class="description">Optionally add <code>data-site-id="your-label"</code> to the tag to identify each embedding site in the ledger below.</p>';
		}

		echo '<hr style="margin:24px 0"><h2>Get consent from a hub (this is a root site)</h2>';
		echo '<p>Point this WordPress site at your Complianz hub. It will hide its own banner and use the hub\'s — a one-field setup.</p>';
		echo '<p><label>Hub URL</label><br><input type="url" name="hub_url" value="' . esc_attr( $s['hub_url'] ) . '" class="regular-text" placeholder="https://consent.example.com" style="width:100%"></p>';

		echo '<p style="margin-top:20px"><button class="button button-primary">Save changes</button></p>';
		echo '</form>';

		if ( $s['server_enabled'] && is_array( $ledger ) && $ledger ) {
			echo '<h2>Consent ledger</h2><table class="widefat striped" style="max-width:900px"><thead><tr><th>Domain</th><th>Site ID</th><th>Embeds</th><th>Consents</th><th>Categories</th><th>Last</th></tr></thead><tbody>';
			foreach ( $ledger as $host => $row ) {
				$cats = array();
				foreach ( (array) ( $row['cats'] ?? array() ) as $c => $n ) {
					$cats[] = esc_html( $c . ' (' . (int) $n . ')' );
				}
				echo '<tr><td><code>' . esc_html( $host ) . '</code></td>'
					. '<td>' . esc_html( (string) ( $row['site_id'] ?? '' ) ) . '</td>'
					. '<td>' . (int) ( $row['embeds'] ?? 0 ) . '</td>'
					. '<td>' . (int) ( $row['consents'] ?? 0 ) . '</td>'
					. '<td>' . implode( ', ', $cats ) . '</td>'
					. '<td>' . esc_html( ( $row['last'] ?? 0 ) ? human_time_diff( (int) $row['last'] ) . ' ago' : '—' ) . '</td></tr>';
			}
			echo '</tbody></table>';
		}
		echo '</div>';
	}
}

new CMPLZ_HEADLESS();
