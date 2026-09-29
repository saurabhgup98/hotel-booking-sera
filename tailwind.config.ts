import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Sera Hotels and Resorts palette — deep forest primary, warm sand
      // ground, brass accent. Every page uses these instead of raw
      // slate/indigo so the brand stays consistent.
      colors: {
        sera: {
          ink: "#1C1B18",
          muted: "#5E5A52",
          line: "#E4DDD0",
          sand: "#F6F2EA",
          cream: "#FBF8F2",
          forest: "#1E4A42",
          "forest-dark": "#163831",
          mint: "#E1ECE8",
          brass: "#9A6B24",
          "brass-soft": "#F4EAD8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pop-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "pop-in": "pop-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
