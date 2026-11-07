import siteAssets from '@/data/site-motion.json';
import { publicPath } from '@/lib/site-url';
const FONT_STYLESHEET_ID = "leibox-chinese-fonts";
const FONT_STYLESHEET_URL = publicPath(siteAssets.chineseFontStylesheet);

export function loadChineseFonts(document: Document) {
  if (document.getElementById(FONT_STYLESHEET_ID)) return;
  const link = document.createElement("link");
  link.id = FONT_STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = FONT_STYLESHEET_URL;
  document.head.appendChild(link);
}

// Resolve the saved language before Chinese server-rendered text can request fonts.
// The provider repeats the check after hydration and when switching languages.
export const FONT_BOOTSTRAP_SCRIPT = `(function(){var locale="zh";try{var saved=localStorage.getItem("animuse:locale");if(saved===null){var oldKey="zlui-atlas:locale",previous=localStorage.getItem(oldKey);if(previous==="en"||previous==="zh"){saved=previous;try{localStorage.setItem("animuse:locale",previous);localStorage.removeItem(oldKey);}catch{}}}locale=saved==="en"?"en":"zh";}catch{}document.documentElement.lang=locale==="en"?"en":"zh-CN";document.documentElement.dataset.locale=locale;if(locale==="zh"){var link=document.createElement("link");link.id=${JSON.stringify(FONT_STYLESHEET_ID)};link.rel="stylesheet";link.href=${JSON.stringify(FONT_STYLESHEET_URL)};document.head.appendChild(link);}})();`;
