/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0a0b10",
        surface: "#13151c",
        "surface-2": "#191b24",
        border: "#242732",
        accent: {
          DEFAULT: "#7c6cf6",
          soft: "#7c6cf61a",
          bright: "#9b8dff",
        },
        warn: "#e8a33d",
        good: "#4fd1a5",
        ink: "#e9eaf2",
        muted: "#8b8fa3",
        faint: "#5b5f70",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};
