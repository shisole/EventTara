import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.ts",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#0891b2",
          600: "#0e7490",
          700: "#155e75",
          800: "#164e63",
          900: "#134e4a",
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
        cursive: ["var(--font-cursive)", "cursive"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        logoPulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.95)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        borderPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        hueShift: {
          "0%": { filter: "hue-rotate(0deg)" },
          "100%": { filter: "hue-rotate(360deg)" },
        },
        navProgress: {
          "0%": { transform: "scaleX(0)" },
          "20%": { transform: "scaleX(0.4)" },
          "60%": { transform: "scaleX(0.7)" },
          "100%": { transform: "scaleX(0.9)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out forwards",
        "fade-in": "fadeIn 0.2s ease-out forwards",
        "logo-pulse": "logoPulse 1.2s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "border-pulse": "borderPulse 2s ease-in-out infinite",
        "spin-slow": "spinSlow 6s linear infinite",
        float: "float 3s ease-in-out infinite",
        "hue-shift": "hueShift 4s linear infinite",
        "nav-progress": "navProgress 2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
    },
  },
  plugins: [typography],
};

export default config;
