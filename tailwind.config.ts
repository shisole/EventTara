import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          50: "#fff5f2",
          100: "#ffe8e0",
          200: "#ffd0c2",
          300: "#ffab94",
          400: "#ff7f5c",
          500: "#ff5a2d",
          600: "#e84420",
          700: "#c13416",
          800: "#9c2c15",
          900: "#7e2816",
        },
        forest: {
          50: "#f0faf4",
          100: "#dbf2e3",
          200: "#bae5cb",
          300: "#8bd1a8",
          400: "#56b57d",
          500: "#34995e",
          600: "#247a4a",
          700: "#1e623d",
          800: "#1b4e33",
          900: "#17402b",
        },
        golden: {
          50: "#fffdf0",
          100: "#fff8d4",
          200: "#ffefa8",
          300: "#ffe270",
          400: "#ffd040",
          500: "#f5b800",
          600: "#d49400",
          700: "#a96c00",
          800: "#8a5500",
          900: "#724600",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
