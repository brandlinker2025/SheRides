export const SITE_URL = "https://sherides.online";

const PRODUCTION_HOSTS = new Set(["sherides.online", "www.sherides.online"]);

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
}

export function siteOrigin(fallback = SITE_URL) {
  if (typeof window === "undefined") return fallback;
  try {
    const { origin, hostname } = window.location;
    if (PRODUCTION_HOSTS.has(hostname) || isLocalHost(hostname)) return origin;
    return fallback;
  } catch {
    return fallback;
  }
}
