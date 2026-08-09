/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        // Escala neutra. Se conservan los nombres dark-* para que las
        // clases existentes del admin adopten la nueva paleta sin reescribirlas.
        dark: {
          900: '#0A0A0A',
          800: '#111113',
          700: '#18181B',
        },
      },
      animation: {
        'shimmer': 'shimmer 1.8s linear infinite',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}
