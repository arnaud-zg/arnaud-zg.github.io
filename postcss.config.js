const purgeCss = [
  '@fullhuman/postcss-purgecss',
  {
    content: ['./pages/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
    defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
  },
];

module.exports = {
  plugins: [
    'tailwindcss',
    ...(process.env.NODE_ENV === 'production' ? [purgeCss] : []),
    'postcss-preset-env',
  ],
};
