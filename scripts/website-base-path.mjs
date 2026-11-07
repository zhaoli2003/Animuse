/** Prefix website resource URLs only; never rewrite downloadable source packages. */
export function websiteBasePath() {
  const value = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
  if (value && !/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(value)) throw new Error('Invalid website base path');
  return value;
}

export function rewriteWebsiteResources(text, basePath = websiteBasePath()) {
  if (!basePath) return text;
  // A URL must start at a string/HTML/CSS boundary, never inside an external URL.
  return text.replace(/(["'`(=\s])\/(assets\/|fonts\/|motion\/|landing\/|previews\/|(?:animuse|leibox|logo|favicon|apple-touch-icon|icon-192|icon-512|og)[\w.-]*\.(?:svg|png|ico|webp))/g,
    (_, boundary, resource) => `${boundary}${basePath}/${resource}`);
}
