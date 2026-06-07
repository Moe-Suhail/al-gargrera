import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FBFCF5",
        mintpaper: "#F8FAF3",
        leaf: "#2F6B3F",
        leafDark: "#1F2A1F",
        lime: "#C9F24D",
        limeSoft: "#EAF9B8",
        coin: "#D9A441",
        coinSoft: "#F6E3A1",
        muted: "#667066",
        line: "#E1E8D8"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(47, 107, 63, 0.10)",
        coin: "0 10px 26px rgba(217, 164, 65, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
