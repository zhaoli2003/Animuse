import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
export const metadata: Metadata = { title: '隐私说明', description: 'ZLUIAtlas 的本地偏好、组件演示、剪贴板与外部服务说明。', alternates: { canonical: '/privacy' } };
export default function PrivacyPage() {
 return <><Navbar /><main className="page-enter flex flex-1 flex-col"><article className="mx-auto w-full max-w-2xl px-5 pt-28 pb-24 text-[15px] leading-7 text-muted-foreground sm:px-8 sm:pt-36">
 <h1 className="text-3xl font-medium tracking-tighter text-foreground sm:text-4xl">隐私说明</h1>
 <p className="mt-4 text-sm">更新日期：2026 年 11 月 7 日</p>
 <p className="mt-8">ZLUIAtlas 是由 zhaoli 维护的静态组件图鉴，无账号系统、数据库、留言表单或邮件发送服务。</p>
 <h2 className="mt-10 text-lg font-medium text-foreground">浏览器偏好与演示</h2>
 <p className="mt-3">语言、主题、框架和代码文件选择等偏好保存在你的浏览器中，清除此站点的数据可重置。组件中的成员、邮箱、付款和 AI 对话等操作仅作交互演示，不会发送邀请、完成真实付款或调用 AI 服务。</p>
 <h2 className="mt-10 text-lg font-medium text-foreground">复制与下载</h2>
 <p className="mt-3">点击复制按钮时，网站只将选中的代码、提示词或链接写入剪贴板；不会读取其他剪贴板内容。下载组件会将所选文件保存在本机。</p>
 <h2 className="mt-10 text-lg font-medium text-foreground">外部资源与链接</h2>
 <p className="mt-3">仓库星标数从 GitHub 的公开接口读取。部分组件可能加载原项目的图片、视频或其他资源，外部服务适用其各自的隐私政策。来源链接与 AI 快捷入口会打开相应外部网站。</p>
 <h2 className="mt-10 text-lg font-medium text-foreground">维护者</h2>
 <p className="mt-3">项目代码与维护记录见 <a className="text-foreground underline underline-offset-4" href="https://github.com/zhaoli2003/zhaoli-free-ui-atlas" target="_blank" rel="noreferrer">GitHub 仓库</a>。</p>
 </article><Footer /></main></>;
}
