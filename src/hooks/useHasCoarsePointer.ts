import { useSyncExternalStore } from "react";

const COARSE_POINTER = "(pointer: coarse)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(COARSE_POINTER);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const getSnapshot = () => window.matchMedia(COARSE_POINTER).matches;

/**
 * Whether the primary pointer is touch.
 *
 * Deliberately not a breakpoint: a touchscreen laptop reports a fine primary
 * pointer at any width, so it keeps the mouse-only interactions.
 */
export const useHasCoarsePointer = () =>
  useSyncExternalStore(subscribe, getSnapshot);
