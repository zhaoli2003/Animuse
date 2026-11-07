/** A site base may include a project directory, but never credentials or URL state. */
export function normalizeSiteBaseUrl(value: string): string {
  const input = value.trim();
  const parsed = new URL(input);
  const rawPath = input.match(/^https?:\/\/[^/?#]+([^?#]*)/i)?.[1] ?? "";
  const decodedPath = decodeURIComponent(rawPath);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.search || parsed.hash || parsed.username || parsed.password
    || input.includes("\\") || /%(?:2f|5c|00)/i.test(rawPath) || decodedPath.split("/").some(part => part === "." || part === "..")) {
    throw new Error("Site URL must be an HTTP(S) base URL without credentials, query, fragment, or traversal.");
  }
  return parsed.origin + parsed.pathname.replace(/\/+$/, "");
}

function normalizeBasePath(value: string): string {
  const base = value.trim().replace(/\/+$/, "");
  if (!base) return "";
  if (!base.startsWith("/") || base.startsWith("//") || /[?#\\]/.test(base)
    || /%(?:2f|5c|00)/i.test(base) || decodeURIComponent(base).split("/").some(part => part === "." || part === "..")) {
    throw new Error("NEXT_PUBLIC_BASE_PATH must be an absolute path without traversal, query, or fragment.");
  }
  return base;
}

/** Local builds stay usable at /; the Pages workflow provides its public URL and base path. */
export const PUBLIC_SITE_URL = normalizeSiteBaseUrl(process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000");
export const SITE_URL = PUBLIC_SITE_URL;
export const BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? new URL(PUBLIC_SITE_URL).pathname);

/** Prefix website resources once. Next Link/router should keep their logical route paths. */
export function publicPath(pathname: string, basePath = BASE_PATH): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(pathname) || pathname.startsWith("#")) return pathname;
  const base = normalizeBasePath(basePath);
  const value = pathname.startsWith("/") ? pathname : "/" + pathname;
  const pathOnly = value.split(/[?#]/, 1)[0];
  return !base || pathOnly === base || pathOnly.startsWith(base + "/") ? value : base + value;
}

export function siteUrl(pathname: string): string {
  const base = normalizeSiteBaseUrl(process.env.NEXT_PUBLIC_SITE_URL
    || (typeof window !== "undefined" ? window.location.origin + BASE_PATH : SITE_URL));
  return new URL(publicPath(pathname, new URL(base).pathname), base + "/").href;
}
