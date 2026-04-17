/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#1A56DB',
          600: '#1E40AF',
          700: '#1E3A8A',
        },
        success: { DEFAULT: '#059669', light: '#ECFDF5' },
        danger: { DEFAULT: '#DC2626', light: '#FEF2F2' },
        warning: { DEFAULT: '#D97706', light: '#FFFBEB' },
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
}