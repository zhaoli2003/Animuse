# 当前全部分类与标签分析（2026-11-07）

> 更名前历史分析：项目现名为 **Animuse**。下文的 ZLUIAtlas、提交与统计指 2026-11-07 的实际分析对象，保留原始记录，不代表当前品牌或筛选状态。

> 实施更新：2026-11-08 已完成网页多维筛选，见 [交付记录](multidimensional-filtering.md)。下文保留实施前的逐项统计与分类依据。

> 范围：当前 ZLUIAtlas 本地源码与已构建的 53 个组件详情页。本文是分类建议，不修改页面或检索行为。统计基于本地代码提交 91a22ac；原始提取结果另存 current-classification-audit.json。

## 结论

已有分类信息值得复用，但三套信息尚未统一：详情页的小标签、网站目录条目、供 AI 使用的 discovery 字段。详情标签是普通 span，目前不能点击筛选；侧栏与组件页都按一个 53 项列表展示。建议以用途/组件类型组织浏览，再用视觉、触发方式和应用场景跨组检索，技术信息放到更多筛选和接入区。

需要纠正此前对覆盖率的简化说法：43 是公开 Skill 目录导出的组件数；当前本地 AI_DISCOVERY 已有 52 项，其中包含 9 个 Canvas 效果，只有 orbit-not-found 没有该结构。此前的参考站审计记录的是对外接口，不代表本地源文件只有 43 条标注。

## 1. 现有数据有多少

| 层次 | 实际数量 | 当前作用 |
| --- | --- | --- |
| 网站组件 | 53 | 43 个源码包组件 + 9 个 Canvas 效果 + 1 个 404 模板 |
| 详情页可见标签 | 36 种 | 功能、动效、语言、依赖、来源混合展示 |
| 显示用 category | 27 种、覆盖 44 个条目 | 43 个组件及 404 模板；另外 9 项主要展示技术标签 |
| 本地 AI_DISCOVERY | 52 项、14 类用途 | useCases、visualTags、interactions 等已存在 |
| 视觉标签 | 69 种，其中 48 种仅出现一次 | 需要同义词归并与语义分层 |
| 交互标记 | 16 种 | 混有触发动作、播放控制与输入方式 |
| 对外 Skill 搜索目录 | 43 项 | 构建脚本只遍历 INTERACTION_COMPONENTS；不是全部 discovery 标注 |

### 全部 36 种可见标签

次数仅代表当前详情页面显示该标签，不代表实际技术支持数量。例如 GSAP 只显示 3 次，不能据此说只有 3 个组件使用 GSAP。

| 当前标签 | 页面数 | 建议归属 / 处理 |
| --- | ---: | --- |
| 六框架 | 43 | 框架支持摘要 |
| TypeScript | 43 | 编程语言 |
| 画布交互 | 7 | 拆到实际用途；“Canvas”只在源码证据充分时进入技术字段 |
| 面板形变 | 6 | 保留为动效标签“形变/展开收起”；用途按输入、导航、文件、协作拆分 |
| 拖拽与聚焦 | 5 | 拆为拖拽触发和键盘焦点支持；组件类型分别是滑块、缩放控件、日历 |
| html-in-canvas | 5 | 渲染能力/浏览器条件 |
| 3D | 4 | 视觉空间特征 |
| three.js | 4 | 实现依赖 |
| webgl | 4 | 渲染技术 |
| GSAP | 3 | 动画依赖 |
| 菜单交互 | 2 | 导航 → 菜单；触发动作另外记录 |
| 文字选区 | 2 | 文字与排版 → 文字选区；交互记录文字选择 |
| 按钮交互 | 1 | 输入与选择 → 按钮 |
| 布局切换 | 1 | 导航与布局 → 布局切换；动效记录形变 |
| 弹窗转场 | 1 | 反馈与状态 → 确认反馈；形态为弹窗，动效为转场 |
| 点阵动效 | 1 | 视觉 → 点阵；用途仍按背景/加载等区分 |
| 滚动导航 | 1 | 导航与布局 → 目录；交互 → 滚动跟随 |
| 滚动动效 | 1 | 交互 → 滚动驱动；用途按首屏演示等区分 |
| 滚动交互 | 1 | 交互 → 滚动；组件类型按选择器等区分 |
| 加载反馈 | 1 | 反馈与状态 → 加载 |
| 雷师傅原创 | 1 | 作者与来源声明 |
| 立体轮播 | 1 | 卡片、列表与媒体 → 轮播；视觉 → 立体 |
| 粒子动效 | 1 | 视觉 → 粒子；具体用途另外记录 |
| 粒子转场 | 1 | 视觉 → 粒子；动效 → 消散/揭示 |
| 列表交互 | 1 | 卡片、列表与媒体 → 列表与元数据 |
| 品牌卡片 | 1 | 卡片、列表与媒体 → 卡片；应用场景 → 品牌展示 |
| 品牌排版 | 1 | 卡片、列表与媒体 → 海报；应用场景 → 品牌展示 |
| 三维交互 | 1 | 视觉 → 立体；用途按模型/媒体展示区分 |
| 提示交互 | 1 | 导航与布局 → 提示气泡 |
| 图片切换 | 1 | 卡片、列表与媒体 → 图片轮播；动效 → 图片转场 |
| 文字交互 | 1 | 文字与排版；再按选区、编辑、标题细分 |
| 页面模板 | 1 | 页面模板 → 404 / 错误页 |
| 音乐交互 | 1 | 卡片、列表与媒体 → 音乐播放器 |
| 着色器交互 | 1 | 技术 → Shader（核对实际实现）；用途按卡片等区分 |
| 字符动画 | 1 | 视觉 → ASCII / 字符；用途按背景、模型等区分 |
| Next.js | 1 | 框架 |

