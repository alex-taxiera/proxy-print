import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";

const SENTRY_ENV =
  typeof import.meta.env.VITE_SENTRY_ENV === "string"
    ? import.meta.env.VITE_SENTRY_ENV
    : import.meta.env.MODE;

const SENTRY_DSN =
  typeof import.meta.env.VITE_SENTRY_DSN === "string"
    ? import.meta.env.VITE_SENTRY_DSN
    : undefined;

Sentry.init({
  dsn: SENTRY_DSN,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Logs
  enableLogs: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: false,
      blockAllMedia: false,
      unmask: ["input", "textarea"],
    }),
    // send console.log, console.error, and console.warn calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],

  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1,

  tracesSampleRate: SENTRY_ENV === "production" ? 0.1 : 1,
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/printmyproxy\.com/,
    /^https:\/\/dev\.printmyproxy\.com/,
    /^https:\/\/proxyprint\.taxiera\.net/,
    /^https:\/\/dev-proxyprint\.taxiera\.net/,
    /^https:\/\/devprint\.taxiera\.net/,
  ],

  environment: SENTRY_ENV,
});

console.debug(`Sentry environment: ${SENTRY_ENV}`);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
