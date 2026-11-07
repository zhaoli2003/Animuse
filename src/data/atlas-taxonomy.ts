import { COMPONENT_CATALOG } from "./component-catalog.ts";
import { AI_DISCOVERY } from "./ai-discovery.ts";
import { interactionTranslations } from "../lib/i18n/interactions.ts";

export type FilterDimension = "category" | "visual" | "interaction" | "framework" | "scene";
export type FacetOption = { id: string; label: { zh: string; en: string }; parent?: string };
export type AtlasItem = {
  slug: string;
  href: string;
  name: string;
  description: string;
  category: string[];
  visual: string[];
  interaction: string[];
  framework: string[];
  scene: string[];
  searchText: string;
};

const option = (id: string, zh: string, en: string, parent?: string): FacetOption =>
  ({ id, label: { zh, en }, ...(parent ? { parent } : {}) });

/** Main classes describe the component's job; subtypes describe the concrete UI. */
export const ATLAS_FACETS: Record<FilterDimension, FacetOption[]> = {
  category: [
    option("input", "输入与选择", "Input & selection"),
    option("buttons", "按钮", "Buttons", "input"),
    option("pickers-sliders", "选择器与滑块", "Pickers & sliders", "input"),
    option("chat-input", "对话输入", "Chat input", "input"),
    option("verification-input", "验证码输入", "Verification input", "input"),
    option("navigation-layout", "导航与布局", "Navigation & layout"),
    option("menus-navigation", "菜单与导航", "Menus & navigation", "navigation-layout"),
    option("tooltips", "提示气泡", "Tooltips", "navigation-layout"),
    option("layout-switching", "布局切换", "Layout switching", "navigation-layout"),
    option("resize-drag", "尺寸调整与拖拽布局", "Resize & drag layouts", "navigation-layout"),
    option("cards-media", "卡片、列表与媒体", "Cards, lists & media"),
    option("cards-galleries", "卡片与画廊", "Cards & galleries", "cards-media"),
    option("carousels", "轮播与图片切换", "Carousels & image transitions", "cards-media"),
    option("metadata-lists", "列表与标签信息", "Lists & metadata", "cards-media"),
    option("media-player", "播放器与专辑", "Players & albums", "cards-media"),
    option("text", "文字", "Text"),
    option("text-selection", "文字选区", "Text selection", "text"),
    option("text-morph", "文字切换", "Text morphing", "text"),
    option("feedback", "状态与反馈", "Status & feedback"),
    option("confirmation", "确认反馈", "Confirmation", "feedback"),
    option("loading-progress", "加载与进度", "Loading & progress", "feedback"),
    option("files-collaboration", "文件与协作", "Files & collaboration"),
    option("file-display", "文件展示", "File display", "files-collaboration"),
    option("sharing-permissions", "分享与权限", "Sharing & permissions", "files-collaboration"),
    option("background-effects", "背景与页面特效", "Background & page effects"),
    option("animated-backgrounds", "动态背景", "Animated backgrounds", "background-effects"),
    option("cursor-effects", "鼠标与透镜效果", "Cursor & lens effects", "background-effects"),
    option("scroll-effects", "滚动与页面过渡", "Scroll & page transitions", "background-effects"),
    option("hero-models", "首屏与模型展示", "Hero & model showcases"),
    option("model-showcase", "模型展示", "Model showcases", "hero-models"),
    option("hero-sequences", "首屏演示动效", "Hero sequences", "hero-models"),
    option("data", "数据展示", "Data display"),
    option("charts", "图表", "Charts", "data"),
    option("templates", "页面模板", "Page templates"),
    option("error-page", "错误页", "Error pages", "templates"),
  ],
  visual: [
    option("3d", "立体", "3D"), option("glass", "玻璃", "Glass"),
    option("refraction", "折射", "Refraction"), option("translucent", "半透明", "Translucent"),
    option("liquid", "液体", "Liquid"), option("particles", "粒子", "Particles"),
    option("ascii", "字符画", "ASCII"), option("dots", "点阵", "Dot matrix"),
    option("gradient", "渐变", "Gradient"), option("grain", "颗粒纹理", "Grain & noise"),
    option("glow", "发光", "Glow"), option("blur", "模糊", "Blur"),
    option("photography", "摄影", "Photography"), option("illustration", "插画", "Illustration"),
    option("paper", "纸张", "Paper"), option("ink", "墨水", "Ink"),
    option("metallic", "金属", "Metallic"), option("marble", "大理石", "Marble"),
    option("ice", "冰霜", "Ice"), option("botanical", "植物", "Botanical"),
    option("cosmic", "宇宙", "Cosmic"), option("cyber", "科技", "Cyber"),
    option("typography", "字体排版", "Typography"), option("editorial", "杂志排版", "Editorial"),
    option("line-art", "线条", "Line art"), option("minimal", "极简", "Minimal"),
    option("monochrome", "单色", "Monochrome"), option("colorful", "多彩", "Colorful"),
    option("dark", "暗色", "Dark"), option("light", "亮色", "Light"),
    option("elastic", "弹性", "Elastic"), option("tactile", "触感", "Tactile"),
    option("folded", "折叠", "Folded"), option("capsule", "胶囊形", "Capsule"),
    option("layered", "叠层", "Layered"), option("compact", "紧凑", "Compact"),
    option("grid", "网格", "Grid"), option("stickers", "贴纸与表情", "Stickers & emoji"),
  ],
  // Keyboard/touch describe declared input support, not inferred triggers.
  interaction: [
    option("hover", "悬停", "Hover"), option("click", "点击", "Click"),
    option("pointer", "指针移动", "Pointer movement"), option("drag", "拖拽", "Drag"),
    option("scroll", "滚动", "Scroll"), option("text-selection", "文字选区", "Text selection"),
    option("input", "输入", "Input"), option("search", "搜索", "Search"),
    option("focus", "聚焦", "Focus"), option("autoplay", "自动播放", "Autoplay"),
    option("play", "播放控制", "Play control"), option("pause", "暂停控制", "Pause control"),
    option("replay", "重播控制", "Replay control"), option("seek", "进度拖动", "Seek"),
    option("keyboard", "键盘支持", "Keyboard support"), option("touch", "触屏支持", "Touch support"),
  ],
  framework: [
    option("react", "React", "React"), option("vue", "Vue", "Vue"),
    option("svelte", "Svelte", "Svelte"), option("solid", "Solid", "Solid"),
    option("preact", "Preact", "Preact"), option("vanilla", "原生 JavaScript", "Vanilla JavaScript"),
    option("nextjs", "Next.js", "Next.js"), option("unknown", "未标注", "Not specified"),
  ],
  scene: [
    option("app-ui", "应用界面", "App interfaces"),
    option("ai-interface", "AI 界面", "AI interfaces"),
    option("brand-showcase", "品牌展示", "Brand showcases"),
    option("portfolio-gallery", "作品集与画廊", "Portfolios & galleries"),
    option("reading-writing", "阅读与写作", "Reading & writing"),
    option("editor-workspace", "编辑器与工作区", "Editors & workspaces"),
    option("authentication", "登录验证", "Authentication"),
    option("collaboration", "团队协作", "Team collaboration"),
    option("file-management", "文件管理", "File management"),
    option("product-showcase", "产品展示", "Product showcases"),
    option("storytelling", "互动叙事", "Interactive storytelling"),
    option("error-recovery", "错误提示", "Error messages"),
  ],
};

