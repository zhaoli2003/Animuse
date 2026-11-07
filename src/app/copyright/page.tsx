import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
export const metadata: Metadata = { title: '来源与使用说明', description: 'ZLUIAtlas 的来源、收录方式与组件许可说明。', alternates: { canonical: '/copyright' } };
const linkClass='text-foreground underline underline-offset-4';
export default function CopyrightPage() {
 return <><Navbar /><main className="page-enter flex flex-1 flex-col"><article className="mx-auto w-full max-w-2xl px-5 pt-28 pb-24 text-[15px] leading-7 text-muted-foreground sm:px-8 sm:pt-36">
 <h1 className="text-3xl font-medium tracking-tighter text-foreground sm:text-4xl">来源与使用说明</h1>
 <p className="mt-4 text-sm">更新日期：2026 年 11 月 7 日</p>
 <p className="mt-8">ZLUIAtlas 是由 zhaoli 维护的免费 UI 组件图鉴。你可以观看演示、查看来源、复制提示词，并按各组件许可获取和使用源码。</p>
 <h2 className="mt-10 text-lg font-medium text-foreground">网站与收录来源</h2>
 <p className="mt-3">本版本经 LeiBox 作者许可，以 <a className={linkClass} href="https://leibox.pantoria.cn/" target="_blank" rel="noreferrer">LeiBox</a> 为基础进行品牌适配和静态化整理。感谢 <a className={linkClass} href="https://github.com/leishifu666/LeiBox" target="_blank" rel="noreferrer">雷师傅与 LeiBox 项目</a>。原有组件、设计参考和第三方版权声明随代码保留。</p>
 <h2 className="mt-10 text-lg font-medium text-foreground">逐项查看许可</h2>
 <p className="mt-3">收录不改变原作者的权利。站点公开、免费访问和作者授权收录，并不将所有第三方代码与素材统一改为 MIT。使用时请查看组件详情、源码声明及仓库中的许可文件。</p>
 <p className="mt-3">上游网站包含 Canvas UI 改编代码，相关 MIT + Commons Clause 文本保留在 LICENSE.md。ZLUIAtlas 自行新增的独立代码适用 LICENSE-ZLUIAtlas；第三方组件继续适用其各自许可。</p>
 <h2 className="mt-10 text-lg font-medium text-foreground">图片、媒体与商标</h2>
 <p className="mt-3">组件代码的许可不一定包含演示中的照片、专辑封面、字体、插画和商标。用于自己的项目时，请按对应说明保留署名，并替换需要单独授权的素材。</p>
 <h2 className="mt-10 text-lg font-medium text-foreground">来源更正</h2>
 <p className="mt-3">需要更正署名、说明许可或处理涉及作品的问题，可通过 <a className={linkClass} href="https://github.com/zhaoli2003/zhaoli-free-ui-atlas/issues" target="_blank" rel="noreferrer">项目 Issues</a> 提供相关条目和原始来源，由 zhaoli 统一核实维护。</p>
 </article><Footer /></main></>;
}
