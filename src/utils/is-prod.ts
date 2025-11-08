export function isProd() {
  const PROD_DOMAINS = ["proxyprint.taxiera.net"];

  function isHostProd(hostname: string): boolean {
    return PROD_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  }

  if (typeof window !== "undefined" && typeof window.location !== "undefined") {
    // Check browser host
    return isHostProd(window.location.hostname);
  }

  return false;
}