/** Explicit editorial assignment: one main job per component, independent of its appearance. */
const SUBTYPE_BY_SLUG: Record<string, string> = {
  "orbit-not-found": "error-page",
  "tactile-push-button": "buttons", "folded-emoji-scroll": "pickers-sliders",
  "galaxy-effort-slider": "pickers-sliders", "reasoning-effort-slider": "pickers-sliders",
  "deep-agent-composer": "chat-input", "otp-verification": "verification-input",
  "fluid-tooltip": "tooltips", "soft-action-wheel": "menus-navigation",
  "staggered-radial-menu": "menus-navigation", "glass-tab-menu": "menus-navigation",
  "sailing-toc": "menus-navigation", "collection-layout-morph": "layout-switching",
  "bounding-box-resize": "resize-drag", "elastic-panel-resize": "resize-drag", "velocity-drag": "resize-drag",
  "shader-flood": "cards-galleries", "ai-brand-cover-cards": "cards-galleries",
  "brand-poster-cards": "cards-galleries", "crumpled-paper": "cards-galleries",
  "gradient-cover-wall": "cards-galleries", "brand-line-cards": "cards-galleries",
  "ink-spread-carousel": "carousels", "gradient-ring-cards": "carousels",
  "album-cover-tunnel": "media-player", "spider-music-player": "media-player",
  "stacked-metadata": "metadata-lists",
  "selection-flower": "text-selection", "notes-text-color": "text-selection", "inline-text-morph": "text-morph",
  "transfer-glow": "confirmation", "thinking-particles": "loading-progress", "ai-generating": "loading-progress",
  "glass-folder": "file-display", "share-invite": "sharing-permissions", "bouncy-access": "sharing-permissions",
  "ascii-sharks": "animated-backgrounds", "particle-texture-trio": "animated-backgrounds",
  "dot-matrix-trio": "animated-backgrounds", "blue-fluted-glass": "animated-backgrounds",
  "cosmic-panels": "animated-backgrounds", "glyph-rain": "animated-backgrounds",
  asciify: "cursor-effects", frost: "cursor-effects", glass: "cursor-effects", "particle-scroll": "scroll-effects",
  "multi-cursor-builder": "hero-sequences", "matcha-powder-reveal": "hero-sequences",
  "ascii-object": "model-showcase", "glass-object": "model-showcase",
  "particle-object": "model-showcase", "liquid-object": "model-showcase",
  "hammerhead-chart": "charts",
};