### 本地已有 14 类用途

| 原始值 | 组件数 |
| --- | ---: |
| cards | 8 |
| background | 6 |
| hero | 6 |
| input | 6 |
| navigation | 6 |
| layout | 4 |
| cursor | 3 |
| feedback | 3 |
| text | 3 |
| collaboration | 2 |
| media | 2 |
| data | 1 |
| files | 1 |
| scroll | 1 |

## 2. 建议的主浏览分组

以下是建议归档，不是当前页面已实施的分类。每个组件先确定一个主归档用于侧栏、面包屑和去重计数；用途、场景、视觉与交互都允许多个标签，跨组搜索不会受主归档限制。子分类数量还少时直接显示组件，不必制造多层空目录。

| 建议主分组 | 数量 | 包含的全部组件 |
| --- | ---: | --- |
| 输入与选择 | 6 | 立体按压按钮、折边滚动表情选择器、脑形滑块粒子增强、模型思考强度滑块、Agent 对话输入框、验证码输入验证 |
| 导航与布局 | 9 | 流体提示气泡、列表卡片堆叠切换、选框拖拽缩放、柔光环形菜单展开、环形菜单交错展开、弹性面板缩放、玻璃标签栏展开菜单、帆船滚动目录、日历惯性拖拽 |
| 卡片、列表与媒体 | 11 | 专辑封面隧道、标签叠放展开、液体注入卡片、墨水扩散图片轮播、AI 品牌封面三联卡片、渐变卡片环形轮播、蜘蛛牵引切歌、品牌海报三联卡片、揉皱纸张展开、渐变卡片跟随、鼠标感应线条 |
| 文字与排版 | 3 | 文字选区开花、内联词组变形、文字选区调色器 |
| 反馈与状态 | 3 | 转账光雾确认、思考步骤粒子变形、点阵加载 |
| 文件与协作 | 3 | 玻璃文件夹展开、分享邀请面板、访问申请展开 |
| 背景与页面特效 | 10 | 字符鲨鱼与鱼群、粒子纹理三联、点阵波纹与旋涡、蓝色棱纹流动背景、轨道与点阵动效、字符透镜、冰霜、玻璃透镜、字符雨、粒子滚动 |
| 首屏与模型展示 | 6 | 多光标页面搭建、包装撕开粒子消散、ASCII 物体、玻璃物体、粒子物体、流体物体 |
| 数据展示 | 1 | 字符鲨鱼追踪价格路径 |
| 页面模板 | 1 | 组件环游 404 |

主要迁移：将“标签叠放展开”从现有 navigation 移到列表与元数据；把 layout 与 navigation 作为一个浏览大组、内部仍分导航/布局；cursor、scroll 与 background 归到“背景与页面特效”的不同子类；将 hero 展示为“首屏与模型展示”。“品牌展示”“AI 界面”“作品集”“编辑器”等是跨分类场景，不能作为与卡片、输入框并列且互斥的组件类型。

## 3. 筛选维度与标签整理

