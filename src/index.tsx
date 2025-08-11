import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./index.css";

const SENTRY_ENV =
  typeof import.meta.env.VITE_SENTRY_ENV === "string"
    ? import.meta.env.VITE_SENTRY_ENV
    : import.meta.env.MODE;

Sentry.init({
  dsn: "https://d3279bfef49ddae1a49ef210fe2ea822@o4509812461207552.ingest.us.sentry.io/4509812463566848",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Logs
  enableLogs: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      maskAllInputs: false,
    }),
    // send console.log, console.error, and console.warn calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],

  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1,

  tracesSampleRate: SENTRY_ENV === "production" ? 0.1 : 1,
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/proxyprint\.taxiera\.net/,
    /^https:\/\/devprint\.taxiera\.net/,
  ],

  environment: SENTRY_ENV,
});

console.debug(`Sentry environment: ${SENTRY_ENV}`);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
