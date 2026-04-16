/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        nu: ['"DM Sans"', "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#102a43",
        mist: "#f5f1e8",
        brass: "#c77726",
        moss: "#3f6b57",
        berry: "#7a2849",
        cloud: "#f9fafb",
        "nu-primary": "hsl(217, 72%, 46%)",
        "nu-accent": "hsl(199, 80%, 48%)",
      },
      boxShadow: {
        float: "0 20px 50px rgba(16, 42, 67, 0.12)",
        nu: "0 10px 40px -12px rgba(15, 23, 42, 0.18)",
        "nu-lg": "0 24px 48px -16px rgba(15, 23, 42, 0.22)",
      },
      borderRadius: {
        "4xl": "2rem",
        nu: "var(--radius, 1rem)",
      },
      transitionTimingFunction: {
        nu: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
