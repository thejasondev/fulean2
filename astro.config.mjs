// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import AstroPWA from "@vite-pwa/astro";

// https://astro.build/config
export default defineConfig({
  // Site URL for canonical URLs and sitemap
  site: "https://fulean2.vercel.app",

  // Static output with on-demand rendering for API routes (Astro 5+)
  output: "static",

  // Vercel adapter
  adapter: vercel(),

  integrations: [
    react(),
    // Sitemap generation
    sitemap({
      changefreq: "daily",
      priority: 1.0,
      lastmod: new Date(),
    }),
    AstroPWA({
      registerType: "autoUpdate",
      workbox: {
        // Cache all static assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Stale-While-Revalidate for all navigations
        runtimeCaching: [
          {
            // Cache API rates with NetworkFirst (try network, fallback to cache)
            urlPattern: /\/api\/rates$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-rates-cache",
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 5, // Fallback to cache after 5s
            },
          },
          {
            urlPattern: /^https:\/\/.*/,
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
        name: "Fulean2 - Contador de Efectivo Cubano",
        short_name: "Fulean2",
        description:
          "Aplicación para contar efectivo CUP y convertir a USD, EUR, CAD, MLC y ZELLE con tasas El Toque",
        lang: "es",
        start_url: "/",
        scope: "/",
        orientation: "portrait",
        categories: ["finance", "utilities"],
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
