/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zen: {
          50: 'var(--zen-50)',
          100: 'var(--zen-100)',
          200: 'var(--zen-200)',
          300: 'var(--zen-300)',
          400: 'var(--zen-400)',
          500: 'var(--zen-500)',
          600: 'var(--zen-600)',
          700: 'var(--zen-700)',
          800: 'var(--zen-800)',
          900: 'var(--zen-900)',
        },
        matcha: {
          50: 'rgba(34, 211, 238, 0.06)',
          100: 'rgba(34, 211, 238, 0.15)',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        glow: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      keyframes: {
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        auroraShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-slide-in': 'fadeSlideIn 200ms ease-out',
        'aurora': 'auroraShift 20s ease infinite',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
