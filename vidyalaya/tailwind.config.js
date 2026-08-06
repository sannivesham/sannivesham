/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#141B2E',
          light: '#1F2A44',
          soft: '#2C3A5C',
        },
        paper: {
          DEFAULT: '#FAF6EE',
          dim: '#F1EADA',
          line: '#E4D9C0',
        },
        marigold: {
          DEFAULT: '#E3A008',
          light: '#F4C24B',
          dark: '#B87D06',
        },
        sage: {
          DEFAULT: '#5C8374',
          light: '#7FA695',
          dark: '#43665A',
        },
        rust: {
          DEFAULT: '#B23A2E',
          light: '#D25A4C',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 27, 46, 0.06), 0 4px 12px rgba(20, 27, 46, 0.05)',
        lifted: '0 8px 24px rgba(20, 27, 46, 0.12)',
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
}
