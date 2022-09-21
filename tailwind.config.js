/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#ffb11a",
        },
        secondary: {
          500: "#17181e",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
