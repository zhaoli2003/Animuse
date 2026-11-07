import { BRAND } from '@/lib/brand';

export function MaintainerLinks() {
  return <span className="hidden items-center gap-3 pr-1 text-xs text-muted-foreground xl:inline-flex">
    <a href={BRAND.profile} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground" aria-label="维护者 zhaoli">zhaoli</a>
    {BRAND.x && <a href={BRAND.x} target="_blank" rel="noreferrer" className="hover:text-foreground">X</a>}
    {BRAND.xiaohongshu && <a href={BRAND.xiaohongshu} target="_blank" rel="noreferrer" className="hover:text-foreground">小红书</a>}
  </span>;
}
