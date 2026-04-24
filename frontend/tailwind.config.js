/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FFE600",
          blue: "#3483FA",
          dark: "#1A1A2E",
          card: "#16213E",
          border: "#0F3460",
        },
      },
    },
  },
  plugins: [],
};
