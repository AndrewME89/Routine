/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // These match the real Nightshift OS app's compiled CSS tokens
        // exactly (pulled from its own stylesheet), not guessed.
        base: "#0b0d12",
        side: "#0e1118", // sidebar — distinct from panel, slightly darker
        surface: "#141821", // panel
        "surface-2": "#191e29", // panel2
        border: "#272d3a", // line
        accent: {
          DEFAULT: "#9b87f5", // violet
          soft: "#9b87f51a",
          bright: "#b3a3f8",
        },
        cyan: "#62d9cf",
        warn: "#f0b85a", // amber
        good: "#78cf91", // green
        danger: "#ec7f85", // red
        ink: "#f3f5f7", // text
        muted: "#9299a8",
        faint: "#5b5f70",
      },
      fontFamily: {
        sans: [
          "Geist",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        panel: "0 18px 50px rgba(0,0,0,0.33)",
      },
    },
  },
  plugins: [],
};

