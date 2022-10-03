/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "neutral-medium": "#1e1e1e",
        "neutral-dark": "#0f1318",
      },
      backgroundImage: {
        "connect-animation": "url('/connect-animation.gif')",
      },
    },
  },
  plugins: [],
};
