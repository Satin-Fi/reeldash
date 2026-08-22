import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: "#F7F8FA",
          dark: "#0B0C0E",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#111316",
        },
        surfaceSecondary: {
          light: "#F1F3F5",
          dark: "#17191D",
        },
        borderSubtle: {
          light: "#E6E8EC",
          dark: "#25282D",
        },
        primaryText: {
          light: "#17181A",
          dark: "#F5F5F5",
        },
        secondaryText: {
          light: "#6B7280",
          dark: "#9CA3AF",
        },
        mutedText: {
          light: "#9CA3AF",
          dark: "#6B7280",
        },
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
      },
      borderRadius: {
        "rd-sm": "6px",
        "rd-md": "10px",
        "rd-lg": "14px",
        "rd-card": "18px",
      },
      boxShadow: {
        "rd-subtle": "0 2px 10px rgba(0, 0, 0, 0.03)",
        "rd-card": "0 4px 20px rgba(0, 0, 0, 0.05)",
        "rd-modal": "0 20px 40px rgba(0, 0, 0, 0.12)",
      },
      aspectRatio: {
        "reel": "9/16",
      },
    },
  },
  plugins: [],
};
export default config;
