// tailwind.config.ts
import type { Config } from "tailwindcss";
import { COLORS } from "shared/theme";

const config: Config = {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}",
    "../shared/**/*.{ts,js}",
  ],
  theme: {
    extend: {
      colors: COLORS,
    },
  },
  plugins: [],
};

export default config;
