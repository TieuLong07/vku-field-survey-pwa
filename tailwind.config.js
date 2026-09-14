/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vku: {
          blue: '#0054A6',
          darkBlue: '#003366',
          orange: '#F37021',
          gold: '#FFB81C',
          lightBg: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}
