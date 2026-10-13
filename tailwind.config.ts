import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#050505",
          card: "#111111",
          "sec-bg": "#181818",
          accent: "#7C3AED",
          text: "#FFFFFF",
          "text-sec": "#A1A1AA",
        },
      },
      fontFamily: {
        space: ["var(--font-space)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 10px 40px -12px rgba(124, 58, 237, 0.55)",
      },
      animation: {
        glow: "glow 4s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124, 58, 237, 0.15)" },
          "50%": { boxShadow: "0 0 40px rgba(124, 58, 237, 0.25)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
