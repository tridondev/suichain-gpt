/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts}",  // Include all JS and TS files in the src folder
  ],
  theme: {
    extend: {
      // You can add custom colors, fonts, spacing here if needed
    },
  },
  plugins: [],
  base: "suichain-gpt"

};
