/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "var(--color-bg)",
        panel: "var(--color-panel)",
        panelhi: "var(--color-panel-hi)",
        border: "var(--color-border)",
        muted: "var(--color-muted)",
        accent: "var(--color-accent)",
        accentdim: "var(--color-accent-dim)",
        onaccent: "#04140B",
        aqi: {
          good: "#22C55E",
          moderate: "#EAB308",
          usg: "#F97316",
          unhealthy: "#EF4444",
          veryunhealthy: "#A855F7",
          hazardous: "#7F1D1D",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
