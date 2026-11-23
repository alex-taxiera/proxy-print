/** The public MPC Autofill backend, used until the user points elsewhere. */
export const DEFAULT_MPCFILL_SERVER_URL = "https://mpcfill.com";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Reduces what the user typed to a backend origin, or null if it can't be one.
 * MPC Autofill backends live at the root of their host, so any path is
 * dropped. Mirrors `backend_origin` in src-tauri/src/mpcfill.rs, which
 * enforces the same rules on the request itself: https only, except http for
 * a backend running on this machine.
 */
export const normalizeMpcFillServerUrl = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(
      /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
  } catch {
    return null;
  }

  const isLoopback = LOOPBACK_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback)) {
    return null;
  }
  if (url.username || url.password || !url.hostname) {
    return null;
  }

  return url.origin;
};

/** v13: the MPCFill swap dialog's backend URL joined the persisted state. */
export const migrateMpcFillServerV13 = <T extends object>(
  state: T,
): T & { mpcFillServerUrl: string } => {
  const current =
    "mpcFillServerUrl" in state && typeof state.mpcFillServerUrl === "string"
      ? normalizeMpcFillServerUrl(state.mpcFillServerUrl)
      : null;
  return {
    ...state,
    mpcFillServerUrl: current ?? DEFAULT_MPCFILL_SERVER_URL,
  };
};
