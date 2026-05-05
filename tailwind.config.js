/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dce6ff',
          200: '#b9cdff',
          300: '#84a8ff',
          400: '#4d7aff',
          500: '#1a4dff',
          600: '#0030e6',
          700: '#0026b8',
          800: '#001f96',
          900: '#001478',
          950: '#000d4f',
        },
        surface: {
          0: '#ffffff',
          50: '#f8f9fc',
          100: '#f0f2f8',
          200: '#e4e7f0',
          300: '#cdd2e0',
          400: '#a0a8be',
          500: '#717899',
          600: '#505670',
          700: '#3a3f54',
          800: '#272b3c',
          900: '#161827',
          950: '#0d0f1c',
        },
        positive: '#0ab86e',
        negative: '#e63946',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
