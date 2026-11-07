import { ATLAS_FACETS, type AtlasItem, type FilterDimension } from "../data/atlas-taxonomy.ts";

export type FilterState = { q: string } & Record<FilterDimension, string[]>;
export const FILTER_DIMENSIONS: FilterDimension[] = ["category", "visual", "interaction", "framework", "scene"];
export const EMPTY_FILTERS: FilterState = { q: "", category: [], visual: [], interaction: [], framework: [], scene: [] };

const allowed = Object.fromEntries(FILTER_DIMENSIONS.map((dimension) =>
  [dimension, new Set(ATLAS_FACETS[dimension].map(({ id }) => id))])) as Record<FilterDimension, Set<string>>;
const parentById = Object.fromEntries(FILTER_DIMENSIONS.map((dimension) =>
  [dimension, new Map(ATLAS_FACETS[dimension].map(({ id, parent }) => [id, parent]))])) as Record<FilterDimension, Map<string, string | undefined>>;
const cleanQuery = (q: string) => Array.from(q.normalize("NFKC").trim().replace(/\s+/g, " ")).slice(0, 160).join("").trim();
const cleanValues = (dimension: FilterDimension, values: readonly string[]) => {
  const selected = new Set(values.flatMap((value) => value.split(",")).map((value) => value.trim()).filter((value) => allowed[dimension].has(value)));
  // A selected parent already covers all its descendants. Keep URLs canonical.
  return [...selected].filter((id) => {
    if (dimension !== "category") return true;
    const seen = new Set<string>();
    let parent = parentById[dimension].get(id);
    while (parent && !seen.has(parent)) {
      if (selected.has(parent)) return false;
      seen.add(parent);
      parent = parentById[dimension].get(parent);
    }
    return true;
  }).sort();
};

/** Accept a location.search string or URLSearchParams; unknown dimensions/IDs never become active filters. */
export function parseFilters(search: string | URLSearchParams): FilterState {
  const params = typeof search === "string" ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search) : search;
  return {
    q: cleanQuery(params.get("q") ?? ""),
    ...Object.fromEntries(FILTER_DIMENSIONS.map((dimension) => [dimension, cleanValues(dimension, params.getAll(dimension))])),
  } as FilterState;
}

/** Stable ordering makes copied URLs and browser history independent of click order. */
export function serializeFilters(state: FilterState): string {
  const params = new URLSearchParams();
  const q = cleanQuery(state.q);
  if (q) params.set("q", q);
  for (const dimension of FILTER_DIMENSIONS) {
    const values = cleanValues(dimension, state[dimension]);
    if (values.length) params.set(dimension, values.join(","));
  }
  return params.toString();
}

function matchesOption(item: AtlasItem, dimension: FilterDimension, id: string): boolean {
  if (!allowed[dimension].has(id)) return false;
  if (item[dimension].includes(id)) return true;
  // Work for a leaf-only item as well as the canonical parent+leaf representation.
  return item[dimension].some((value) => {
    const seen = new Set<string>();
    let parent = parentById[dimension].get(value);
    while (parent && !seen.has(parent)) {
      if (parent === id) return true;
      seen.add(parent);
      parent = parentById[dimension].get(parent);
    }
    return false;
  });
}

/** Words use AND; selections within one dimension use OR; different dimensions use AND. */
export function filterItems<T extends AtlasItem>(items: readonly T[], state: FilterState, omitDimension?: FilterDimension): T[] {
  const words = cleanQuery(state.q).toLowerCase().split(" ").filter(Boolean);
  const selections = FILTER_DIMENSIONS.filter((dimension) => dimension !== omitDimension)
    .map((dimension) => [dimension, cleanValues(dimension, state[dimension])] as const);
  return items.filter((item) => {
    const text = item.searchText.normalize("NFKC").toLowerCase();
    return words.every((word) => text.includes(word)) && selections.every(([dimension, ids]) =>
      ids.length === 0 || ids.some((id) => matchesOption(item, dimension, id)));
  });
}

/** Disjunctive facet count: replace the dimension's selection with this option. */
export function countFacet<T extends AtlasItem>(items: readonly T[], state: FilterState, dimension: FilterDimension, id: string): number {
  if (!allowed[dimension].has(id)) return 0;
  return filterItems(items, state, dimension).filter((item) => matchesOption(item, dimension, id)).length;
}

export function toggleFilter(state: FilterState, dimension: FilterDimension, id: string): FilterState {
  const next = parseFilters(serializeFilters(state));
  if (!allowed[dimension].has(id)) return next;
  next[dimension] = cleanValues(dimension, next[dimension].includes(id) ? next[dimension].filter((value) => value !== id) : [...next[dimension], id]);
  return next;
}
