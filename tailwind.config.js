/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        '120px': '120px',
        '200px': '200px',
        '250px': '250px',
        '370px': '370px',
        '490px': '490px',
        '690px': '690px',
        '810px': '810px',
      },
      minWidth: {
        '120px': '120px',
        '200px': '200px',
        '250px': '250px',
      }
    },
  },
  plugins: [],
}
