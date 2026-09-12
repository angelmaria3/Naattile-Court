/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        wood: {
          dark: '#2b1a10',   // page background, deepest shadow
          mid: '#4a3018',    // panel/card background
          grain: '#6b4423',  // borders, dividers
        },
        brass: {
          DEFAULT: '#c99a3d',
          light: '#e0b95c',
          dark: '#8a6a28',
        },
        parchment: {
          DEFAULT: '#f1e4c3',
          shadow: '#d8c69f',
        },
        ink: '#2a1c10',
        maroon: '#7a2020',
        leather: '#5c1f1f',
      },
      fontFamily: {
        display: ['Cinzel', 'Noto Serif Malayalam', 'serif'],
        malayalam: ['Noto Serif Malayalam', 'serif'],
        body: ['Noto Sans Malayalam', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 8px 24px rgba(0,0,0,0.5)',
        inset: 'inset 0 2px 6px rgba(0,0,0,0.4)',
      },
      borderRadius: {
        panel: '6px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'fade-in-delay': 'fadeIn 1s ease-out 0.3s forwards',
        'scale-in': 'scaleIn 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};
