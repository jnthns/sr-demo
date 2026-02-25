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
          50: '#faf8f4',
          100: '#f5f0e8',
          200: '#ebe4d6',
          300: '#d9cebb',
          400: '#bfae94',
          500: '#a69578',
          600: '#8a7a60',
          700: '#6b5e48',
          800: '#4a3f30',
          900: '#2d2518',
        },
        matcha: {
          50: '#f4f8f0',
          100: '#e4eddc',
          200: '#c8dbb9',
          300: '#a0c48c',
          400: '#7aad64',
          500: '#5d9648',
          600: '#4a7a39',
          700: '#3d6330',
          800: '#334f2a',
          900: '#2a4024',
        },
      },
      keyframes: {
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-slide-in': 'fadeSlideIn 200ms ease-out',
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
