# Animuse 公开网站

- 网站：https://zhaoli2003.github.io/Animuse/
- 组件：https://zhaoli2003.github.io/Animuse/components/
- 发布流程：[GitHub Actions run 42395474124](https://github.com/zhaoli2003/Animuse/actions/runs/42395474124)
- 本次发布的产品提交：`de248aea9bb7c7a26abb6fb76759c67b370570c0`。

## 更新与本地运行

`main` 上的代码提交自动触发 `.github/workflows/pages.yml`：Linux / Node.js 24 安装依赖、构建静态网站、检查筛选逻辑、上传并发布 Pages。无需服务器、数据库或密钥配置。

Pages 构建设置：

```text
NEXT_PUBLIC_BASE_PATH=/Animuse
NEXT_PUBLIC_SITE_URL=https://zhaoli2003.github.io/Animuse
```

执行 `npm run build:pages`。输出目录为 `out`，上传时不再额外嵌套 `Animuse` 目录。普通本地运行仍为 `npm run build` 后 `npm start`，地址 `http://127.0.0.1:3000`。

资源请求在展示边界使用 `publicPath()`；Next 导航保留逻辑路由。网站专用动效文档在计算内容哈希前适配内部资源地址。原始 HTML 和框架源码下载保留内容与校验值。Pages 导出步骤将 Next 的嵌套 RSC payload 原字节复制为实际请求的扁平文件，并生成 `.nojekyll`，无需后端重写规则。

Skill 默认从公开站点读取目录，安装：

```sh
npx skills add zhaoli2003/Animuse --skill animuse
```

## 图标

原创小写 a：粗圆角主体、单一内孔、右上斜切。唯一矢量源为 `design/brand/animuse-mark.svg`，`npm run brand:build` 生成 SVG、16/32/48px ICO 和 180/192/512px 安装图标。字体字标保持 Animuse。明暗及小尺寸展示见 `design/brand/animuse-icon-preview.png`。

## 2026-11-08 实际验证

- GitHub Linux 构建、筛选检查及部署均成功。
- 公网浏览器 60/60 项通过，6 张截图；本站 HTTP 错误、路径越界、页面异常及控制台错误均为 0。
- 实测：首页卡片导航；目录玻璃筛选；详情进入和返回保留条件；筛选与详情深链刷新；动态预览、字体、键盘展开及文字选区开花；AI 指南及 43 项机器目录。
- Canvas Glass 页面及兼容回退可用；本轮浏览器未启用原生 html-in-canvas，不把回退结果当作原生折射效果验证。
- AI/Skill 共 23 项通过，包含仅挂载 `/Animuse/` 的严格基址测试。已从公开站点实际拉取玻璃文件夹 React 组件的 4 个源码文件并验证哈希。
- 本地根路径版本重新构建并运行，新品牌资源与本地服务返回一致。

复测命令：

```sh
BASE_URL=https://zhaoli2003.github.io/Animuse node scripts/test-pages-browser.mjs
npm run test:ai
node --test scripts/prepare-pages-export.test.mjs scripts/website-base-path.test.mjs
```
