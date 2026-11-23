import * as Sentry from "@sentry/react";
import type { Update } from "@tauri-apps/plugin-updater";

export type AvailableUpdate = Update;

/** Resolves to the newer release, or null when this is the latest. */
export const checkForUpdate = async (): Promise<AvailableUpdate | null> => {
  const { check } = await import("@tauri-apps/plugin-updater");
  return check();
};

/** Downloads and installs the update, then restarts the app into it. */
export const installUpdate = (update: AvailableUpdate) =>
  Sentry.startSpan(
    {
      name: "desktop.install-update",
      op: "app.update",
      attributes: { "update.version": update.version },
    },
    async () => {
      await update.downloadAndInstall();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    },
  );
