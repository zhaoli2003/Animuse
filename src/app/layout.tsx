import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

import { ThemeFavicon } from "@/components/common/theme-favicon";
import { ThemeProvider } from "@/components/common/theme-provider";
import { UrlStateProvider } from "@/components/common/url-state-provider";
import { LanguageProvider } from "@/components/common/language-provider";
import { LogoTransitionProvider } from "@/components/common/logo-transition-provider";
import { ComponentEntryTransition } from "@/components/common/component-entry-transition";
import { SITE_URL, publicPath, siteUrl } from "@/lib/site-url";
import { FONT_BOOTSTRAP_SCRIPT } from "@/lib/site-fonts";
const DESCRIPTION =
  "Animuse is a personal collection of UI inspiration, interaction experiments and design references for learning and research.";


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Animuse — 免费 UI 组件图鉴",
    template: "%s | Animuse",
  },
  description: DESCRIPTION,
  applicationName: "Animuse",
  authors: [{ name: "zhaoli", url: "https://github.com/zhaoli2003" }],
  creator: "Animuse",
  keywords: [
    "component library",
    "react component library",
    "vue component library",
    "svelte component library",
    "webgl component library",
    "webgpu component library",
    "webgpu components",
    "vgpu",
    "wgsl shaders",
    "canvas components",
    "ui components",
    "canvas",
    "webgl",
    "webgpu",
    "html-in-canvas",
    "creative ui",
    "shader effects",
    "web animations",
    "react",
    "vue",
    "svelte",
    "shadcn registry",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Animuse",
    locale: "zh_CN",
    images: [{ url: siteUrl("/animuse-og.png?v=glass-v1"), width: 1200, height: 630, alt: "Animuse" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [siteUrl("/animuse-og.png?v=glass-v1")],
  },
  icons: {
    icon: [{ url: publicPath("/favicon.svg?v=glass-v1"), type: "image/svg+xml" }],
    shortcut: publicPath("/favicon.ico?v=glass-v1"),
    apple: [{ url: publicPath("/apple-touch-icon.png?v=glass-v1"), sizes: "180x180" }],
  },
  manifest: publicPath("/site.webmanifest?v=glass-v1"),
  other: {
    "font-attribution": "Chinese typeface: MiSans VF by Xiaomi. https://hyperos.mi.com/font/zh/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: FONT_BOOTSTRAP_SCRIPT }} />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-css-tags -- Font fallback when the locale bootstrap cannot run. */}
          <link rel="stylesheet" href={publicPath("/fonts/misans.css")} />
        </noscript>
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>
          <ThemeFavicon />
          <LanguageProvider><UrlStateProvider><LogoTransitionProvider><ComponentEntryTransition>{children}</ComponentEntryTransition></LogoTransitionProvider></UrlStateProvider></LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
