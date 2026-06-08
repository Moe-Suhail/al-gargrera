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
        surface: "#FFFDF4",
        mintpaper: "#F8FAF3",
        leaf: "#2F6B3F",
        leafDark: "#1F2A1F",
        ink: "#172017",
        sage: "#7D8B70",
        lime: "#C9F24D",
        limeSoft: "#EAF9B8",
        coin: "#D9A441",
        coinSoft: "#F6E3A1",
        muted: "#667066",
        line: "#E1E8D8"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(47, 107, 63, 0.10)",
        card: "0 18px 46px rgba(30, 49, 29, 0.08)",
        elevated: "0 28px 70px rgba(18, 48, 27, 0.18)",
        nav: "0 -18px 46px rgba(30, 49, 29, 0.14)",
        coin: "0 10px 26px rgba(217, 164, 65, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