| 用户可见维度 | 内容 | 展示位置 |
| --- | --- | --- |
| 用途 / 组件类型 | 上述主分组及按钮、菜单、轮播、选区、加载等子类型 | 侧栏或目录首层 |
| 视觉与材质 | 玻璃、流体、粒子、点阵、ASCII、纸张、立体、极简等；内部可分材质/图形/风格 | 常用筛选，允许多选 |
| 交互与动效 | 点击、悬停、拖拽、滚动、指针跟随、文字选择；动效可细分展开、形变、揭示、消散 | 常用筛选，触发与动效分别存储 |
| 应用场景 | AI 界面、作品集、品牌展示、阅读、编辑器、文件管理等 | 专题入口或更多标签；可跨多个主组 |
| 技术与接入 | 框架、语言、渲染、依赖、交付方式、浏览器条件 | 更多筛选与详情接入区 |
| 来源 | 作者、提供方、设计参考、许可说明 | 详情来源区；需要时作为高级筛选 |

不要将全部 69 个 visualTags 原样摆成标签墙。建议保留原值用于搜索追溯，再维护标准标签及别名：

- typographic / typography → 文字排版；fluid / liquid 可共用“流体”检索入口，但保留具体材质与动效描述。
- dots / dot-matrix → 点阵家族；particles → 粒子，粒子与点阵保留区别。
- glass / refraction / translucent 具有相关性，但不是同义词，分别对应材质、光学效果、透明属性。
- spring / elastic 属于动效表现，不属于视觉材质；click / hover / drag 是触发方式，另存。
- cards / list / dialog / chart / navigation / editor / emoji 移到组件类型或场景；canvas / shader 移到技术字段。
- blue / green / silver / dark / light / monochrome 放到配色或主题字段；默认演示颜色不等于只能用于该色系。
- botanical / spider / nautical / cosmic 等保留为题材搜索词，组件少时不各自占一个筛选栏。
- keyboard / touch 是输入支持声明；focus 是触发/焦点状态；pause / play / replay / seek 是播放能力。这些都不应全部和点击、拖拽平铺在同一级。

## 4. 用户截图的具体调整示例

“文字选区开花”当前是：文字选区 / 六框架 / TypeScript。建议标题下优先显示“文字选区 · 花卉插画 · 选择触发”，面包屑归为“文字与排版 → 文字选区”。“六框架 / TypeScript”继续保留在接入信息；框架筛选应使用已有的具体框架列表。

| 维度 | 建议值 | 依据 |
| --- | --- | --- |
| 主归档 | 文字与排版 → 文字选区 | 当前 category 与 discovery.category |
| 视觉 | 花卉、插画 | 已有 botanical / illustration |
| 交互 | 文字选择 | 已有 text-selection；补充清楚松手回收行为 |
| 输入支持 | 键盘 | 已有 keyboard 标记，不等于全面无障碍认证 |
| 场景 | 文章阅读、创意作品集 | 已有 useCases，中文归一化建议 |
| 接入 | React / Vue / Svelte / Solid / Preact / Vanilla；TypeScript | 当前源码包与页面声明 |

“玻璃文件夹”则归入文件与协作，附加玻璃、扇形展开、点击/悬停、作品集标签；“粒子物体”归入首屏与模型展示，附加粒子、立体、指针互动、品牌展示标签。这样能同时支持“找文件控件”和“找玻璃效果”两种寻找路径。

## 5. 页面组织与数据维护

1. 左侧 53 项长列表改成上述可展开的主分组；目录页保留视觉卡片。
2. 顶部先放搜索、用途、视觉、交互；框架等收进更多筛选，避免技术条件压过视觉浏览。
3. 同一维度多选取并集，不同维度取交集；父级包含全部子类，数量按 slug 去重。已选条件可单独取消，空结果提示放宽具体条件。
4. 详情标签可点击，跳回目录并保留相应筛选；筛选写入 URL，便于分享和返回。
5. 网站标签、筛选、Skill 读取同一份组件记录；浏览器能搜索到、但无本站源码包的条目应明确返回原有使用入口，不能伪装成本站可下载包。
6. 先统一当前 52 项标注并补齐 404，再清理近义词与混放字段。GSAP、WebGL、手机支持等按实际证据补齐，不从名字或标签缺失反推。

## 6. 全部 53 个组件逐项对照

下表最后两列是现有本地 discovery 原值；主归档列是本次建议。

