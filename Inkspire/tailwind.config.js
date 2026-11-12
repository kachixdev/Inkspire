/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        sage: 'rgb(var(--color-sage) / <alpha-value>)',
        coral: 'rgb(var(--color-coral) / <alpha-value>)',
        mist: 'rgb(var(--color-mist) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['DM Sans', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 50px rgba(35, 48, 78, 0.12)',
      },
    },
  },
  plugins: [],
};
