/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-cyan': '#1D6F42',
      },
      spacing: {
        '100px': '100px',
        '150px': '150px',
        '200px': '200px',
        '300px': '300px',
        '400px': '400px',
        '550px': '550px',
        '650px': '650px',
      },
      minWidth: {
        '100px': '100px',
        '150px': '150px',
        '200px': '200px',
      }
    },
  },
  plugins: [],
}