// Only synonyms/closely equivalent visual descriptions are folded together.
// Structural and implementation terms (cards, canvas, shader...) remain searchable,
// but are deliberately not presented as visual styles.
const VISUAL_ALIASES: Record<string, string> = {
  "dot-matrix": "dots", noise: "grain", bloom: "glow", fluid: "liquid",
  portrait: "photography", artwork: "illustration", silver: "metallic", foil: "metallic",
  typographic: "typography", spring: "elastic", pills: "capsule", overlap: "layered",
  emoji: "stickers", chromatic: "colorful", print: "editorial",
};

/** Curated use-case topics can span multiple main classes. */
const SCENE_SLUGS: Record<string, string[]> = {
  "app-ui": ["tactile-push-button", "stacked-metadata", "transfer-glow", "folded-emoji-scroll", "fluid-tooltip", "collection-layout-morph", "soft-action-wheel", "staggered-radial-menu", "elastic-panel-resize", "glass-tab-menu", "otp-verification", "share-invite", "bouncy-access", "velocity-drag"],
  "ai-interface": ["galaxy-effort-slider", "reasoning-effort-slider", "deep-agent-composer", "thinking-particles", "ai-generating"],
  "brand-showcase": ["ai-brand-cover-cards", "brand-poster-cards", "brand-line-cards", "dot-matrix-trio", "particle-texture-trio", "blue-fluted-glass", "cosmic-panels", "ascii-object", "glass-object", "particle-object", "liquid-object", "inline-text-morph"],
  "portfolio-gallery": ["album-cover-tunnel", "ink-spread-carousel", "gradient-ring-cards", "collection-layout-morph", "brand-poster-cards", "selection-flower", "crumpled-paper", "glass-folder", "gradient-cover-wall"],
  "reading-writing": ["selection-flower", "notes-text-color", "inline-text-morph", "sailing-toc", "crumpled-paper"],
  "editor-workspace": ["multi-cursor-builder", "stacked-metadata", "notes-text-color", "bounding-box-resize", "soft-action-wheel", "staggered-radial-menu", "elastic-panel-resize", "velocity-drag"],
  authentication: ["otp-verification"], collaboration: ["share-invite", "bouncy-access"],
  "file-management": ["glass-folder"],
  "product-showcase": ["matcha-powder-reveal", "shader-flood", "ai-brand-cover-cards", "ascii-object", "glass-object", "particle-object", "liquid-object", "spider-music-player"],
  storytelling: ["multi-cursor-builder", "matcha-powder-reveal", "album-cover-tunnel", "ascii-sharks", "particle-scroll", "hammerhead-chart", "asciify", "frost", "glass", "glyph-rain"],
  "error-recovery": ["orbit-not-found"],
};

