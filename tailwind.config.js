module.exports = {
  purge: ['./pages/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      backgroundImage: () => ({
        hero: "url('../../public/assets/css/images/bg.jpg')",
        'overlay-pattern': "url('../../public/assets/css/images/overlay.svg')",
      }),
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0.1 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
