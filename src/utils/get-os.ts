export function getOS(): "macos" | "ios" | "other" {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.userAgent === "string"
  ) {
    const ua = navigator.userAgent;
    if (/Macintosh|Mac OS X/.test(ua)) {
      return "macos";
    }
    if (/iPhone|iPad|iPod/.test(ua)) {
      return "ios";
    }
  }
  if (typeof process !== "undefined" && typeof process.platform === "string") {
    if (process.platform === "darwin") {
      // Node.js on macOS
      return "macos";
    }
  }
  return "other";
}
