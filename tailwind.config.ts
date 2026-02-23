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
        primary: "#dc2626",
        "dark-bg": "#0f0f0f",
        "dark-card": "#1a1a1a",
        "dark-border": "#2a2a2a",
      },
      backgroundImage: {
        "stadium-gradient":
          "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(20,20,20,0.9) 50%, rgba(0,0,0,0.85) 100%)",
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
