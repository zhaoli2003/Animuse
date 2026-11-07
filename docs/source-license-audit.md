# LeiBox 来源与再分发许可核查

核查日期：2026-11-07（Asia/Shanghai）。目标用途：制作自己的公开、免费、开源组件网站 **ZLUIAtlas**。

## 结论

**用户已明确说明：已取得 LeiBox 作者许可，双方是朋友，作者已授权收录和复刻。** 本项目依此推进整体复刻、品牌替换和公开站点制作，不再以“尚未取得 LeiBox 作者许可”为理由阻止实施，也不要求用户提供证明或重复确认。

这项会话内授权声明是本项目的补充授权依据，并不是上游仓库根许可证的修改。需要保留第三方已有的版权与许可，**不能把整个站点及所有组件统称为 MIT**。独立 MIT 子模块仍按各自许可使用；其许可不自动覆盖外围代码、参考设计、照片和字体。

ZLUIAtlas 的实施方式以主任务为准：取得上游代码，按用户授权进行复刻与品牌适配；保留已有第三方声明；为新站添加自己的来源说明；组件及素材沿用实际适用许可。用户授权没有声明将所有第三方作品重新许可为 MIT，因此不能在改品牌时批量替换或删除原版权文件。

## 核查范围与固定版本

- 仓库：[leishifu666/LeiBox](https://github.com/leishifu666/LeiBox)。核查时 `main` 指向 [`0e5e61bb61feb27ab5e018e8565a885fd64af1fd`](https://github.com/leishifu666/LeiBox/commit/0e5e61bb61feb27ab5e018e8565a885fd64af1fd)，提交时间为 2026-11-06 18:39:56 UTC。
- 完整 Git tree 为 `424d0df85fe4bfe7e6bafb905f3b9485b6e6768d`，API 返回 1,892 项，`truncated=false`。未发现名为 `THIRD_PARTY_NOTICES` 或同名常见扩展形式的统一声明文件；实际许可分散在根目录、组件目录、vendor 目录和字体目录。
- 已读根 `LICENSE.md`、`COPYRIGHT.md`、`README.md`、`package.json`、版权页源码、完整 AI catalog 的来源字段，以及若干独立许可和来源记录。
- 已通过 HTTP 成功读取线上 [来源与使用说明](https://leibox.pantoria.cn/copyright)，返回 200。页面仍标注更新日期 2026-10-28，与仓库的主要权利边界说明一致。仓库版本和线上部署版本不应视为必然相同。
- 本次是发布边界核查，没有逐行完成全部站点和组件的代码来源比对，也没有确认所有第三方图片、模型、字体和设计的权利链。

## 根许可不是标准 MIT

[`LICENSE.md`](https://github.com/leishifu666/LeiBox/blob/0e5e61bb61feb27ab5e018e8565a885fd64af1fd/LICENSE.md) 标题为 **MIT + Commons Clause License Condition v1.0**，版权为 **Copyright (c) 2026 David Haz**。

文件允许在应用、网站或产品中使用、复制、修改、合并、发布和分发软件，并要求保留版权及许可声明；但随后有独立限制：**“do not sell, sublicense, or redistribute the components themselves”**，适用于组件单独、打包及移植后的版本。这是当前仓库实际写出的自定义文本，不能只看 MIT 字样，也不能套用标准 Commons Clause 只限制销售的介绍来覆盖它。

这是原公开许可的实际限制，与用户补充取得的 LeiBox 作者授权应分开记录。用户的授权使收录复刻可以继续实施，但不会由此把 David Haz 等第三方的许可文本改成 MIT。提供源码下载、复制或移植包时，保留对应来源与许可，不承诺超出实际许可的再分发权。免费开放、换品牌和学习用途本身也不是第三方再许可依据。

“源码公开”与“符合开源定义”是两件事。[OSI 开源定义](https://opensource.org/osd)要求自由再分发；[Commons Clause 官方 FAQ](https://commonsclause.com/)也明确区分 source-available 与 open source。LeiBox 的根许可不能称为标准 MIT 开源许可。`package.json` 的 `license` 字段为 `SEE LICENSE IN LICENSE.md`，并没有另一个 MIT 授权入口。

## 站点基础与九个 Canvas UI 效果

[`COPYRIGHT.md`](https://github.com/leishifu666/LeiBox/blob/0e5e61bb61feb27ab5e018e8565a885fd64af1fd/COPYRIGHT.md)明确记录：

1. 历史网站基础代码仍有改编自 David Haz 的 Canvas UI 的部分，保留上游许可及署名，尚未完成整站独立实现审查。
2. 字符物体、字符透镜、冰霜、玻璃透镜、玻璃物体、字符雨、粒子物体、滚动粒子、液态物体共九个效果保留 Canvas UI 原实现。
3. 更换雪山湖泊背景没有改变代码的来源及许可。原作者入口不能证明图片、模型也获同样授权。

核查时 [Canvas UI 当前许可](https://github.com/DavidHDev/canvas-ui/blob/main/LICENSE.md)与 LeiBox 根许可内容一致，两者 blob SHA 均为 `b139dc58a9749d387da4e0cf6f638bb0b246b9a9`。

**实施记录：** 用户已授权以 LeiBox 为基础复刻网站。复制或改编这些文件时，保留 David Haz / Canvas UI 的原版权、许可和来源说明，不将其标成 ZLUIAtlas 独立原创或 MIT。九项效果仍按原作者入口与原许可呈现；如需要新增自己的组件下载/再许可能力，应针对该能力单独核对第三方许可，而不是从 LeiBox 作者的授权推导出所有上游权利。

## AI catalog 的布尔字段不能作为全包授权

固定版本 [`public/ai/catalog.json`](https://github.com/leishifu666/LeiBox/blob/0e5e61bb61feb27ab5e018e8565a885fd64af1fd/public/ai/catalog.json)共列出 **43** 个条目；43 个条目都标记 `distribution.canRedistributeSource=true`。这说明平台提供源码包，但不是全部内容可改用 MIT 再分发的充分证据。

- **17 项**的 `source.license` 明确表示目录没有授予一项覆盖全部内容的许可；例如玻璃文件夹、分享面板、验证码、渐变卡片和点阵加载等。
- `tactile-push-button` 记录社区投稿，没有附单独许可。
- `multi-cursor-builder` 记录用户提供的 HTML，原代码和图片的上游许可未提供或未独立核实。
- 多项声称独立编写实现，但同时写明参考设计、原图片、图形或素材许可未核实。这些记录不能自动转化为 ZLUIAtlas 的 MIT 授权。
- `inline-text-morph` 的 [SVG 来源记录](https://github.com/leishifu666/LeiBox/blob/0e5e61bb61feb27ab5e018e8565a885fd64af1fd/src/lib/motion-core/vendor/agent-icons/SOURCE.md)还指出部分图形直接保留参考页面的 SVG 几何与绘制顺序，另有 Grok Bot 图稿没有单独许可。Lobe Icons 的 MIT 不覆盖这些额外图稿。

**实施边界：** 用户已取得的收录复刻授权单独记录；`canRedistributeSource=true` 继续作为原平台的分发信息保留，不把它转换为“MIT”字段。已有源码包保留来源、许可及素材说明；需要为访问者扩展再许可权利的条目，按其实际第三方许可逐项处理。

## 已确认的独立许可例子

下表是明确存在的许可范围，**不是对 LeiBox 整个组件包的批准清单**。

| 模块 | 核实到的许可及归属 | 对 ZLUIAtlas 的可执行做法 |
| --- | --- | --- |
| ASCII Sharks 上游模拟/渲染模块 | [固定上游 `a0074c16…` 的 LICENSE](https://github.com/stackedlol/ascii-sharks/blob/a0074c16a106f0abc665fe9712ca445f8f98ad8e/LICENSE)为标准 MIT，Copyright (c) 2026 drewdi；LeiBox [SOURCE.md](https://github.com/leishifu666/LeiBox/blob/0e5e61bb61feb27ab5e018e8565a885fd64af1fd/src/lib/AsciiSharks/SOURCE.md)说明四个上游 TypeScript 文件未改动 | 可以使用这些 MIT 文件并保留完整许可；LeiBox 适配层按用户取得的作者授权处理，不默认把打包字体一并视为 MIT |
| Torph 0.1.3 | LeiBox 保留 [MIT 许可](https://github.com/leishifu666/LeiBox/blob/0e5e61bb61feb27ab5e018e8565a885fd64af1fd/src/lib/motion-core/vendor/torph/LICENSE)，Copyright (c) 2025 Lochie Axon；[原上游许可](https://github.com/lochie/torph/blob/main/LICENSE)一致 | 迁移时保留 Torph 许可；Graphical 贴纸和参考字体的权利另记，不能将它们算入 Torph MIT 的范围 |
| Lobe Icons 的代码和向量贡献 | [原上游 LICENSE](https://github.com/lobehub/lobe-icons/blob/master/LICENSE)为 MIT，Copyright (c) 2023 LobeHub；LeiBox 有同内容副本 | 可按 MIT 使用对应资源并保留声明；品牌商标权与第三方额外绘制的图形不因 MIT 一并转授。为自己的网站品牌使用自行设计的标志 |
| MiSans | LeiBox [NOTICE.txt](https://github.com/leishifu666/LeiBox/blob/0e5e61bb61feb27ab5e018e8565a885fd64af1fd/public/fonts/misans/NOTICE.txt)是小米字体的单独协议，要求注明使用，限制改编及字体本身的单独再分发 | 若迁移该字体，保留其声明并按字体原协议使用；不把字体包作为 MIT 组件资产另行提供下载。也可以使用系统字体替代 |

仅存在标准 MIT 子模块不意味着所有依赖都已审核。本次没有为 ZLUIAtlas 选择或引入这些模块。

## 素材和公开发布边界

线上版权页及 README 均明确：免费访问、署名、公开链接和学习声明不是第三方作品的复制/分发授权；代码许可不自动覆盖照片、专辑封面、字体、插画、商标和参考设计。

- **专辑封面：** `album-cover-tunnel` 和 `spider-music-player` 使用真实专辑封面，catalog 不主张免费图像再分发许可。保留具体素材来源说明；需要可自由再分发的演示资产时，替换成自己的抽象封面或已获对应许可的素材。
- **品牌与肖像：** 站点整体品牌改为 ZLUIAtlas；第三方品牌图形与用户提供的人物肖像不会仅因站点改名而成为 ZLUIAtlas 自有资产。保留真实归属，或按主任务替换。
- **截图与视频：** 原参考视频与内部研究截图不自动属于这次公开素材范围。新站缩略图优先从自己的实际演示生成；沿用上游缩略图时保留涉及组件及素材的原来源。
- **字体和模型：** 使用系统字体或单独审核过的开放字体/模型。不要因为它们位于 `public/` 或被打进代码包就认为可自由再分发。

## ZLUIAtlas 的落地规则

1. 按用户已取得的 LeiBox 作者授权进行整体复刻和品牌适配；在来源说明中写明是获作者授权的衍生项目，不称为全部独立原创。
2. 所有公开的可复制代码与演示保持一致；保留各条目的原始来源、许可和素材提示，不通过改品牌扩大对访客承诺的使用权。
3. 原有 `LICENSE.md` 和分散的第三方版权文件保持完整；可在新的 `THIRD_PARTY_NOTICES.md` 登记实际引入的依赖及资源，并指向对应原文件。自己新增的代码若选择 MIT，应明确范围，不覆盖整站第三方内容。
4. 组件条目保留可验证的来源与许可字段；没有明确 MIT 许可的条目不标记为“MIT 开源”。不要把用户给出的站点复刻授权误写成来自所有第三方作者的许可。
5. 免费开放与开源再分发分别落实：无收费门槛属于产品决定，用户可以复制、修改和再分发源码则来自有效许可。本站若宣称两者，应同时满足。

本核查只读取上游与写入该记录，没有修改主站代码、创建或发布远程仓库，也没有发送权利人联系邮件。未克隆上游仓库；证据通过 GitHub 连接器及线上版权页获取。主任务负责后续下载和复刻。
