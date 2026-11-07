# Animuse

**在线访问：[zhaoli2003.github.io/Animuse](https://zhaoli2003.github.io/Animuse/)** · [浏览组件](https://zhaoli2003.github.io/Animuse/components/)

GitHub Pages 从 `main` 的提交自动构建并部署。发布流程设置 `/Animuse` 子路径，生成真实的静态导航文件；本地开发仍可使用根路径。

**animuse** — 由 zhaoli 维护的免费开源 UI 组件图鉴。

在网页中浏览和体验组件，复制接入提示词、下载独立源码，也可以通过 Agent Skill 搜索和使用组件。

## 第一版

经作者授权，以 [LeiBox](https://leibox.pantoria.cn/) 为基础复刻，保留其页面结构、交互和组件效果，并适配 Animuse 品牌。网站纯静态，不需要数据库、账号系统或业务后端，没有邮件投稿功能。

- **53 个组件页面**，保留原站的真实演示、文档和来源说明。
- **43 个组件提供六框架源码包**：React、Vue、Svelte、Solid、Preact、Vanilla，共 258 个包。其余 10 项保留原有预览和上游使用入口，不冒充为六框架代码包。
- 搜索、深浅色主题、中英文切换、复制提示词、复制源码、独立 HTML 下载和 AI 快捷入口。
- 独立 Agent Skill：`animuse`，支持搜索、推荐、查看详情和下载完整源码。
- 53 项统一多维筛选：10 个用途大类及子类型、视觉、交互、框架和应用场景。支持中英文搜索、动态数量、组合筛选、网址分享与浏览器前进后退；详情标签可点击浏览同类组件。

## 本地运行

需要 Node.js 22.18 或更新版本；本次使用 Node.js 24 验证。

```bash
npm ci
npm run build
npm start
```

打开 **http://127.0.0.1:3000**。`npm start` 只托管已生成的静态文件；修改源码后重新构建。日常开发可运行 `npm run dev`。

构建会生成 `out/`，可直接交给任意支持 HTML 深链的静态托管服务。当前只提供本地运行版本，尚未部署公开网站。部署到新域名时，在构建前设置 `NEXT_PUBLIC_SITE_URL`。

## 安装 Skill

```bash
npx skills add zhaoli2003/Animuse --skill animuse
```

Skill 默认从 `https://zhaoli2003.github.io/Animuse` 读取目录。可用 `ANIMUSE_ORIGIN` 环境变量或 `--origin` 指定另一个站点基址，支持项目目录路径。本地开发时先启动网站，再传入 `--origin http://127.0.0.1:3000`。

```bash
node integrations/skills/animuse/scripts/animuse.mjs search "玻璃 文件夹"
node integrations/skills/animuse/scripts/animuse.mjs recommend "图片生成等待" --framework react --limit 3
node integrations/skills/animuse/scripts/animuse.mjs show glass-folder --framework react
node integrations/skills/animuse/scripts/animuse.mjs pull glass-folder --framework react --out components/glass-folder
```

安装后请按实际安装目录替换脚本路径。下载不会执行代码、安装依赖或覆盖内容不同的已有文件；保留组件的源码声明和设计参考署名。

## 维护与验证

维护者：[zhaoli](https://github.com/zhaoli2003)。个人链接在 `src/lib/brand.ts` 配置；X 和小红书链接尚未配置，不显示占位链接。组件说明与来源在 `src/data/interaction-components.ts` 等目录数据中维护，构建时统一生成网站演示和机器目录。

```bash
npm run typecheck
npm run test:ai
npm run test:delivery
npm run test:performance
npm run test:actions
npm run test:locale
npm run test:filters
npm run test:filters:browser
```

`test:actions`、`test:locale`、`test:filters:browser` 需要先启动本地网站。初版复刻的检查范围与结果见 [验证记录](docs/verification-review.md)。筛选分类集中维护在 `src/data/atlas-taxonomy.ts`，筛选规则在 `src/lib/atlas-filters.ts`。

多维筛选的行为、维护位置与检查结果见 [筛选交付记录](docs/multidimensional-filtering.md)。全量目录审计见 [组件分类提案](docs/component-taxonomy-proposal.md)，其统计指参考站调研时的状态，不等同于本项目的运行验证结果。

## 来源与许可

本项目按维护者已取得的 LeiBox 作者许可进行收录与复刻，保留原有来源、版权与许可。基线版本及适配范围见 [UPSTREAM.md](UPSTREAM.md)。

继承或改编代码适用保留的 [LICENSE.md](LICENSE.md)、[COPYRIGHT.md](COPYRIGHT.md) 及各组件原许可。Animuse 独立新增代码适用 [LICENSE-Animuse](LICENSE-Animuse)。公开、免费访问不意味着所有第三方代码与媒体统一采用 MIT；具体使用请查看条目说明。
