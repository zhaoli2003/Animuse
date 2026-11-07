# Animuse 品牌资产

2026-11-08 用户确认采用橙紫液态玻璃图标：圆角方形与圆润形态连接，保留虹彩内缘、内部光线和右上像素粒子。

- `animuse-glass-approved.png`：用户确认的设计稿。
- `animuse-glass-master.png`：透明底主图，用于网站标识、较大展示和分享封面。
- `animuse-glass-small.png`：透明底小尺寸版本，去掉粒子和细线，用于浏览器图标。
- `animuse-icon-preview.png`：实际生成资产的浅深背景及 16/32/48px 对照。
- `generation.json`：通过内置图片生成工具制作透明资产的完整提示词和输入关系。

运行 `npm run brand:build` 生成 `public/` 下的组合标识、图标和分享封面，并更新尺寸对照图。生成器只进行尺寸、格式和版式适配；设计修改应从确认的源图衍生，并保留原文件。

PNG 是本版图形制作源。`animuse-mark.svg`、`animuse-logo.svg` 和 `favicon.svg` 是内嵌 PNG 的 SVG 容器，并非重新绘制的纯矢量图；这样可以保留已确认的玻璃与虹彩细节。网站浅深主题只改变字标颜色，不反转彩色图形。资源版本为 `glass-v1`。
