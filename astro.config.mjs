// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  // Static site generation for optimal performance
  output: "static",

  // Vercel adapter
  adapter: vercel(),

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});
