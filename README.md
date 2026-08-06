# Official-Website

官网首页（Astro + React + Tailwind），单页布局：App 介绍 → 详情截图 → 功能特性。

## 快速开始

```bash
npm install        # 同步依赖
npm run dev        # 本地开发（热更新）
npm run build      # 生产构建（含类型检查）
npm run preview    # 预览构建产物
```

更多命令约定（提交规范、代码风格、PR 流程）见 [AGENTS.md](./AGENTS.md)。

## 配置入口

文案、下载链接、截图列表都在 `src/config/` 下，修改后无需改组件代码：

| 文件 | 用途 |
| --- | --- |
| `src/config/appInfo.ts` | 标题、描述、商店链接 |
| `src/config/screenshots.ts` | 详情区横向滚动截图（iPhone/iPad 两条数组） |
| `src/config/features.ts` | 功能特性卡片 |
| `src/config/faq.ts` | FAQ 列表 |
| `src/config/reviews.ts` | 用户评价 |
| `src/config/socialLinks.ts` | 社交链接 |
| `src/config/partners.ts` | 首页 Hero 下方「合作社团」轮播带 |

## 静态资源

所有静态资源在 [`public/`](public/) 下，按用途分组。**文件名一律小写英文 + 连字符，禁止中文/空格**（曾经 `/media/公众号.jpg` 在跨平台部署踩过编码坑）。

```
public/
├── brand/        favicon-192.svg / favicon-512.svg / logo.png / og-cover.png / og-cover.svg
├── qrcode/       wechat-official.jpg（微信公众号二维码）
├── partners/     合作社团 logo
└── screenshots/  home / hot / schedule / rate / square（5 张主截图）+ ipad/（3 张）
```

## 更换截图

5 张主截图位于 `public/screenshots/`，按功能命名：`home` `hot` `schedule` `rate` `square`。**同名覆盖即生效，无需改代码**（HMR 自动刷新）。

**引用位置：**

- **Hero 大图**（首页顶部两张倾斜手机）：`home.webp` + `square.webp`，在 [LandingPage.tsx](src/components/sections/LandingPage.tsx) 搜索 `/screenshots/` 改 `<Phone src>`
- **功能卡片**（5 张特性卡片）：[LandingPage.tsx](src/components/sections/LandingPage.tsx) 的 `productScenes` 数组 `image` 字段
- **详情区横滚带**：[src/config/screenshots.ts](src/config/screenshots.ts) 的 `iphone` / `ipad` 数组（按数组顺序展示）

> 💡 当前 `iphone` 数组复用顶层 5 张 `.webp`，与功能卡片共用——改一张图会同时影响两处。要让详情区用不同图，丢新文件到 `public/screenshots/` 另起名字（如 `home-detail.webp`），再去 `screenshots.ts` 改路径。

**截图规格：** 宽 1080 px、高 ≤ 2275 px、所有图尺寸一致；WebP 75–80 质量，单张 < 150 KB；无状态栏/水印/设备边框，无拉伸变形。

## 更换公众号二维码

覆盖 `public/qrcode/wechat-official.jpg`。Footer 卡片和点击放大弹窗都引用同一个常量 `QR_SRC`（[Footer.tsx](src/components/sections/Footer.tsx) 顶部），如换文件名去改这个常量。

## 更换品牌资源

`public/brand/` 下的 favicon / OG 封面 / logo **同名覆盖即生效**。如换文件名或格式：
- `favicon-512.svg` → [Layout.astro](src/layouts/Layout.astro) 的 `<link rel="icon">` + [public/manifest.json](public/manifest.json) 的 `icons`
- `og-cover.png` → [Layout.astro](src/layouts/Layout.astro) 的 `shareImage`

## 更新合作社团 logo

合作社团数据在 [src/config/partners.ts](src/config/partners.ts)，logo 文件放 `public/partners/`。

**要求：** 1:1 方形（256×256 最佳，128~512），JPG/PNG/SVG 均可（透明背景用 PNG/SVG），单张 < 80 KB，英文 slug 或拼音命名（如 `jijingjieyou.jpg`）。

**追加步骤：**

1. logo 文件丢进 `public/partners/`，按命名规则起名
2. 在 [partners.ts](src/config/partners.ts) 的 `partners` 数组追加一行：

```ts
{
  name: "社团中文名",
  src: "/partners/your-club-logo.jpg",      // 必须以 /partners/ 开头
  href: "https://your-club.example.com",    // 可选：点击新标签页跳转，留空则纯展示
},
```

**注意：** 条目建议 8–16 条；没拿到 logo 的社团先不要列；列表会自动复制一份做无缝循环，鼠标 hover/键盘 focus 自动暂停。
