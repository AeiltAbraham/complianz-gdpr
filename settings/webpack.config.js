const path = require('path');
const defaultConfig = require("@wordpress/scripts/config/webpack.config");

const reactJSXRuntimePolyfill = {
	entry: {
		'react-jsx-runtime': {
			import: 'react/jsx-runtime',
		},
	},
	output: {
		path: path.resolve(__dirname, 'assets/js'),
		filename: 'react-jsx-runtime.js',
		library: {
			name: 'ReactJSXRuntime',
			type: 'window',
		},
	},
	externals: {
		react: 'React',
	},
};

module.exports = [
	{
		...defaultConfig,
		output: {
			...defaultConfig.output,
			filename: '[name].[contenthash].js',
			chunkFilename: '[name].[contenthash].js',
		},
		// FR-017: ship ONE stylesheet. @wordpress/scripts extracts a separate CSS file per async
		// (dynamic-import) chunk — the 74 tracked settings/build/*.css files. This cacheGroup merges
		// every MiniCssExtractPlugin module into the `index` entry chunk, so all component CSS
		// (base/tokens/components/page/tailwind + the react-color ColorPicker + the vendor sheets)
		// ships inside build/index.css and no code-split *.css chunk files are emitted. JS code
		// splitting is unaffected (this targets only `css/mini-extract` modules).
		optimization: {
			...defaultConfig.optimization,
			splitChunks: {
				...defaultConfig.optimization.splitChunks,
				cacheGroups: {
					...( defaultConfig.optimization.splitChunks && defaultConfig.optimization.splitChunks.cacheGroups ),
					style: {
						type: 'css/mini-extract',
						name: 'index',
						chunks: 'all',
						enforce: true,
					},
				},
			},
		},
		resolve: {
			...defaultConfig.resolve,
			fallback: {
				"path": require.resolve("path-browserify"),
			},
		},
		module: {
			...defaultConfig.module,
			rules: [
				...defaultConfig.module.rules,
				{
					test: /\.node$/,
					loader: 'node-loader',
				},
			],
		},
	},
	reactJSXRuntimePolyfill
];
