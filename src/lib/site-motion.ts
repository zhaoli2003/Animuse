import manifest from '@/data/site-motion.json';
import { publicPath } from '@/lib/site-url';

export function siteMotionUrl(slug: string, preview = false): string {
  const item = (manifest.components as Record<string, { documentUrl: string; previewUrl: string }>)[slug];
  return publicPath((preview ? item?.previewUrl : item?.documentUrl) ?? `/motion/${slug}.html`);
}
