/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#F7F4ED',
        surface: '#FFFFFF',
        'text-display': '#1A1814',
        'text-primary': '#1A1814',
        'text-secondary': '#5C5851',
        'text-disabled': '#9E9A92',
        accent: '#2C3E7A',
        'accent-soft': '#E4E8F2',
        success: '#5A7A4F',
        'accent-red': '#B5453A',
        border: '#E8E2D5',
        dark: {
          background: '#14110C',
          surface: '#1B1813',
          'text-display': '#F7F4ED',
          'text-primary': '#F7F4ED',
          'text-secondary': '#A89F8E',
          'text-disabled': '#665E51',
          accent: '#7B8FBF',
          'accent-soft': '#1F2438',
          success: '#7A9A6F',
          'accent-red': '#D5655A',
          border: '#2A251D',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
        display: ['"Instrument Serif"', 'serif'],
      },
      spacing: {
        'tight': '4px',
        'medium': '16px',
        'wide': '32px',
        'vast': '64px',
      },
      borderRadius: {
        'pill': '999px',
        'card': '16px',
      },
    },
  },
  plugins: [],
}
