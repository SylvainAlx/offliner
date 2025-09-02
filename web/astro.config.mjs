import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Compatibilité ESM pour __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    assetsInclude: ["../shared/fonts/*.ttf"],
    server: {
      fs: {
        // autorise ton dossier partagé + le projet lui-même
        allow: [
          resolve(__dirname, "../shared/fonts"),
          resolve(__dirname), // <-- très important, autorise ton projet
        ],
      },
    },
  },
  output: "server",
  adapter: vercel(),
});
