import { isTauri } from "@tauri-apps/api/core";

/**
 * Whether this is the desktop app rather than the website. Everything under
 * `src/desktop/` is only reachable when this is true, and loads the Tauri
 * packages it needs on demand so the web bundle doesn't carry them.
 */
export const IS_DESKTOP = isTauri();

/** The element id of the header row that doubles as the window's title bar. */
export const TITLE_BAR_ID = "app-title-bar";

/**
 * Who draws the window chrome:
 * - `custom`: the page does (Windows, Linux) — the native frame is off.
 * - `mac`: macOS keeps its traffic lights, overlaid on the page's header.
 * - `browser`: not the desktop app.
 */
export type WindowFrame = "custom" | "mac" | "browser";

export const windowFrame = (): WindowFrame => {
  if (!IS_DESKTOP) return "browser";
  // Set by the Rust side before any page script runs (src-tauri/src/lib.rs).
  return Reflect.get(window, "__PMP_WINDOW_FRAME__") === "mac"
    ? "mac"
    : "custom";
};

/**
 * Lets dialogs and drawers treat the title bar as part of themselves, so the
 * window can still be dragged, minimized and closed while one is open.
 */
export const titleBarPersistentElements = IS_DESKTOP
  ? [() => document.getElementById(TITLE_BAR_ID)]
  : undefined;

const currentWindow = async () => {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
};

export const minimizeWindow = async () => (await currentWindow()).minimize();

export const toggleMaximizeWindow = async () =>
  (await currentWindow()).toggleMaximize();

export const closeWindow = async () => (await currentWindow()).close();

export const isWindowMaximized = async () =>
  (await currentWindow()).isMaximized();

/** Resolves to a function that stops listening. */
export const onWindowResized = async (handler: () => void) =>
  (await currentWindow()).onResized(handler);

/**
 * Asks before the window closes. `shouldClose` resolving to false keeps it
 * open. Resolves to a function that removes the guard.
 */
export const guardWindowClose = async (shouldClose: () => Promise<boolean>) =>
  (await currentWindow()).onCloseRequested(async (event) => {
    if (!(await shouldClose())) {
      event.preventDefault();
    }
  });

export const confirmDiscardChanges = async () => {
  const { confirm } = await import("@tauri-apps/plugin-dialog");
  return confirm("This project has unsaved changes. Close anyway?", {
    title: "Print My Proxy",
    kind: "warning",
    okLabel: "Close",
    cancelLabel: "Keep editing",
  });
};
