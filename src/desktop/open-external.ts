/**
 * A webview has no tabs to open `target="_blank"` links in, so links that leave
 * the app are handed to the system's default browser instead. Only https links
 * are allowed out (see `opener:allow-open-url` in the capability file).
 */
export const installExternalLinkHandler = () => {
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (!(event.target instanceof Element)) return;

    const anchor = event.target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;

    const url = new URL(anchor.href, window.location.href);
    if (url.origin === window.location.origin) return;

    event.preventDefault();
    if (url.protocol !== "https:") return;

    void import("@tauri-apps/plugin-opener")
      .then(({ openUrl }) => openUrl(url.href))
      .catch((error: unknown) => {
        console.error("Couldn't open link", url.href, error);
      });
  });
};
