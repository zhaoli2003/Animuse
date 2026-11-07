import { BASE_PATH } from "@/lib/site-url";

/** Compare logical routes consistently across Next paths, DOM URLs and static trailing slashes. */
export function routePath(pathname: string, basePath = BASE_PATH): string {
  const path = pathname.split(/[?#]/, 1)[0];
  const base = basePath.replace(/\/+$/, "");
  const logical = base && (path === base || path.startsWith(base + "/")) ? path.slice(base.length) : path;
  return logical.replace(/\/+$/, "") || "/";
}
