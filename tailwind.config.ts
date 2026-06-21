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
        background: "var(--background)",
        foreground: "var(--foreground)",
        orbi: {
          bg: "var(--orbi-bg)",
          surface: "var(--orbi-surface)",
          card: "var(--orbi-card)",
          primary: "var(--orbi-primary)",
          "primary-hover": "var(--orbi-primary-hover)",
          accent: "var(--orbi-accent)",
          "accent-dim": "var(--orbi-accent-dim)",
          secondary: "var(--orbi-secondary)",
          muted: "var(--orbi-muted)",
          border: "var(--orbi-border)",
          "border-light": "var(--orbi-border-light)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
