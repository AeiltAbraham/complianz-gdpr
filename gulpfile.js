const gulp = require('gulp');
const concat = require('gulp-concat');
const cssbeautify = require('gulp-cssbeautify');
const cssuglify = require('gulp-uglifycss');
const jsuglify = require('gulp-uglify');
const sass = require('gulp-sass')(require('sass'));
const spawn = require('child_process').spawn;

/**
 * Watches for changes in specific JavaScript and SCSS files and triggers the corresponding build tasks.
 * Also starts an npm process in the 'settings' directory.
 *
 */
function defaultTask(cb) {
	gulp.watch('./assets/css/document.scss', { ignoreInitial: false }, buildCssDocument);
	// Watch for changes in 'document-grid.scss' and run 'buildCssDocumentGrid' task
	gulp.watch('./assets/css/document-grid.scss', { ignoreInitial: false }, buildCssDocumentGrid);
	// Watch for changes in 'premium.scss' and run 'buildCssPremium' task
	gulp.watch('./assets/css/premium.scss', { ignoreInitial: false }, buildCssPremium);
	// Watch for changes in 'cookieblocker.scss' and run 'buildCssCookieblocker' task
	gulp.watch('./assets/css/cookieblocker.scss', { ignoreInitial: false }, buildCssCookieblocker);
	// Watch for changes in JavaScript files in the 'cookiebanner/js' directory and run 'buildJsCookiebanner' task
	gulp.watch('./cookiebanner/js/complianz.js', { ignoreInitial: false }, buildJsCookiebanner);
	// Watch for changes in 'document.scss' and run 'buildCssDocument' task
	// Start an npm process in the 'settings' directory
	// spawn('npm', ['start'], { cwd: 'settings', stdio: 'inherit' });
	// Signal completion
	cb();
}
exports.default = defaultTask

/**
 * Builds the Cookiebanner JavaScript files by concatenating and minifying them.
 *
 */
function buildJsCookiebanner() {
	return gulp.src('cookiebanner/js/complianz.js')
		.pipe(concat('complianz.min.js'))
		.pipe(jsuglify())
		.pipe(gulp.dest('./cookiebanner/js')); // Final output for minified version
}
exports['build:js:cookiebanner'] = buildJsCookiebanner;

/**
 * Builds all JavaScript files by running the specified tasks in series.
 *
 */
function buildJsAll(cb) {
	return gulp.series(
		buildJsCookiebanner
	)(cb);
}
exports['build:js:all'] = buildJsAll;

/**
 * Builds all CSS files by running the specified tasks in series.
 *
 */
function buildCssAll(cb) {
	return gulp.series(
		buildCssDocument,
		buildCssDocumentGrid,
		buildCssPremium,
		buildCssCookieblocker,
	)(cb);
}
exports['build:css:all'] = buildCssAll;

/**
 * Builds the Document CSS by compiling SCSS to CSS, beautifying, minifying.
 *
 */
function buildCssDocument() {
	return 	gulp.src('./assets/css/document.scss')
		.pipe(sass(({outputStyle: 'expanded'})).on('error', sass.logError))
		.pipe(cssbeautify()) // Beautify the CSS
		.pipe(gulp.dest('./assets/css'))
		.pipe(cssuglify()) // Minify the CSS
		.pipe(concat('document.min.css'))
		.pipe(gulp.dest('./assets/css'));
}
exports['build:css:document'] = buildCssDocument;

/**
 * Builds the DocumentGrid CSS by compiling SCSS to CSS, beautifying, minifying.
 *
 */
function buildCssDocumentGrid() {
	return 	gulp.src('./assets/css/document-grid.scss')
		.pipe(sass(({outputStyle: 'expanded'})).on('error', sass.logError))
		.pipe(cssbeautify()) // Beautify the CSS
		.pipe(gulp.dest('./assets/css'))
		.pipe(cssuglify()) // Minify the CSS
		.pipe(concat('document-grid.min.css'))
		.pipe(gulp.dest('./assets/css'));
}
exports['build:css:document-grid'] = buildCssDocumentGrid;

/**
 * Builds the slim premium block CSS by compiling SCSS to CSS, beautifying, minifying.
 *
 * Bundle D retired the full legacy admin CSS target (buildCssAdmin / buildCssAdminRtlExpanded). What
 * remains is assets/css/premium.scss — the three #complianz-scoped premium `cmplz_blocks` module styles
 * (bullets / new-features / other-plugins), compiled to assets/css/premium.css + premium.min.css and
 * enqueued under the `complianz-premium` handle (class-admin.php). No RTL variant is emitted: the three
 * modules carry no directional properties, so an rtlcss pass is a no-op (unlike the former admin.css,
 * whose layout had many directional props).
 */
function buildCssPremium() {
	return 	gulp.src('./assets/css/premium.scss')
		.pipe(sass(({outputStyle: 'expanded'})).on('error', sass.logError))
		.pipe(cssbeautify()) // Beautify the CSS
		.pipe(gulp.dest('./assets/css'))
		.pipe(cssuglify()) // Minify the CSS
		.pipe(concat('premium.min.css'))
		.pipe(gulp.dest('./assets/css'));
}
exports['build:css:premium'] = buildCssPremium;

/**
 * Builds the Cookieblocker CSS by compiling SCSS to CSS, beautifying, minifying.
 *
 */
function buildCssCookieblocker() {

	return 	gulp.src('./assets/css/cookieblocker.scss')
		.pipe(sass(({outputStyle: 'expanded'})).on('error', sass.logError))
		.pipe(cssbeautify()) // Beautify the CSS
		.pipe(gulp.dest('./assets/css'))
		.pipe(cssuglify()) // Minify the CSS
		.pipe(concat('cookieblocker.min.css'))
		.pipe(gulp.dest('./assets/css'));
}
exports['build:css:cookieblocker'] = buildCssCookieblocker;