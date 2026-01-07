// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import AstroPWA from "@vite-pwa/astro";

// https://astro.build/config
export default defineConfig({
  // Static site generation for optimal performance
  output: "static",

  // Vercel adapter
  adapter: vercel(),

  integrations: [
    react(),
    AstroPWA({
      registerType: "autoUpdate",
      workbox: {
        // Cache all static assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Stale-While-Revalidate for all navigations
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "external-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
      manifest: {
        name: "Fulean2 - Contador de Efectivo",
        short_name: "Fulean2",
        description:
          "Aplicación móvil para contar efectivo CUP y convertir divisas",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        icons: [
          {
            src: "/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