| 组件 | 当前页面标签 | 现有用途 | 建议主归档 | 当前视觉标签 | 当前交互标记 |
| --- | --- | --- | --- | --- | --- |
| 组件环游 404 | 页面模板、Next.js、GSAP | 未标注 | 页面模板 | — | — |
| 立体按压按钮 | 按钮交互、六框架、TypeScript | input | 输入与选择 | 3d、silver、gradient | hover、click、keyboard、touch |
| 多光标页面搭建 | 滚动动效、六框架、TypeScript | hero | 首屏与模型展示 | cursors、canvas、typography、scroll | scroll、keyboard、touch、pause、replay |
| 专辑封面隧道 | 三维交互、六框架、TypeScript、雷师傅原创 | media | 卡片、列表与媒体 | 3d、photography、bloom、depth、dark | hover、click、scroll、drag、keyboard、touch、pause |
| 标签叠放展开 | 列表交互、六框架、TypeScript | navigation | 卡片、列表与媒体 | pills、overlap、list、dark | hover、focus、click、keyboard、touch |
| 转账光雾确认 | 弹窗转场、六框架、TypeScript | feedback | 反馈与状态 | glow、particles、blur、dialog | click、keyboard、touch |
| 液体注入卡片 | 着色器交互、六框架、TypeScript | cards | 卡片、列表与媒体 | liquid、marble、shader、cards | hover、focus、click、keyboard、touch |
| 字符鲨鱼与鱼群 | 字符动画、六框架、TypeScript | background | 背景与页面特效 | ascii、grid、light | hover、click、keyboard、touch |
| 墨水扩散图片轮播 | 图片切换、六框架、TypeScript | cards | 卡片、列表与媒体 | image、ink、refraction | click、keyboard、touch |
| 粒子纹理三联 | 粒子动效、六框架、TypeScript | background | 背景与页面特效 | particles、dark、noise、dot-matrix | play、pause、keyboard、touch |
| 包装撕开粒子消散 | 粒子转场、六框架、TypeScript | hero | 首屏与模型展示 | 3d、foil、particles、green | play、pause、seek、drag、keyboard |
| AI 品牌封面三联卡片 | 品牌卡片、六框架、TypeScript | cards | 卡片、列表与媒体 | portrait、artwork、brand | hover、click、keyboard |
| 折边滚动表情选择器 | 滚动交互、六框架、TypeScript | input | 输入与选择 | dark、folded、canvas、emoji | scroll、search、click、keyboard、touch |
| 渐变卡片环形轮播 | 立体轮播、六框架、TypeScript | cards | 卡片、列表与媒体 | gradient、3d、particles、chromatic | drag、keyboard、click、pause |
| 流体提示气泡 | 提示交互、六框架、TypeScript | navigation | 导航与布局 | fluid、capsule、navigation | hover、focus、click、keyboard |
| 蜘蛛牵引切歌 | 音乐交互、六框架、TypeScript | media | 卡片、列表与媒体 | photography、tactile、spider | click、keyboard、input |
| 列表卡片堆叠切换 | 布局切换、六框架、TypeScript | layout | 导航与布局 | cards | click、keyboard |
| 品牌海报三联卡片 | 品牌排版、六框架、TypeScript | cards | 卡片、列表与媒体 | photography、editorial | hover、click、keyboard |
| 点阵波纹与旋涡 | 点阵动效、六框架、TypeScript | background | 背景与页面特效 | dots、print | autoplay、click、keyboard |
| 文字选区开花 | 文字选区、六框架、TypeScript | text | 文字与排版 | botanical、illustration | text-selection、keyboard |
| 内联词组变形 | 文字交互、六框架、TypeScript | text | 文字与排版 | typographic、stickers | click、keyboard |
| 脑形滑块粒子增强 | 拖拽与聚焦、六框架、TypeScript | input | 输入与选择 | particles、cosmic | drag、keyboard |
| 文字选区调色器 | 文字选区、六框架、TypeScript | text | 文字与排版 | glass、minimal | text-selection、click |
| 选框拖拽缩放 | 拖拽与聚焦、六框架、TypeScript | layout | 导航与布局 | minimal、editor | drag、input |
| 柔光环形菜单展开 | 菜单交互、六框架、TypeScript | navigation | 导航与布局 | minimal、monochrome | click、keyboard |
| 环形菜单交错展开 | 菜单交互、六框架、TypeScript | navigation | 导航与布局 | colorful、spring | click、keyboard |
| 弹性面板缩放 | 拖拽与聚焦、六框架、TypeScript | layout | 导航与布局 | minimal、elastic | drag |
| 蓝色棱纹流动背景 | 画布交互、六框架、TypeScript | background | 背景与页面特效 | blue、glass、liquid | autoplay |
| 模型思考强度滑块 | 拖拽与聚焦、六框架、TypeScript | input | 输入与选择 | cosmic、elastic | drag、keyboard |
| Agent 对话输入框 | 面板形变、六框架、TypeScript | input | 输入与选择 | product、compact | input、click、keyboard |
| 字符鲨鱼追踪价格路径 | 画布交互、六框架、TypeScript | data | 数据展示 | ascii、chart | pointer、autoplay |
| 玻璃标签栏展开菜单 | 面板形变、六框架、TypeScript | navigation | 导航与布局 | glass、minimal | click、keyboard |
| 揉皱纸张展开 | 画布交互、六框架、TypeScript | cards | 卡片、列表与媒体 | paper、tactile | hover |
| 帆船滚动目录 | 滚动导航、六框架、TypeScript | navigation | 导航与布局 | nautical、minimal | scroll、click |
| 思考步骤粒子变形 | 画布交互、六框架、TypeScript | feedback | 反馈与状态 | particles | autoplay、click |
| 玻璃文件夹展开 | 面板形变、六框架、TypeScript | files | 文件与协作 | glass、cards | hover、click、keyboard |
| 轨道与点阵动效 | 画布交互、六框架、TypeScript | background | 背景与页面特效 | cosmic、dots | autoplay |
| 渐变卡片跟随 | 画布交互、六框架、TypeScript | cards | 卡片、列表与媒体 | gradient、grain | pointer、autoplay |
| 验证码输入验证 | 面板形变、六框架、TypeScript、GSAP | input | 输入与选择 | minimal、capsule | input、keyboard |
| 鼠标感应线条 | 画布交互、六框架、TypeScript | cards | 卡片、列表与媒体 | line-art、monochrome | pointer |
| 分享邀请面板 | 面板形变、六框架、TypeScript、GSAP | collaboration | 文件与协作 | product、compact | input、click、keyboard |
| 访问申请展开 | 面板形变、六框架、TypeScript | collaboration | 文件与协作 | capsule、spring | click |
| 日历惯性拖拽 | 拖拽与聚焦、六框架、TypeScript | layout | 导航与布局 | elastic、cards | drag |
| 点阵加载 | 加载反馈、六框架、TypeScript | feedback | 反馈与状态 | dots、minimal | autoplay |
| ASCII 物体 | webgl、three.js、3D | hero | 首屏与模型展示 | ascii、3d | pointer |
| 字符透镜 | html-in-canvas | cursor | 背景与页面特效 | ascii | pointer |
| 冰霜 | html-in-canvas | cursor | 背景与页面特效 | ice、translucent | pointer |
| 玻璃透镜 | html-in-canvas | cursor | 背景与页面特效 | glass、refraction | pointer |
| 玻璃物体 | webgl、three.js、3D | hero | 首屏与模型展示 | glass、3d | pointer |
| 字符雨 | html-in-canvas | background | 背景与页面特效 | ascii、cyber | pointer、autoplay |
| 粒子物体 | webgl、three.js、3D | hero | 首屏与模型展示 | particles、3d | pointer |
| 粒子滚动 | html-in-canvas | scroll | 背景与页面特效 | particles | scroll |
| 流体物体 | webgl、three.js、3D | hero | 首屏与模型展示 | liquid、3d | pointer |

## 7. 证据位置

- `src/lib/motion-doc-layout.ts`：43 个动效组件使用的标签生成方式；两个专用文档额外加入 GSAP。
- `src/components/docs/component-doc-chrome.tsx`：详情标签渲染为 span，没有筛选跳转。
- `src/data/interaction-components.ts`、`interaction-previews.ts`、`components.ts`、`component-catalog.ts`：展示条目与 category。
- `src/data/ai-discovery.ts`：52 项本地用途、视觉、交互及场景标注。
- `scripts/build-ai-catalog.mts`：仅遍历 43 项 INTERACTION_COMPONENTS 生成对外 Skill 目录。
- `src/components/docs/docs-sidebar.tsx`、`src/app/(shell)/components/page.tsx`：全部组件目前作为平铺列表显示。
- `out/docs/**/*.html`：本轮逐页提取的当前可见标签。统计输出见 `current-classification-audit.json`。
