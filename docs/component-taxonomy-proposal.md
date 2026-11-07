# ZLUIAtlas：参考组件全量审计与多维分类方案

> 本文是后续分类与筛选方案，不表示这些筛选已在 ZLUIAtlas 实现，也不要求本轮复刻改变参考站组织。来源目录、公开组件页和抽查详情于 **2026-11-07 22:34–22:40（Asia/Shanghai）** 实时读取。原始响应、取得时间、SHA-256、全量卡片清单、统计、链接状态与可复算的筛选示例见同目录 `reference-catalog-audit.json`。只检查元数据与地址可访问性，没有执行组件或验证所有框架的运行效果。用户已明确取得作者许可，本轮整体复刻与收录按该授权推进；以下来源字段用于保留溯源信息，不另设审批条件。

## 1. 结论

实时公开 [组件页](https://leibox.pantoria.cn/components) 共 **53 张组件卡片**；AI 搜索索引和 catalog 只有 **43 项，覆盖 81.1%**。差额是 1 个“组件环游 404”页面模板与 9 个 Canvas UI 效果，不能只根据 AI 索引宣称已收录全站。53 项必须作为本次全量范围，43 项结构化标签与另外 10 项文档证据分别记录。

已有 43 项字段足以先设计“用途 + 视觉 + 交互 + 搜索”的组合浏览；另外 10 项要补录，不能继承其余组件的六框架声明。框架、来源、渲染等筛选应明确区分“提供方声明”“从页面文档提取”和“运行验证”。成熟度、性能、移动端和可访问性需要补充证据，不能由名称或空字段推导。

建议保留参考站的视觉浏览体验，将分类能力分两步建设：第一步合并 53 项公开清单与 43 项结构化目录，准确呈现未知值和来源；第二步建立独立、受控的分类词表，把目前混杂的标签拆为用途、视觉风格、材质、配色、交互触发与技术能力。筛选统一采用 **同一维度 OR、不同维度 AND**，所有数量按唯一组件计算。

## 2. 实时来源及校验

| 来源 | 本次结果 | 用途 |
| --- | --- | --- |
| [公开组件页](https://leibox.pantoria.cn/components) | HTTP 200，53 个 `data-component-card` | 全站卡片与侧栏范围的核对基准 |
| [轻量搜索索引](https://leibox.pantoria.cn/ai/search-index.json) | HTTP 200，43 条 | 名称、简介、用途、视觉、交互、框架、渲染、预览及详情路径 |
| [完整目录](https://leibox.pantoria.cn/ai/catalog.json) | HTTP 200，43 条 | 实现来源、设计参考、作者、逐项许可说明、分发声明 |
| [搜索索引 Schema](https://leibox.pantoria.cn/ai/search-index.schema.json) | HTTP 200，schemaVersion 1 | 字段结构、必填项、允许值 |
| [目录引用的 AI 指南](https://leibox.pantoria.cn/ai/README.md) | HTTP 404 | 本次不可用，不将指南正文视作已读取 |
| 全部 43 个 `detailPath` | HEAD 42 个 200，1 个 404 | 地址健康检查，不等于全部详情内容审查 |
| 10 个代表组件详情 | GET 9 个 200，1 个 404 | 读取真实字段、包入口、依赖与用途限制 |
| 10 个未进入 AI 目录的组件文档 | GET 10 个 200 | 记录名称、预览、用途说明、技术标签、API 与真实来源链接 |

搜索索引与完整目录的 revision 完全相同：`cd726a07cd02b0cc360d999cfaad24d5d1d6144cbfae0d0ef71700a2cb51f251`。43 个 slug 均唯一，两份组件集合一致；索引声明总数与实际行数一致；categories、frameworks、visualTags 三组预计算 facets 与逐行重算结果一致。依据本次 Schema 实际使用的全部约束进行本地递归结构校验，未发现结构错误。

`deep-agent-composer` 仍存在于目录，但 [详情 JSON](https://leibox.pantoria.cn/ai/components/deep-agent-composer.json) 在 GET 与 HEAD 中均返回 404。它应保留“目录已收录、详情暂不可用”状态，不能直接标为已移除，也不能把目录中宣称的框架支持变成“源码已验证可下载”。

全站 53 项与 AI 目录按 slug 连接：公共交集 43、仅 UI 存在 10、仅 AI 存在 0；共同组件的文档路径一致。AI 目录的 `classificationPolicy.currentKind` 为 `project-source`，因此它的覆盖范围比网站展示范围更窄。公开页未提供与 AI 相同的 revision，审计为该 HTML 另存取得时间和内容 hash，不能假定它们共享一个发布事务。

## 3. 现有字段的覆盖与辨识度

下表分母 43 均指 **AI 结构化目录子集**；相对于全站 53，类别、视觉、交互、框架等结构化字段覆盖率目前均为 43/53（81.1%）。另外 10 项虽然有文档，不存在这些相同格式的 AI 字段。不要把其“未标注”计数漏掉。

| 维度 | 实时覆盖 | 可直接使用的结论 | 不能推出的结论 |
| --- | --- | --- | --- |
| 主用途 `discovery.category` | 43/43；12 个非空类别 | 每项有且只有一个现有主类 | 单一主类不意味着组件只能用于该场景 |
| 用途短语 `useCases` | 43/43；128 次赋值、127 个不同短语 | 适合搜索召回与卡片推荐理由 | 不适合原样铺成 127 个复选框 |
| 检索词 `searchTerms` | 43/43；389 次赋值、315 个不同词 | 已有中英用途检索基础 | 词频不是热度或使用量 |
| 视觉标签 `visualTags` | 43/43；110 次赋值、66 种 | 可保留原始标签快速筛选 | 标签含风格、颜色、技术、组件类型，语义未统一 |
| 交互 `interactions` | 43/43；117 次赋值、16 种 | 可筛点击、拖拽、滚动等声明 | `keyboard` 不能代表完整无障碍；`touch` 不能代表手机实测通过 |
| 框架 `frameworks` | 6 个框架各 43/43；其余 10 项无此 AI 字段 | 提供方声明这 43 项支持 React/Vue/Svelte/Solid/Preact/Vanilla | 不能说全站 53 项全部支持六框架，也不能说每个包都已安装运行验证 |
| 渲染 `renderers` | 字段 43/43；非空只有 2/43 | 明确声明 WebGL 的 2 项可识别 | 其余 41 项不能归为“纯 CSS”“DOM”或“无需 GPU” |
| 包提供方 `sourceProvider` | 43 项均 `leibox` | AI 目录的包统一由 LeiBox 提供 | 不意味着全站另外 10 项也由同一包接口提供 |
| 来源类型 `source.kind` | 全部 `project-source` | 都按项目源码包分发 | 不是原创 / 参考实现的分类 |
| 设计参考与作者 | 30 项有 x.com 参考地址；13 项无参考地址；35 项作者非空，8 项为空 | 有证据时显示参考链接和作者 | 无参考链接不等于原创；`original: true` 本次只在 1 项明确出现 |

现有主用途的数量是 cards 8、input 6、navigation 6、background 5、layout 4、feedback 3、text 3、collaboration 2、hero 2、media 2、data 1、files 1。Schema 还允许 `cursor` 和 `scroll`，本次均为 0；不要把 Schema 允许值当作已有组件。

视觉标签中有 **46/66 个标签仅出现 1 次**。出现最多的是 minimal 8、particles 6；3d/cards/dark/glass 各 4；capsule/cosmic/dots/elastic/gradient/photography 各 3。`typographic` 与 `typography` 值相近但未统一；`canvas`、`shader` 是技术词，`scroll` 是触发方式，`cards`、`chart`、`navigation` 更接近功能结构。应保留原值，同时添加可追溯的标准化映射。

交互覆盖：keyboard 29、click 26、hover 10、touch 10、drag 8、autoplay 7、input 5、pause 5、scroll 4、focus 3、pointer 3、play 2、text-selection 2、replay/search/seek 各 1。这些是条目声明的出现次数，多个标签可同时属于同一个组件。

## 4. 抽查详情与实际限制

| 组件 | 详情核实结果 | 对分类与展示的影响 |
| --- | --- | --- |
| [立体按压按钮](https://leibox.pantoria.cn/ai/components/tactile-push-button.json) | 六个框架包入口；Vanilla 无依赖；来源说明为社区提交的 HTML/CSS；没有单独提供许可 | 可标“按压反馈 / 立体”，不能仅凭提供下载标“商业授权已确认” |
| [多光标页面搭建](https://leibox.pantoria.cn/ai/components/multi-cursor-builder.json) | 六框架入口；来源描述 DOM/Canvas2D；内层滚动演示 | 归首屏演示，也可推荐给协作产品展示；不能称为真实多人编辑器 |
| [专辑封面隧道](https://leibox.pantoria.cn/ai/components/album-cover-tunnel.json) | `renderers: [webgl]`；六框架包均声明 `three@0.185.1`；默认封面为演示内容 | 区分原创交互与图片权利；支持替换素材不等于默认素材可任意使用 |
| [液体注入卡片](https://leibox.pantoria.cn/ai/components/shader-flood.json) | 声明 WebGL1 与 Canvas2D fallback；六框架入口；Vanilla 无外部依赖 | “无额外 npm 依赖”与“纯 CSS”是不同字段 |
| [墨水扩散图片轮播](https://leibox.pantoria.cn/ai/components/ink-spread-carousel.json) | `renderers` 为空，来源文本声明 WebGL1 shader 和 Canvas2D fallback | 建立元数据待核查项，不把它错误放进 DOM-only 筛选 |
| [包装撕开粒子消散](https://leibox.pantoria.cn/ai/components/matcha-powder-reveal.json) | `renderers` 为空；六框架包声明 `three@0.185.1`；产品演示无真实购买/上传功能 | 技术字段不完整；按“产品展示”用途检索，业务能力需另行说明 |
| [蓝色棱纹流动背景](https://leibox.pantoria.cn/ai/components/blue-fluted-glass.json) | `renderers` 为空，来源文本明确 WebGL | 渲染空值是未知；视觉可标蓝色/玻璃/流动 |
| [分享邀请面板](https://leibox.pantoria.cn/ai/components/share-invite.json) | 六框架包入口；依赖 `gsap@3.12.7`；邀请发送与权限变更需业务接口 | 分类可为协作/邀请；详情要分清动画交互与真实邀请能力 |
| [字符鲨鱼与鱼群](https://leibox.pantoria.cn/ai/components/ascii-sharks.json) | 来源文本记录 MIT 上游仓库及固定提交；六框架入口；语音输入需调用方回调 | “包提供方 LeiBox”与“上游代码来源”必须分别存储 |
| Agent 对话输入框 | 目录有该条目，详情 JSON 404 | 卡片保留来源记录和状态；不能给出未经确认的下载按钮 |

另一个未完整读取详情的 `gradient-ring-cards`，目录来源文本也写有 Three.js/Canvas/GSAP，但 `renderers` 为空。与上面三项合计，发现 **4 项明确的技术描述与结构化渲染字段不一致**。这些发现基于提供方元数据，不代替源码或运行时验证。

### 4.1 AI 目录之外的 10 项：全部补查

以下 10 个公开文档本次均可访问。右栏是依据文档形成的分类建议，不是参考站已维护的结构化标签，也不自动应用到本轮复刻。

| slug / 名称 | 当前文档确认的能力与来源 | 后续分类建议 |
| --- | --- | --- |
| [orbit-not-found / 组件环游 404](https://leibox.pantoria.cn/docs/components/orbit-not-found) | 页面模板；Next.js、GSAP；悬停或 Tab 聚焦暂停，卡片可跳转；链接到 LeiBox 的 `src/components/not-found-experiments` | 用途：反馈→404 / 页面模板；视觉：轨道、卡片；交互：autoplay/hover/focus/click/keyboard/pause |
| [ascii-object / ASCII 物体](https://leibox.pantoria.cn/docs/components/ascii-object) | WebGL、Three.js、3D；GLB/glTF/SVG/图片；拖动环绕；链接 Canvas UI 同名文档 | 用途：媒体→三维物体展示；视觉：ASCII、立体；交互：drag；素材：模型/矢量/图片 |
| [asciify / 字符透镜](https://leibox.pantoria.cn/docs/components/asciify) | 标签 html-in-canvas；指针镜片区域重绘为字符；链接 Canvas UI | 用途：光标→页面透镜；视觉：ASCII；交互：pointer |
| [frost / 冰霜](https://leibox.pantoria.cn/docs/components/frost) | 标签 html-in-canvas；指针融冰、移开重新冻结；链接 Canvas UI，另署名 frozen by takuma-hmng8 | 用途：光标→表面反馈；视觉：冰霜、折射；交互：pointer/hover |
| [glass / 玻璃透镜](https://leibox.pantoria.cn/docs/components/glass) | 标签 html-in-canvas；跟随指针，目标元素可触发放大；链接 Canvas UI | 用途：光标→页面透镜；视觉：玻璃、折射；交互：pointer/hover |
| [glass-object / 玻璃物体](https://leibox.pantoria.cn/docs/components/glass-object) | WebGL、Three.js、3D；二维素材可挤出；拖动环绕；链接 Canvas UI | 用途：媒体→三维物体展示；视觉：玻璃、色散、立体；交互：drag |
| [glyph-rain / 字符雨](https://leibox.pantoria.cn/docs/components/glyph-rain) | 标签 html-in-canvas；字符降落并照亮页面；指针可搅动；链接 Canvas UI | 用途：背景→动态覆盖；视觉：字符、发光；交互：autoplay/pointer |
| [particle-object / 粒子物体](https://leibox.pantoria.cn/docs/components/particle-object) | WebGL、Three.js、3D；素材粒子化，指针打散后回弹、拖动环绕；链接 Canvas UI | 用途：媒体→三维物体展示；视觉：粒子、立体；交互：pointer/drag |
| [particle-scroll / 粒子滚动](https://leibox.pantoria.cn/docs/components/particle-scroll) | 标签 html-in-canvas；按滚动位置将内容散开为颗粒并重组；链接 Canvas UI | 用途：滚动→内容转场；视觉：粒子；交互：scroll |
| [liquid-object / 流体物体](https://leibox.pantoria.cn/docs/components/liquid-object) | WebGL、Three.js、3D；指针搅动流体，拖动环绕；API 描述点击/轻触产生 splash；链接 Canvas UI | 用途：媒体→三维物体展示；视觉：流体、色散、立体；交互：pointer/drag/click/touch |

全站来源应拆为 **43 个有 LeiBox AI 包声明的组件、1 个指向 LeiBox 仓库的页面模板、9 个文档指向 Canvas UI 的效果**。这不是代码许可结论，也不是声称 9 个效果缺少本站演示。网站已有本地演示，文档安装/代码区的来源链接与 AI 包接口范围是两回事。

技术方面，全站有 6 项明确标注 WebGL 的证据：AI 字段 2 项，另有公开文档 4 项；另外 5 项文档标注 html-in-canvas，1 项标注 Next.js/GSAP。html-in-canvas 是内容采样/渲染路径标签，不能直接替代底层 WebGL/WebGPU 的判断。仍有 AI 字段为空但实现文字提及 WebGL/Three.js 的 4 项待补齐。

## 5. 建议的分类架构

### 5.1 第一阶段：用现有数据立即建立可靠筛选

| 用户看到的维度 | 数据来源 | 选择方式 | 初始呈现 |
| --- | --- | --- | --- |
| 用途 | `discovery.category` + 有证据的补录项 | 多选，同维 OR | AI 现有 12 个中文类别；另 10 项未补录前显示“未标注”；补录建议会用到 cursor/scroll |
| 视觉效果 | 原始 `visualTags` | 多选，同维 OR | 首先展示高频标签；其余在“更多标签”内搜索 |
| 交互方式 | `interactions` | 多选，同维 OR | 点击、悬停、拖拽、滚动、自动播放等；保留原始代码值 |
| 开发框架 | `frameworks` + 文档补录 | 多选，同维 OR | 六框架各 43 个索引声明；404 另有 Next.js 文档声明；其余保持未知 |
| 渲染技术 | 原始 `renderers` + 证据层 | 多选，同维 OR | 单看 AI 为 WebGL 2/未标注 41；合并公开文档后 WebGL 声明可到 6，必须显示证据口径 |
| 来源 | 包提供方与上游文档来源分栏 | 多选，同维 OR | LeiBox 包43 / LeiBox仓库模板1 / Canvas UI文档效果9；不混成单一原创作者字段 |

搜索覆盖中英名、slug、摘要、用途短语、检索词和已发布标准标签。只做索引的可解释匹配：名称完整匹配优先、名称前缀其次、名称包含再次，然后是用途和描述；多个明确关键词采用 AND，词内同义词扩展采用 OR。中文按维护的词表与子串匹配，避免仅按空格分词。不要把排序分数称作质量评分。

一级用途面向“我在做哪一块页面”：首屏/背景、导航、输入控件、卡片展示、布局、文字、反馈状态、媒体、数据、文件、协作，再纳入本次补查所需的光标效果、滚动转场。可把“首屏”和“背景”在视觉导航上归为同一大组，但底层仍保留两个原有类别，父级数量按去重后的子类并集生成。选择父级即选择它的全部叶子类，父级显示半选状态；不要同时存父子选择而重复计数。

### 5.2 第二阶段：受控词表与场景层

建议逐条人工标注以下字段；它们是 ZLUIAtlas 的新增提案，不是参考目录现有能力：

| 新增维度 | 候选值或分组 | 归属依据 |
| --- | --- | --- |
| 二级用途 `purposePaths` | 输入→按钮/滑块/验证码/对话输入/表情选择；导航→菜单/提示/目录；展示→轮播/海报/图片墙；反馈→加载/进度/确认 | 原始主类、用法、实际交互共同判断；允许多个叶子用途 |
| 产品场景 `scenarios` | AI 对话、生成等待、内容阅读、作品展示、团队邀请、文件管理、编辑器、产品发布 | 先维护少量可复用词，不能从 127 条用途短语一键扩展 127 个场景 |
| 风格 `appearance.styles` | 极简、排版、编辑感、ASCII、摄影、插画 | 将近义标签映射到稳定 ID；原始值另存 |
| 材质与效果 `appearance.materials` | 玻璃、纸张、金属箔、液体、墨水、颗粒、发光、折射 | 描述观察到的视觉效果，不与技术实现等同 |
| 色调 `appearance.palettes` | 明亮、深色、单色、多彩、蓝、绿、银、渐变 | 深色配色不等于支持主题切换；用独立 `themeSupport` 记录切换能力 |
| 空间与构图 `appearance.forms` | 平面、立体、堆叠、环形、点阵、网格、胶囊 | 例如 CSS 立体按钮可为“立体”，无需被归为 WebGL |
| 交互触发 `behavior.triggers` | click/hover/drag/scroll/input/text-selection/focus/pointer/autoplay | 从现有字段迁移，保留观察证据 |
| 控制与能力 `behavior.controls` | pause/play/seek/replay/search | 与触发方式分离；keyboard/touch 进入输入支持字段 |
| 输入支持 `inputSupport` | pointer/keyboard/touch | 每种为 declared/verified/unsupported/unknown，不用布尔值混淆未检查和不支持 |
| 渲染方式 `implementation.renderers` | DOM/CSS、SVG、Canvas2D、WebGL、WebGPU | 查实际包或运行证据后标注；允许多值、fallback 与 unknown |
| 集成条件 `integration` | 额外依赖、是否需业务接口、资产可替换、卸载清理、受控参数、SSR 限制 | 逐框架记录；没有事实则 unknown，不给“轻量”“开箱即用”评分 |
| 来源与权利 `provenance` | 包提供方、实现作者、设计参考作者、上游代码、媒体资产、许可说明 | 分开记录事实，不把下载可用与授权范围合并 |

同一维度多选仍为 OR；拆分为风格、材质、配色后，用户选择“极简 + 玻璃”即可通过跨维 AND 精确组合。旧的原始“视觉效果”维度如果同时选 `glass` 和 `minimal`，其含义始终是“玻璃或极简”，不暗中改变语义。可在筛选面板短注“组内任一，组间同时满足”。

标签治理建议：`typographic`/`typography` 可以提出同义映射，`dots`/`dot-matrix` 是否合并要复核效果；`spring`/`elastic` 关联但未必同义。不要根据词面自动合并。`canvas`/`shader` 迁到技术候选字段时，只作为待核查线索，不直接变成技术验证结果。

## 6. 筛选、计数和空结果的精确定义

### 6.1 组合规则

对于组件 c、查询 q、每个维度选择集合 S[d]：

`matches(c) = textMatches(c, q) AND everyDimension(S[d] 为空 OR intersects(values(c, d), S[d]))`

同维多选求并集，跨维求交集；没有选择就是不限。组件无字段只匹配“未标注”，不自动匹配任意具体值。若新增排除标签，作为独立排除集合，在包含结果上执行 NOT；界面将排除条件显示为“排除：粒子”，不要伪装成普通正向标签。

当前 **43 项结构化 AI 快照** 可复算的例子（不能把这些数字冒充补录后的 53 项结果）：

| 条件 | 结果数 | 结果 |
| --- | ---: | --- |
| 导航 AND 玻璃 | 1 | 玻璃标签栏展开菜单 |
| 导航 AND（玻璃 OR 极简） | 3 | 柔光环形菜单、玻璃标签栏菜单、帆船目录 |
|（导航 OR 输入）AND（玻璃 OR 极简） | 4 | 上面 3 项，再加验证码输入验证 |
| 文件 AND 拖拽 | 0 | 空结果 |
| 仅文件 | 1 | 玻璃文件夹展开 |
| 仅拖拽 | 8 | 具体 slug 列表保存在审计 JSON 的 `filterExamples` |

### 6.2 数量规则

结果标题显示当前全条件匹配的唯一组件数。每个筛选选项的数字使用“忽略本维已选条件，保留查询与其他所有维度，再单独加入此选项”的计数，即 disjunctive faceting：

`count(d, value) = uniqueCount(query AND allFiltersExcept(d) AND hasValue(d, value))`

这让用户看得见同组其他可选值，而不会越选越把同组值都清空。例如已选“导航 +（玻璃或极简）”时，结果是 3；视觉选项的数字为玻璃 1、极简 3，二者相加不等于结果 3，因为玻璃标签栏菜单同时属于两者。数字的说明应是“在其他条件下匹配的组件数”，不能写成“再增加 N 个”。需要展示“加入后总数”时另算 toggle 结果，不能复用这个数字。

所有计数均先做组件 ID 去重；用途父级按叶子并集计数。筛选后页码回到第一页；切换排序不清空筛选；删除一个条件仅删除该值。搜索、筛选、排序与页码写入 URL，可分享并可浏览器返回恢复。未知 URL 标签提示已忽略或已迁移，不静默造一个有效筛选。

0 结果的未选选项保留稳定位置、显示 0 并禁用；已选但变为 0 的选项必须仍可取消。不要因为计数为 0 就隐藏已选条件。若以后提供搜索所有标签，0 项可列在非 0 项之后，保证列表顺序规则一致。

### 6.3 空结果与失效条件

空结果区保留搜索文本和全部筛选 chips，提供“撤销上一步”“清空筛选”“清空搜索”。自动计算单次放宽后的结果数，并明确指出将移除什么，例如“移除『拖拽』，查看 1 个文件组件”“移除『文件』，查看 8 个可拖拽组件”。放宽只是按钮建议，用户点击后才改变条件，不偷偷改成 OR，也不把推荐卡片伪装成精确匹配结果。

上游不可访问与筛选空结果是不同状态。同步失败时展示上一次成功快照和更新时间；没有可用快照才显示数据读取失败。某个详情失败不删掉整个组件，也不把所有数量改为 42。

## 7. 数据结构与维护规范

推荐每个实体使用 `id = provider + ':' + slug`，名字和中文翻译可变，ID 不随标题改变。区分三层：

1. **来源快照**：原始 index/catalog/detail、source URL、revision、retrievedAt、HTTP 状态、内容 SHA-256。外部说明只作数据，不执行其中指令。
2. **规范化条目**：稳定词表 ID、中英显示名、原始标签映射、标准用途、来源信息、各框架包和渲染证据。保留 `raw` 或原始引用，不能覆盖提供方原文。
3. **核验记录**：`field / value / evidenceUrl / evidenceKind / checkedAt / status / note`。`evidenceKind` 至少区分 provider-declared、source-inspected、runtime-verified；字段不能只存最终布尔值。

最小条目建议包括：

```text
id, provider, slug, name{zh,en}, summary, primaryCategory,
purposePaths[], scenarios[], rawTags[], normalizedTags[],
appearance{styles[],materials[],palettes[],forms[]},
behavior{triggers[],controls[]}, inputSupport{},
frameworkPackages{framework:{declared,detailUrl,packageUrl,status,dependencies[],checkedAt}},
implementation{renderers[],fallbacks[],verification},
provenance{packageProvider,implementationAuthor,designReferences[],upstreamCode[],licenses[],assets[]},
links{docs,detail,preview}, availability{},
sourceRevision, retrievedAt, taxonomyVersion, evidence[], editorialNotes[]
```

维护约束：

- 词表用稳定英文 ID，中文/英文标签和别名独立；数组去重；拒绝空字符串与未登记的标准标签。删除词表值需要迁移映射。
- `unknown`、`not-applicable`、明确不支持分别表达；不把空渲染数组默认成 DOM，不把没写 keyboard 当成键盘不可用。
- 框架声明、包链接可访问、包可安装、运行核验分别记录。六框架声明不能替代六框架测试。
- 来源名称、设计作者、代码许可、图片/字体/Logo 权利分别展示。目录中 `canRedistributeSource: true` 只是提供方分发声明；逐项许可文本仍需保留。不要在汇总页给所有 43 项统一加“可商用”标签。
- 每次同步先验证 Schema、slug 集合、声明总量、revision 一致性、facets 重算结果；两份 revision 不一致时重读一次，仍不同则不发布半套数据。
- 只按变化的 slug/revision 更新详情；不必每次下载全站源码。HTTP 失败保留最后一次成功信息及当前错误；组件消失进入待复核，不立刻物理删除。
- 列表计数由条目实时生成，禁止在 UI 手写 43、12 或 66。全文索引与 facets 从同一发布快照生成，避免搜索与数量使用不同版本。
- 新增分类要记录编辑者判断、依据和 taxonomyVersion。AI 可以提出标签建议，未经核查不赋予技术、授权、可访问性或性能等级。

## 8. 建议实施顺序与验收

第一步在本轮完整复刻完成之后，以公开页 53 项为基准合并 AI 的 43 项和补查文档的 10 项；本提案不要求本轮改变参考站的分类组织。后续再完成组合筛选、分享 URL、动态计数、空结果引导、数据更新时间和详情失效状态。此阶段无需先把所有视觉标签整理完，也无需把框架放到一级导航。

第二步维护用途树和视觉词表，优先修复渲染字段、近义词与混杂标签；逐条加入场景和证据。先挑最常用场景检验找到组件是否更快，再扩大字段数量。

第三步再按实际需要加入包可用性、运行核验、依赖与输入支持。只有真实测试后，才增加“手机已验证”“键盘已验证”“减少动态效果已验证”等筛选，暂不编造星级与性能分数。

关键验收：同维 OR / 跨维 AND 的上述 6 个例子一致；父子用途不重复计数；glass/minimal 重叠不累加；0 项已选标签可取消；回退与 URL 恢复准确；unknown 保持独立；详情 404 不影响目录总量；新组件进入后总量和 facets 自动变化；来源 revision 不一致不会发布；所有可见“已验证”都能指到对应证据。

## 附录 A：53 个组件的全量清单

清单按公开组件页顺序生成。43 项类别、视觉与交互来自实时 AI 索引；另 10 项保留“未纳入 AI 目录”，其文档事实与分类建议见 4.1，不将建议标签伪装成已有字段。

| # | slug / 名称 | 当前 AI 主类 | 当前 AI 视觉标签 | 当前 AI 交互标签 |
| ---: | --- | --- | --- | --- |
| 1 | [orbit-not-found / 组件环游 404](https://leibox.pantoria.cn/docs/components/orbit-not-found) | 未纳入 AI 目录 | 见文档补查 | 见文档补查 |
| 2 | [tactile-push-button / 立体按压按钮](https://leibox.pantoria.cn/docs/animations/tactile-push-button) | input | 3d, silver, gradient | hover, click, keyboard, touch |
| 3 | [multi-cursor-builder / 多光标页面搭建](https://leibox.pantoria.cn/docs/animations/multi-cursor-builder) | hero | cursors, canvas, typography, scroll | scroll, keyboard, touch, pause, replay |
| 4 | [album-cover-tunnel / 专辑封面隧道](https://leibox.pantoria.cn/docs/animations/album-cover-tunnel) | media | 3d, photography, bloom, depth, dark | hover, click, scroll, drag, keyboard, touch, pause |
| 5 | [stacked-metadata / 标签叠放展开](https://leibox.pantoria.cn/docs/animations/stacked-metadata) | navigation | pills, overlap, list, dark | hover, focus, click, keyboard, touch |
| 6 | [transfer-glow / 转账光雾确认](https://leibox.pantoria.cn/docs/animations/transfer-glow) | feedback | glow, particles, blur, dialog | click, keyboard, touch |
| 7 | [shader-flood / 液体注入卡片](https://leibox.pantoria.cn/docs/animations/shader-flood) | cards | liquid, marble, shader, cards | hover, focus, click, keyboard, touch |
| 8 | [ascii-sharks / 字符鲨鱼与鱼群](https://leibox.pantoria.cn/docs/animations/ascii-sharks) | background | ascii, grid, light | hover, click, keyboard, touch |
| 9 | [ink-spread-carousel / 墨水扩散图片轮播](https://leibox.pantoria.cn/docs/animations/ink-spread-carousel) | cards | image, ink, refraction | click, keyboard, touch |
| 10 | [particle-texture-trio / 粒子纹理三联](https://leibox.pantoria.cn/docs/animations/particle-texture-trio) | background | particles, dark, noise, dot-matrix | play, pause, keyboard, touch |
| 11 | [matcha-powder-reveal / 包装撕开粒子消散](https://leibox.pantoria.cn/docs/animations/matcha-powder-reveal) | hero | 3d, foil, particles, green | play, pause, seek, drag, keyboard |
| 12 | [ai-brand-cover-cards / AI 品牌封面三联卡片](https://leibox.pantoria.cn/docs/animations/ai-brand-cover-cards) | cards | portrait, artwork, brand | hover, click, keyboard |
| 13 | [folded-emoji-scroll / 折边滚动表情选择器](https://leibox.pantoria.cn/docs/animations/folded-emoji-scroll) | input | dark, folded, canvas, emoji | scroll, search, click, keyboard, touch |
| 14 | [gradient-ring-cards / 渐变卡片环形轮播](https://leibox.pantoria.cn/docs/animations/gradient-ring-cards) | cards | gradient, 3d, particles, chromatic | drag, keyboard, click, pause |
| 15 | [fluid-tooltip / 流体提示气泡](https://leibox.pantoria.cn/docs/animations/fluid-tooltip) | navigation | fluid, capsule, navigation | hover, focus, click, keyboard |
| 16 | [spider-music-player / 蜘蛛牵引切歌](https://leibox.pantoria.cn/docs/animations/spider-music-player) | media | photography, tactile, spider | click, keyboard, input |
| 17 | [collection-layout-morph / 列表卡片堆叠切换](https://leibox.pantoria.cn/docs/animations/collection-layout-morph) | layout | cards | click, keyboard |
| 18 | [brand-poster-cards / 品牌海报三联卡片](https://leibox.pantoria.cn/docs/animations/brand-poster-cards) | cards | photography, editorial | hover, click, keyboard |
| 19 | [dot-matrix-trio / 点阵波纹与旋涡](https://leibox.pantoria.cn/docs/animations/dot-matrix-trio) | background | dots, print | autoplay, click, keyboard |
| 20 | [selection-flower / 文字选区开花](https://leibox.pantoria.cn/docs/animations/selection-flower) | text | botanical, illustration | text-selection, keyboard |
| 21 | [inline-text-morph / 内联词组变形](https://leibox.pantoria.cn/docs/animations/inline-text-morph) | text | typographic, stickers | click, keyboard |
| 22 | [galaxy-effort-slider / 脑形滑块粒子增强](https://leibox.pantoria.cn/docs/animations/galaxy-effort-slider) | input | particles, cosmic | drag, keyboard |
| 23 | [notes-text-color / 文字选区调色器](https://leibox.pantoria.cn/docs/animations/notes-text-color) | text | glass, minimal | text-selection, click |
| 24 | [bounding-box-resize / 选框拖拽缩放](https://leibox.pantoria.cn/docs/animations/bounding-box-resize) | layout | minimal, editor | drag, input |
| 25 | [soft-action-wheel / 柔光环形菜单展开](https://leibox.pantoria.cn/docs/animations/soft-action-wheel) | navigation | minimal, monochrome | click, keyboard |
| 26 | [staggered-radial-menu / 环形菜单交错展开](https://leibox.pantoria.cn/docs/animations/staggered-radial-menu) | navigation | colorful, spring | click, keyboard |
| 27 | [elastic-panel-resize / 弹性面板缩放](https://leibox.pantoria.cn/docs/animations/elastic-panel-resize) | layout | minimal, elastic | drag |
| 28 | [blue-fluted-glass / 蓝色棱纹流动背景](https://leibox.pantoria.cn/docs/animations/blue-fluted-glass) | background | blue, glass, liquid | autoplay |
| 29 | [reasoning-effort-slider / 模型思考强度滑块](https://leibox.pantoria.cn/docs/animations/reasoning-effort-slider) | input | cosmic, elastic | drag, keyboard |
| 30 | [deep-agent-composer / Agent 对话输入框](https://leibox.pantoria.cn/docs/animations/deep-agent-composer) | input | product, compact | input, click, keyboard |
| 31 | [hammerhead-chart / 字符鲨鱼追踪价格路径](https://leibox.pantoria.cn/docs/animations/hammerhead-chart) | data | ascii, chart | pointer, autoplay |
| 32 | [glass-tab-menu / 玻璃标签栏展开菜单](https://leibox.pantoria.cn/docs/animations/glass-tab-menu) | navigation | glass, minimal | click, keyboard |
| 33 | [crumpled-paper / 揉皱纸张展开](https://leibox.pantoria.cn/docs/animations/crumpled-paper) | cards | paper, tactile | hover |
| 34 | [sailing-toc / 帆船滚动目录](https://leibox.pantoria.cn/docs/animations/sailing-toc) | navigation | nautical, minimal | scroll, click |
| 35 | [thinking-particles / 思考步骤粒子变形](https://leibox.pantoria.cn/docs/animations/thinking-particles) | feedback | particles | autoplay, click |
| 36 | [glass-folder / 玻璃文件夹展开](https://leibox.pantoria.cn/docs/animations/glass-folder) | files | glass, cards | hover, click, keyboard |
| 37 | [cosmic-panels / 轨道与点阵动效](https://leibox.pantoria.cn/docs/animations/cosmic-panels) | background | cosmic, dots | autoplay |
| 38 | [gradient-cover-wall / 渐变卡片跟随](https://leibox.pantoria.cn/docs/animations/gradient-cover-wall) | cards | gradient, grain | pointer, autoplay |
| 39 | [otp-verification / 验证码输入验证](https://leibox.pantoria.cn/docs/components/otp-verification) | input | minimal, capsule | input, keyboard |
| 40 | [brand-line-cards / 鼠标感应线条](https://leibox.pantoria.cn/docs/animations/brand-line-cards) | cards | line-art, monochrome | pointer |
| 41 | [share-invite / 分享邀请面板](https://leibox.pantoria.cn/docs/components/share-invite) | collaboration | product, compact | input, click, keyboard |
| 42 | [bouncy-access / 访问申请展开](https://leibox.pantoria.cn/docs/animations/bouncy-access) | collaboration | capsule, spring | click |
| 43 | [velocity-drag / 日历惯性拖拽](https://leibox.pantoria.cn/docs/animations/velocity-drag) | layout | elastic, cards | drag |
| 44 | [ai-generating / 点阵加载](https://leibox.pantoria.cn/docs/animations/ai-generating) | feedback | dots, minimal | autoplay |
| 45 | [ascii-object / ASCII 物体](https://leibox.pantoria.cn/docs/components/ascii-object) | 未纳入 AI 目录 | 见文档补查 | 见文档补查 |
| 46 | [asciify / 字符透镜](https://leibox.pantoria.cn/docs/components/asciify) | 未纳入 AI 目录 | 见文档补查 | 见文档补查 |
| 47 | [frost / 冰霜](https://leibox.pantoria.cn/docs/components/frost) | 未纳入 AI 目录 | 见文档补查 | 见文档补查 |
| 48 | [glass / 玻璃透镜](https://leibox.pantoria.cn/docs/components/glass) | 未纳入 AI 目录 | 见文档补查 | 见文档补查 |
| 49 | [glass-object / 玻璃物体](https://leibox.pantoria.cn/docs/components/glass-object) | 未纳入 AI 目录 | 见文档补查 | 见文档补查 |
| 50 | [glyph-rain / 字符雨](https://leibox.pantoria.cn/docs/components/glyph-rain) | 未纳入 AI 目录 | 见文档补查 | 见文档补查 |
| 51 | [particle-object / 粒子物体](https://leibox.pantoria.cn/docs/components/particle-object) | 未纳入 AI 目录 | 见文档补查 | 见文档补查 |
| 52 | [particle-scroll / 粒子滚动](https://leibox.pantoria.cn/docs/components/particle-scroll) | 未纳入 AI 目录 | 见文档补查 | 见文档补查 |
| 53 | [liquid-object / 流体物体](https://leibox.pantoria.cn/docs/components/liquid-object) | 未纳入 AI 目录 | 见文档补查 | 见文档补查 |

## 附录 B：AI 子集的完整视觉标签频次

以下计数只针对具有结构化标签的 43 项；补查的 10 项不自动加入这些现有标签计数。

| 标签 | 组件数 | 标签 | 组件数 |
| --- | ---: | --- | ---: |
| minimal | 8 | particles | 6 |
| 3d | 4 | cards | 4 |
| dark | 4 | glass | 4 |
| capsule | 3 | cosmic | 3 |
| dots | 3 | elastic | 3 |
| gradient | 3 | photography | 3 |
| ascii | 2 | canvas | 2 |
| compact | 2 | liquid | 2 |
| monochrome | 2 | product | 2 |
| spring | 2 | tactile | 2 |
| artwork | 1 | bloom | 1 |
| blue | 1 | blur | 1 |
| botanical | 1 | brand | 1 |
| chart | 1 | chromatic | 1 |
| colorful | 1 | cursors | 1 |
| depth | 1 | dialog | 1 |
| dot-matrix | 1 | editor | 1 |
| editorial | 1 | emoji | 1 |
| fluid | 1 | foil | 1 |
| folded | 1 | glow | 1 |
| grain | 1 | green | 1 |
| grid | 1 | illustration | 1 |
| image | 1 | ink | 1 |
| light | 1 | line-art | 1 |
| list | 1 | marble | 1 |
| nautical | 1 | navigation | 1 |
| noise | 1 | overlap | 1 |
| paper | 1 | pills | 1 |
| portrait | 1 | print | 1 |
| refraction | 1 | scroll | 1 |
| shader | 1 | silver | 1 |
| spider | 1 | stickers | 1 |
| typographic | 1 | typography | 1 |

## 附录 C：53 项的建议主类分布（未应用）

在保留原 43 项主类、仅按 4.1 建议补入 10 项的情况下，可得到 14 个非空主类、总计 53 项。这是方便评估覆盖的提案，不能当作参考站现有分类。

| 主类 | 建议数量 |
| --- | ---: |
| cards | 8 |
| background | 6 |
| input | 6 |
| media | 6 |
| navigation | 6 |
| feedback | 4 |
| layout | 4 |
| cursor | 3 |
| text | 3 |
| collaboration | 2 |
| hero | 2 |
| data | 1 |
| files | 1 |
| scroll | 1 |
