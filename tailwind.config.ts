import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      colors: {
        bg: {
          dark: "#0B0F17",
          light: "#F8FAFC",
        },
        brand: {
          indigo: "#6366F1",
          violet: "#8B5CF6",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#F43F5E",
        },
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          border: "rgba(255, 255, 255, 0.1)",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)",
        "brand-gradient-radial":
          "radial-gradient(circle at top left, rgba(99,102,241,0.25), transparent 60%)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.45)" },
          "70%": { boxShadow: "0 0 0 12px rgba(16, 185, 129, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
