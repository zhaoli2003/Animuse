import media from "@/data/optimized-media.json";
import { publicPath } from "@/lib/site-url";

export function optimizedImage(src: string, sizes = "(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw") {
  const image = (media.images as Record<string, { src: string; srcSet: string }>)[src];
  return image ? {
    src: publicPath(image.src),
    srcSet: image.srcSet.split(",").map(candidate => candidate.trim().replace(/^\S+/, url => publicPath(url))).join(", "),
    sizes,
  } : { src: publicPath(src) };
}
export function previewPoster(src: string) {
  const poster = (media.previews as Record<string, string>)[src];
  return poster ? publicPath(poster) : undefined;
}
