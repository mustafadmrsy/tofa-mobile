/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#007bff",
        secondary: "#6c757d",
        background: "#f8f9fa",
        card: "#ffffff",
        textPrimary: "#212529",
        textSecondary: "#6c757d",
        success: "#28a745",
        danger: "#dc3545",
      },
    },
  },
  plugins: [],
};
