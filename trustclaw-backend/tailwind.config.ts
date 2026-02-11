import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // TrustClaw brand colors
        trust: {
          green: "#00e87b",
          "green-dark": "#00c96a",
          "green-light": "#33ed95",
        },
        dark: {
          bg: "#06080c",
          card: "#0d1117",
          border: "#1f2937",
          text: "#e5e7eb",
          muted: "#9ca3af",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "trust-gradient": "linear-gradient(135deg, #00e87b 0%, #00c96a 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px #00e87b, 0 0 10px #00e87b" },
          "100%": { boxShadow: "0 0 10px #00e87b, 0 0 20px #00e87b, 0 0 30px #00e87b" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
