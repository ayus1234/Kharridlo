import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        navy: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          700: "#1e293b",
          800: "#131b2e",
          900: "#0f172a",
          950: "#090d16",
        },
        growth: {
          emerald: "#10b981",
          dark: "#006c4a",
          light: "#82f5c1",
          50: "#ecfdf5",
          100: "#d1fae5",
        },
        ai: {
          violet: "#7c3aed",
          deep: "#25005a",
          glow: "#9863ff",
          surface: "#f5f3ff",
        },
      },
      fontFamily: {
        display: ['"Hanken Grotesk"', "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ['"Geist Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
