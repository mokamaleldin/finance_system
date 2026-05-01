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
        ink: "#15201d",
        muted: "#65736e",
        line: "#d8dfdc",
        paper: "#f7f6f0",
        olive: "#526144",
        gold: "#b68a3a",
        coral: "#b75f4a",
        mint: "#e7f0ea",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(21, 32, 29, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
