import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

import react from "@astrojs/react";

// Compatibilité ESM pour __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    assetsInclude: ["../shared/fonts/*.ttf"],
    server: {
      fs: {
        allow: [resolve(__dirname, "../shared"), resolve(__dirname)],
      },
    },
    ssr: {
      noExternal: ["lucide-react"],
    },
    optimizeDeps: {
      include: [],
    },
  },

  output: "server",
  adapter: vercel(),
  integrations: [react()],
});
