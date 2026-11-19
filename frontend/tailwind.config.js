/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cimas: {
          main: "#0B1020",
          sidebar: "#111A2E",
          card: "#17233B",
          elevated: "#1E2C47",
          border: "#263653",
          purple: "#8B5CF6",
          blue: "#3B82F6",
          cyan: "#06B6D4",
          green: "#10B981",
          orange: "#F59E0B",
          red: "#EF4444",
          pink: "#EC4899",
          text: {
            primary: "#F8FAFC",
            secondary: "#94A3B8",
            muted: "#64748B",
          },
        },
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
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
