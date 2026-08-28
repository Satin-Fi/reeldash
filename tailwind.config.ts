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
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Fira Code", "monospace"],
      },
      colors: {
        // Core backgrounds — OLED-first dark mode
        background: {
          light: "#F4F5F7",
          dark: "#080A0C",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#0F1114",
        },
        surfaceSecondary: {
          light: "#F0F1F4",
          dark: "#161A1F",
        },
        surfaceTertiary: {
          light: "#E8E9ED",
          dark: "#1C2128",
        },
        borderSubtle: {
          light: "#E2E4E9",
          dark: "#1E2228",
        },
        borderDefault: {
          light: "#D0D3DA",
          dark: "#252B33",
        },
        // Text hierarchy
        primaryText: {
          light: "#111318",
          dark: "#F0F2F5",
        },
        secondaryText: {
          light: "#5A6070",
          dark: "#8B95A4",
        },
        mutedText: {
          light: "#9EA7B4",
          dark: "#4A5568",
        },
        // Brand — Electric Indigo
        brand: {
          50:  "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
      },
      borderRadius: {
        "rd-xs": "4px",
        "rd-sm": "6px",
        "rd-md": "10px",
        "rd-lg": "14px",
        "rd-xl": "18px",
        "rd-2xl": "24px",
        "rd-card": "16px",
        "rd-bezel": "12px",
      },
      boxShadow: {
        "rd-subtle":  "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        "rd-card":    "0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "rd-modal":   "0 24px 48px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.08)",
        "rd-glow":    "0 0 0 1px rgba(99,102,241,0.12), 0 4px 24px rgba(99,102,241,0.08)",
        "rd-dark":    "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)",
        "rd-inner":   "inset 0 1px 0 rgba(255,255,255,0.06)",
        "rd-inset":   "inset 0 2px 4px rgba(0,0,0,0.06)",
      },
      aspectRatio: {
        reel: "9/16",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)",
        "dark-mesh": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.08) 0%, transparent 60%)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.32, 0.72, 0, 1)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
        "500": "500ms",
      },
      keyframes: {
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.6" },
        },
        "border-beam": {
          "100%": {
            "offset-distance": "100%",
          },
        },
      },
      animation: {
        "slide-down": "slide-down 0.25s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        "fade-in":    "fade-in 0.2s ease forwards",
        "shimmer":    "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
      },
    },
  },
  plugins: [],
};

export default config;
