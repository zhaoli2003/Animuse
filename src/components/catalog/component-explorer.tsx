"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "@/components/common/language-provider";
import { ATLAS_FACETS, ATLAS_ITEMS, type FacetOption, type FilterDimension } from "@/data/atlas-taxonomy";
import { countFacet, filterItems, FILTER_DIMENSIONS, parseFilters, serializeFilters, toggleFilter, type FilterState } from "@/lib/atlas-filters";
import { cn } from "@/lib/utils";

const CHANGE_EVENT = "atlas:filters";
const readSearch = () => window.location.search;
const serverSearch = () => "";
function subscribeSearch(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
const dimensions: Record<FilterDimension, { zh: string; en: string }> = {
  category: { zh: "用途", en: "Purpose" },
  visual: { zh: "视觉", en: "Visual style" },
  interaction: { zh: "交互", en: "Interaction" },
  framework: { zh: "框架", en: "Framework" },
  scene: { zh: "场景", en: "Use case" },
};
const focusStyle = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function ComponentExplorer({ cards }: { cards: { slug: string; content: ReactNode }[] }) {
  const { locale } = useLanguage();
  const copy = (zh: string, en: string) => locale === "zh" ? zh : en;
  const search = useSyncExternalStore(subscribeSearch, readSearch, serverSearch);
  const state = useMemo(() => parseFilters(search), [search]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [draftQuery, setDraftQuery] = useState<string | null>(null);
  const editingSearch = useRef(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const visible = useMemo(() => filterItems(ATLAS_ITEMS, state), [state]);
  useEffect(() => {
    const resetDraft = () => { setDraftQuery(null); editingSearch.current = false; };
    window.addEventListener("popstate", resetDraft);
    return () => window.removeEventListener("popstate", resetDraft);
  }, []);
  const visibleSlugs = new Set(visible.map(item => item.slug));
  const selected = FILTER_DIMENSIONS.flatMap(dimension => state[dimension].map(id => ({
    dimension, id, option: ATLAS_FACETS[dimension].find(option => option.id === id)!,
  })));
  const hasFilters = !!(state.q || selected.length);
  const categoryOptions = ATLAS_FACETS.category;
  const parentOptions = categoryOptions.filter(option => !option.parent);
  const activeParents = new Set(state.category.map(id => categoryOptions.find(option => option.id === id)?.parent ?? id));
  const childOptions = categoryOptions.filter(option => option.parent && activeParents.has(option.parent));
  const write = (next: FilterState, replace = false) => {
    const query = serializeFilters(next);
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    if (window.location.pathname + window.location.search === url) return;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };
  const toggle = (dimension: FilterDimension, option: FacetOption) => {
    editingSearch.current = false;
    if (dimension !== "category") return write(toggleFilter(state, dimension, option.id));
    // A child refines its parent, while sibling selections continue to use OR.
    if (option.parent) {
      const refined = { ...state, category: state.category.filter(id => id !== option.parent) };
      return write(toggleFilter(refined, dimension, option.id));
    }
    const children = categoryOptions.filter(child => child.parent === option.id).map(child => child.id);
    const selectedParent = state.category.includes(option.id);
    const next = state.category.filter(id => id !== option.id && !children.includes(id));
    write({ ...state, category: selectedParent ? next : [...next, option.id] });
  };
  const clear = () => { editingSearch.current = false; write(parseFilters("")); };
  const optionButton = (dimension: FilterDimension, option: FacetOption) => {
    const active = state[dimension].includes(option.id);
    const partial = dimension === "category" && !option.parent && activeParents.has(option.id) && !active;
    const count = countFacet(ATLAS_ITEMS, state, dimension, option.id);
    return <button key={option.id} type="button" aria-pressed={active}
      data-filter-dimension={dimension} data-filter-value={option.id} data-filter-count={count}
      disabled={!active && !partial && count === 0}
      onClick={() => toggle(dimension, option)}
      className={cn("inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs leading-4 transition-colors disabled:cursor-not-allowed disabled:opacity-35", focusStyle,
        active ? "border-foreground bg-foreground text-background" : partial ? "border-foreground/40 bg-accent text-foreground" : "border-transparent bg-muted/55 text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground")}>
      {active && <Check className="size-3 shrink-0" aria-hidden="true" />}
      <span>{option.label[locale]}</span>
      <span className={cn("text-[11px] tabular-nums", active ? "text-background/80" : "text-muted-foreground")}>{count}</span>
    </button>;
  };
  const facetRow = (dimension: FilterDimension, options: FacetOption[], limit?: number) => {
    const isExpanded = expanded[dimension];
    const shown = limit && !isExpanded ? options.filter((option, index) => index < limit || state[dimension].includes(option.id)) : options;
    return <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-4" role="group" aria-label={dimensions[dimension][locale]}>
      <span className="pt-1.5 text-xs font-medium text-muted-foreground sm:w-14 sm:shrink-0">{dimensions[dimension][locale]}</span>
      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        {shown.map(option => optionButton(dimension, option))}
        {limit && options.length > limit && <button type="button" aria-expanded={!!isExpanded}
          data-expand-facet={dimension} onClick={() => setExpanded(previous => ({ ...previous, [dimension]: !previous[dimension] }))}
          className={cn("inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground", focusStyle)}>
          {isExpanded ? copy("收起", "Less") : copy("更多", "More")}<ChevronDown className={cn("size-3", isExpanded && "rotate-180")} aria-hidden="true" />
        </button>}
      </div>
    </div>;
  };
  const preferredVisuals = ["glass", "particles", "3d", "ascii", "liquid", "minimal", "gradient", "dots", "paper", "illustration"];
  const visualOptions = [...ATLAS_FACETS.visual].sort((a, b) => {
    const rank = (id: string) => preferredVisuals.includes(id) ? preferredVisuals.indexOf(id) : 100;
    return rank(a.id) - rank(b.id);
  });
  const primaryInteractionIds = ["click", "hover", "drag", "scroll", "pointer", "text-selection", "input", "autoplay", "focus"];
  const primaryInteractions = ATLAS_FACETS.interaction.filter(option => primaryInteractionIds.includes(option.id));
  const inputAndPlayback = ATLAS_FACETS.interaction.filter(option => !primaryInteractionIds.includes(option.id));
  const advancedCount = state.framework.length + state.scene.length + state.interaction.filter(id => !primaryInteractionIds.includes(id)).length;
  const relief = selected.map(item => ({ ...item, count: filterItems(ATLAS_ITEMS, { ...state, [item.dimension]: state[item.dimension].filter(id => id !== item.id) }).length })).filter(item => item.count > 0).slice(0, 3);

  return <section id="interaction" className="mt-7 scroll-mt-24" aria-labelledby="components-title">
    <div className="rounded-2xl border border-border/80 bg-background p-4 sm:p-5" data-atlas-filters>
      <div className="relative sm:mb-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input ref={searchInput} data-atlas-search type="search" value={draftQuery ?? state.q} maxLength={160}
          aria-label={copy("搜索组件", "Search components")}
          placeholder={copy("搜索组件、效果或使用场景…", "Search components, effects, or use cases…")}
          onFocus={() => setDraftQuery(parseFilters(window.location.search).q)}
          onBlur={() => { editingSearch.current = false; setDraftQuery(null); }}
          onChange={event => { setDraftQuery(event.target.value); write({ ...state, q: event.target.value }, editingSearch.current); editingSearch.current = true; }}
          className="h-11 w-full min-w-0 rounded-xl border border-transparent bg-muted/60 pr-3 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/15 [&::-webkit-search-cancel-button]:cursor-pointer" />
      </div>
      <button type="button" data-atlas-mobile-toggle aria-expanded={mobileExpanded} aria-controls="atlas-facet-options"
        onClick={() => setMobileExpanded(value => !value)}
        className={cn("mt-3 flex min-h-9 w-full items-center gap-2 rounded-lg px-1 text-sm font-medium sm:hidden", focusStyle)}>
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {mobileExpanded ? copy("收起筛选", "Hide filters") : copy("展开筛选", "Show filters")}
        {selected.length > 0 && <span className="rounded-full bg-foreground px-2 py-0.5 text-xs text-background">{selected.length}</span>}
        <ChevronDown className={cn("ml-auto size-4 text-muted-foreground", mobileExpanded && "rotate-180")} aria-hidden="true" />
      </button>
      <div id="atlas-facet-options" className={cn("mt-4 sm:mt-0", !mobileExpanded && "hidden sm:block")}>
      <div className="space-y-3.5">
        {facetRow("category", parentOptions)}
        {childOptions.length > 0 && <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-4" role="group" aria-label={copy("具体类型", "Component type")}>
          <span className="pt-1.5 text-xs text-muted-foreground sm:w-14 sm:shrink-0">{copy("类型", "Type")}</span>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">{childOptions.map(option => optionButton("category", option))}</div>
        </div>}
        {facetRow("visual", visualOptions, 8)}
        {facetRow("interaction", primaryInteractions, 6)}
      </div>
      <details className="group mt-4 border-t border-border/70 pt-3.5" open={advancedCount > 0 || undefined}>
        <summary data-atlas-more className={cn("flex w-fit cursor-pointer list-none items-center gap-2 rounded text-xs font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden", focusStyle)}>
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />{copy("更多筛选", "More filters")}
          {advancedCount > 0 && <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background">{advancedCount}</span>}
          <ChevronDown className="size-3.5 group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="mt-4 space-y-3.5">
          {facetRow("framework", ATLAS_FACETS.framework)}
          {facetRow("scene", ATLAS_FACETS.scene)}
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-4" role="group" aria-label={copy("输入与播放能力", "Input and playback support")}>
            <span className="pt-1.5 text-xs font-medium text-muted-foreground sm:w-14 sm:shrink-0">{copy("能力", "Support")}</span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">{inputAndPlayback.map(option => optionButton("interaction", option))}</div>
          </div>
        </div>
      </details>
      </div>
    </div>

    <div className="mt-5 mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <p data-atlas-results role="status" aria-live="polite" aria-atomic="true" className="text-sm font-medium tabular-nums">
        {copy(`${visible.length} 个组件`, `${visible.length} components`)}
        {hasFilters && <span className="ml-1.5 font-normal text-muted-foreground">/ {ATLAS_ITEMS.length}</span>}
      </p>
      {hasFilters ? <button data-atlas-clear type="button" onClick={clear} className={cn("rounded text-xs text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground", focusStyle)}>{copy("清除全部", "Clear all")}</button>
        : <p className="text-xs text-muted-foreground">{copy("选几个标签，找到适合你的组件", "Find your next component with a few tags")}</p>}
      {hasFilters && <div className="flex w-full flex-wrap gap-2" aria-label={copy("已选条件", "Active filters")}>
        {state.q && <button data-active-filter="q" type="button" onClick={() => { editingSearch.current = false; write({ ...state, q: "" }); searchInput.current?.focus(); setDraftQuery(""); }} className={cn("inline-flex max-w-full items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs", focusStyle)} aria-label={copy(`移除搜索：${state.q}`, `Remove search: ${state.q}`)}>
          <Search className="size-3 shrink-0" aria-hidden="true" /><span className="max-w-64 truncate">{state.q}</span><X className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>}
        {selected.map(({ dimension, id, option }) => <button key={`${dimension}:${id}`} data-active-filter={`${dimension}:${id}`} type="button"
          onClick={() => write(toggleFilter(state, dimension, id))} aria-label={copy(`移除${dimensions[dimension].zh}：${option.label.zh}`, `Remove ${dimensions[dimension].en}: ${option.label.en}`)}
          className={cn("inline-flex max-w-full items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted", focusStyle)}>
          <span className="text-muted-foreground">{dimensions[dimension][locale]}</span>{option.label[locale]}<X className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>)}
      </div>}
    </div>

    {visible.length ? <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" data-atlas-grid>
      {cards.filter(card => visibleSlugs.has(card.slug)).map(card => card.content)}
    </ul> : <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border px-5 py-12 text-center" data-atlas-empty>
      <Search className="mb-4 size-6 text-muted-foreground/60" aria-hidden="true" />
      <h2 className="text-base font-medium">{copy("暂时没有匹配的组件", "No matching components")}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{copy("试试更短的关键词，或移除一个筛选条件", "Try a shorter search or remove a filter")}</p>
      {relief.length > 0 && <div className="mt-5 flex flex-wrap justify-center gap-2">{relief.map(({ dimension, id, option, count }) => <button type="button" key={`${dimension}:${id}`} onClick={() => write(toggleFilter(state, dimension, id))} className={cn("rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted", focusStyle)}>
        {copy(`移除「${option.label.zh}」 · ${count} 个结果`, `Remove ${option.label.en} · ${count} results`)}
      </button>)}</div>}
      <button type="button" onClick={clear} className={cn("mt-6 rounded-lg bg-foreground px-4 py-2.5 text-sm text-background hover:opacity-85", focusStyle)}>{copy("浏览全部组件", "Browse all components")}</button>
    </div>}
  </section>;
}
