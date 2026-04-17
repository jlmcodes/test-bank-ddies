/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- This tells it to only use our app's toggle button!
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}