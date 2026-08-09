/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',    // Intense Orange
        secondary: '#1A1A24',  // Deep Dark
        accent: '#FFB800',     // Golden Amber
        dark: {
          900: '#0F0F13',
          800: '#18181E',
          700: '#23232A',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.03)',
          medium: 'rgba(255, 255, 255, 0.05)',
          heavy: 'rgba(255, 255, 255, 0.08)',
        }
      },
      animation: {
        'glow': 'glow 4s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255, 107, 53, 0.2)' },
          '100%': { boxShadow: '0 0 40px rgba(255, 184, 0, 0.4)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      },
    },
  },
  plugins: [],
}
