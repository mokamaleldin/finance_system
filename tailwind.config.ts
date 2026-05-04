import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#08231f",
        muted: "#6f7d78",
        line: "#e4e1da",
        paper: "#f8f7f3",
        olive: "#0f8f62",
        gold: "#d99a17",
        coral: "#c55345",
        mint: "#e9f6ef",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(8, 35, 31, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
