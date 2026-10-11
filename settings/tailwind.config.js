module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  prefix: 'tw-',
  important: ':is(#complianz, #complianz-portal)',
  corePlugins: { preflight: false },
  theme: {
    // DB-08 breakpoints: the single source for the shell's responsive variants (ADR-014).
    // Breakpoints cannot live in tokens.css (CSS custom properties are invalid in @media
    // conditions); the named scale preserves the breakpoint the content grid depends on
    // (the legacy `s` = 1080px). shell.md §5.
    screens: {
      sm: '768px',
      md: '1080px',
      lg: '1280px',
      xl: '1440px',
    },
  },
};
