/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f4f9",
          100: "#dbe5f0",
          200: "#b9cee3",
          300: "#8bb1d2",
          400: "#5c91be",
          500: "#3d76aa",
          600: "#2d5e8d",
          700: "#244b72",
          800: "#1a365d",
          900: "#0f2338",
          950: "#081422",
        },
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
    },
  },
  plugins: [],
};
