/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#141414',
          muted: '#525252',
          faint: '#a3a3a3',
        },
        surface: {
          DEFAULT: '#faf9f7',
          raised: '#ffffff',
          sunken: '#f0eeea',
        },
        accent: {
          DEFAULT: '#0f766e',
          light: '#14b8a6',
          muted: '#ccfbf1',
          dark: '#115e59',
        },
        line: '#e7e5e4',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20, 20, 20, 0.04), 0 8px 24px rgba(20, 20, 20, 0.06)',
        card: '0 0 0 1px rgba(20, 20, 20, 0.06), 0 4px 16px rgba(20, 20, 20, 0.04)',
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '14px',
        xl: '18px',
      },
    },
  },
  plugins: [],
};
