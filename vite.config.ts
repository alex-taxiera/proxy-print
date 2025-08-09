import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "proxy-print",
      project: "proxy-print",
    }),
  ],
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "pdf-lib": ["pdf-lib"],
        },
      },
    },
    sourcemap: true,
  },
});