const CANVAS_SEARCH_NAMES: Record<string, string> = {
  "ascii-object": "ASCII 物体", asciify: "字符透镜", frost: "冰霜", glass: "玻璃透镜",
  "glass-object": "玻璃物体", "glyph-rain": "字符雨", "particle-object": "粒子物体",
  "particle-scroll": "粒子滚动", "liquid-object": "流体物体 液态物体", "orbit-not-found": "组件环游 404",
};
const visualIds = new Set(ATLAS_FACETS.visual.map(({ id }) => id));
const interactionIds = new Set(ATLAS_FACETS.interaction.map(({ id }) => id));
const categoriesById = new Map(ATLAS_FACETS.category.map((facet) => [facet.id, facet]));
const frameworks = ["react", "vue", "svelte", "solid", "preact", "vanilla"];
const unique = (values: string[]) => [...new Set(values)];

export const ATLAS_ITEMS: AtlasItem[] = COMPONENT_CATALOG.map((entry) => {
  const slug = entry.href.split("/").filter(Boolean).at(-1)!;
  const discovery = AI_DISCOVERY[slug];
  const subtype = SUBTYPE_BY_SLUG[slug];
  const main = categoriesById.get(subtype)?.parent;
  if (!main) throw new Error(`Missing atlas category for ${slug}`);
  if (!discovery && slug !== "orbit-not-found") throw new Error(`Missing discovery metadata for ${slug}`);
  const category = [main, subtype];
  const visual = unique((discovery?.visualTags ?? []).map((id) => VISUAL_ALIASES[id] ?? id).filter((id) => visualIds.has(id)));
  // Orbit's docs explicitly describe hover, Tab focus and following a card link.
  // The nine Canvas entries retain only their discovery-declared interactions.
  const interaction = unique((discovery?.interactions ?? ["hover", "focus", "click", "keyboard"]).filter((id) => interactionIds.has(id)));
  const framework = slug === "orbit-not-found" ? ["nextjs"] : entry.kind === "interaction" ? [...frameworks] : ["unknown"];
  const scene = Object.entries(SCENE_SLUGS).filter(([, slugs]) => slugs.includes(slug)).map(([id]) => id);
  const facets = { category, visual, interaction, framework, scene };
  const facetWords = (Object.keys(facets) as FilterDimension[]).flatMap((dimension) =>
    ATLAS_FACETS[dimension].filter((facet) => facets[dimension].includes(facet.id)).flatMap((facet) => [facet.id, facet.label.zh, facet.label.en]));
  const searchText = [slug, entry.name, interactionTranslations[entry.name] ?? "", entry.description, CANVAS_SEARCH_NAMES[slug] ?? "",
    ...(entry.kind === "interaction" ? [entry.category, entry.keywords] : []),
    discovery?.category ?? "", ...(discovery?.useCases ?? []), ...(discovery?.searchTerms ?? []),
    ...(discovery?.visualTags ?? []), ...facetWords,
  ].join(" ").normalize("NFKC").toLowerCase();
  return { slug, href: entry.href, name: entry.name, description: entry.description, ...facets, searchText };
});
