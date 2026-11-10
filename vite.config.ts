/// <reference types="vitest/config" />
// https://vite.dev/config/
import { cloudflare } from "@cloudflare/vite-plugin";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import path from "path";
import { defineConfig } from "vite";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// Set by the Tauri CLI for the commands it runs (`tauri dev`, `tauri build`).
// The desktop app loads the same bundle from disk, so it has no use for the
// Cloudflare Worker and builds to its own directory.
const isDesktop = Boolean(process.env.TAURI_ENV_PLATFORM);

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "proxy-print",
      project: "proxy-print",
    }),
    ...(isDesktop ? [] : [cloudflare()]),
  ],
  envPrefix: ["VITE_", "TAURI_ENV_"],
  // Keeps Rust compiler output visible when the Tauri CLI runs the dev server.
  clearScreen: !isDesktop,
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // tauri.conf.json points at this port, so don't silently pick another.
    strictPort: isDesktop,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      "/cdn-images": {
        target: "https://cdn.mpcautofill.com/images/google_drive/full",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/cdn-images/, ""),
      },
    },
  },
  build: {
    outDir: isDesktop ? "dist-desktop" : "dist",
    rollupOptions: {
      output: {
        manualChunks: (moduleId) =>
          ["chakra-ui", "pdf-lib", "sentry"].find((lib) =>
            moduleId.includes(lib),
          ),
      },
    },

    sourcemap: true,
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            storybookScript: "npm run storybook --no-open",
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
