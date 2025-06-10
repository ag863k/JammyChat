/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'gradient-start': '#ff5f6d', 
        'gradient-end': '#ffc371',   
      },
    },
  },
  plugins: [],
};
