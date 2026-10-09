const tailwindcss = require('tailwindcss');
const wpPreset = require('@wordpress/postcss-plugins-preset'); // ARRAY [postcss-import, autoprefixer] — MUST be spread
const isProd = process.env.NODE_ENV === 'production';
module.exports = {
  plugins: [
    tailwindcss('./tailwind.config.js'),
    ...wpPreset,
    ...(isProd ? [require('cssnano')({ preset: 'default' })] : []),
  ],
};
