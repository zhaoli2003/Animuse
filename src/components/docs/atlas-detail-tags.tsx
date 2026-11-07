"use client";

import Link from "next/link";
import { useLanguage } from "@/components/common/language-provider";
import { ATLAS_FACETS, ATLAS_ITEMS } from "@/data/atlas-taxonomy";

type DetailDimension = "category" | "visual" | "interaction";
type DetailTag = {
  dimension: DetailDimension;
  id: string;
  label: { zh: string; en: string };
};

const normalized = (text: string) => text.normalize("NFKC").trim().toLocaleLowerCase("en-US");
// These existing implementation/source notes are informational, not taxonomy aliases.
const technicalTag = /^(?:\d+ frameworks?|TypeScript|JavaScript|React|Vue|Svelte|Solid|Preact|Vanilla|Next\.js|GSAP|webgl|webgpu|three\.js|html-in-canvas|3D|.+ original)$/i;

export function AtlasDetailTags({ slug, title, tags = [] }: { slug?: string; title: string; tags?: string[] }) {
  const { locale, t } = useLanguage();
  // The shared transition header and the standalone Orbit page provide the exact catalog title.
  const item = slug ? ATLAS_ITEMS.find(entry => entry.slug === slug) : ATLAS_ITEMS.find(entry => entry.name === title || t(entry.name) === title);
  const selected: DetailTag[] = [];
  const labels = new Set<string>();
  const hasLabel = (option: { label: { zh: string; en: string } }) => Object.values(option.label).some(label => labels.has(normalized(label)));
  const addTag = (dimension: DetailDimension, id?: string) => {
    const option = ATLAS_FACETS[dimension].find(entry => entry.id === id);
    if (!option || hasLabel(option)) return;
    selected.push({ dimension, id: option.id, label: option.label });
    Object.values(option.label).forEach(label => labels.add(normalized(label)));
  };

  if (item) {
    const categories = ATLAS_FACETS.category.filter(option => item.category.includes(option.id));
    addTag("category", categories.find(option => !option.parent)?.id);
    addTag("category", categories.find(option => option.parent)?.id);
    for (const dimension of ["visual", "interaction"] as const) {
      const option = ATLAS_FACETS[dimension].find(entry => item[dimension].includes(entry.id) && !hasLabel(entry));
      addTag(dimension, option?.id);
    }
  }

  const notes = [...new Set(tags)].filter(tag => {
    const label = normalized(t(tag));
    if (labels.has(label) || labels.has(normalized(tag)) || (item && !technicalTag.test(tag))) return false;
    labels.add(label);
    return true;
  });
  if (!selected.length && !notes.length) return null;

  return (
    <div className="mt-4 space-y-2" data-atlas-detail-tags={item?.slug}>
      {selected.length ? (
        <nav aria-label={locale === "zh" ? "浏览相关组件" : "Browse related components"} className="flex flex-wrap gap-1.5">
          {selected.map(tag => {
            const label = tag.label[locale];
            const query = new URLSearchParams({ [tag.dimension]: tag.id });
            return (
              <Link
                key={`${tag.dimension}:${tag.id}`}
                href={`/components?${query}`}
                prefetch={false}
                aria-label={locale === "zh" ? `浏览${label}组件` : `Browse ${label} components`}
                className="inline-flex min-h-7 items-center rounded-full border border-border/70 bg-muted/30 px-2.5 py-0.5 text-[11.5px] text-foreground/80 transition-colors hover:border-foreground/25 hover:bg-muted/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {label}
              </Link>
            );
          })}
        </nav>
      ) : null}
      {notes.length ? (
        <div className="flex flex-wrap gap-1.5">
          {notes.map(tag => (
            <span key={tag} className="rounded-full border border-border/50 px-2.5 py-0.5 text-[11.5px] text-muted-foreground">
              {t(tag)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
