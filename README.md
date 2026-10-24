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

## 校园工具箱 `/tools`

新页面使用 React + shadcn/ui + 现有 Tailwind CSS 3；`src/pages/tools.astro` 仅挂载页面和轻量 HTML 布局，沿用官网构建及 Vercel 发布。首页导航与页脚提供入口，`/tools#gpa` 可直达绩点计算。

手机端直接展示工具切换、搜索、分类与分组列表；桌面端保留介绍区和网站卡片。绩点计算及其弹窗组件仅在首次打开计算工具时下载，切回导航后仍保留录入状态。导航正文随 HTML 输出，无需等待 JavaScript 即可查看和打开链接。

- `src/features/tools/`：React 导航、搜索、分类与绩点计算界面。
- `src/config/tools.ts`：与 App 工具箱一致的 21 个导航链接及页面配置。课表、空教室查询与 App 内部邀请统计不在此页面实现。
- `src/features/tools/gpa.ts`：独立计算与录入校验逻辑，参考 [JLU-Toolkit](https://github.com/vinoxuan/JLU-Toolkit/blob/main/jlu_gpa_calculator.html) 的 `jida` 模式。每门课的学分绩点积先保留两位小数，再求学分加权平均，最终显示五位小数；未及格课程的学分仍计入总学分。
- `src/components/ui/` 下的小写文件：通过 Tailwind 3 兼容的 `shadcn@2.3.0` CLI 生成的组件；别名及组件配置在 `components.json`。
- `src/styles/react-pages.css`：仅作用于新布局的主题 token，避免影响现有首页。

计算器支持增删、编辑、示例、清空确认和当前浏览器本地保存；未完成或不合法的课程会阻止结果展示，完整空白行自动忽略。课程不会上传到服务器，保存失败时仍可计算并显示提示。重修、免修等课程是否计入，请自行按适用要求选择。

运行 `npm run test:tools` 检查分数分段、学分加权、舍入及异常数据（需要支持原生 TypeScript 类型擦除的 Node.js 22.18+）。UI 验收覆盖 320px/390px 手机、平板和桌面宽度、明暗主题、关键词与分类组合、课程编辑/刷新恢复/清空、对话框和键盘操作。

### Nginx 静态部署的压缩

若将静态构建结果部署到自有 Nginx，Astro/Vite 的代码压缩不等于 HTTP 传输压缩。2026-10-24 检查线上 `/tools/` 时，HTML 响应有 `Content-Encoding: gzip`，但 `application/javascript` 和 `text/css` 仍以原始大小传输。Nginx 仅设置 `gzip on` 时默认只处理 HTML，需要另外设置 `gzip_types`。

本工作区的运维配置位于兄弟仓库 `northward-ops/nginx/nginx.conf`，其中已显式开启 JS/CSS 等文本资源的 gzip。更新服务器 `/opt/northward/ops` 的配置后，执行 `sudo /opt/northward/ops/scripts/install.sh --nginx` 才会应用；普通后端发布只更新 API 站点配置，官网 `npm run build` 也不会修改全局 Nginx。具体流程见运维仓库 README 的“Nginx 配置的两条路径”。

安装脚本会先备份，再执行 `nginx -t`，通过后 reload。用带 `Accept-Encoding` 的 GET 检查实际构建生成的 JS/CSS URL，例如：

```bash
curl --compressed -sS -D - -o /dev/null https://northward.zone/_astro/实际构建文件.js
```

JS/CSS 应返回 `Content-Encoding: gzip` 和 `Vary: Accept-Encoding`，`/_astro/` 的现有长期缓存应继续保留。HTML 的 `Cache-Control: no-cache` 允许缓存后重新验证，适合发布更新，不应把页面也设为不可变缓存。压缩配置完成后另用手机和 App 冷启动验证，服务器附近的请求耗时无法代表移动网络体验。参见 [Nginx gzip 文档](https://nginx.org/en/docs/http/ngx_http_gzip_module.html)。

## 配置入口

文案、下载链接、截图列表都在 `src/config/` 下，修改后无需改组件代码：

| 文件                        | 用途                                       |
| --------------------------- | ------------------------------------------ |
| `src/config/appInfo.ts`     | 标题、描述、商店链接                       |
| `src/config/screenshots.ts` | 详情区横向滚动截图（iPhone/iPad 两条数组） |
| `src/config/features.ts`    | 功能特性卡片                               |
| `src/config/faq.ts`         | FAQ 列表                                   |
| `src/config/reviews.ts`     | 用户评价                                   |
| `src/config/socialLinks.ts` | 社交链接                                   |
| `src/config/partners.ts`    | 首页 Hero 下方「合作社团」轮播带           |

## 静态资源

所有静态资源在 [`public/`](public/) 下，按用途分组。**文件名一律小写英文 + 连字符，禁止中文/空格**（曾经 `/media/公众号.jpg` 在跨平台部署踩过编码坑）。

```
public/
├── brand/        favicon-192.svg / favicon-512.svg / logo.png / og-cover.png / og-cover.svg
├── qrcode/       wechat-official.jpg（微信公众号二维码）
├── partners/     合作社团 logo
└── screenshots/
    ├── hero/      left / center / right（3 张首页首屏专用截图）
    ├── ipad/      3 张 iPad 详情截图
    └── home / hot / schedule / rate / square（5 张主截图）
```

## 更换截图

首页首屏的 3 张截图位于 `public/screenshots/hero/`，分别为
`left.webp`、`center.webp`、`right.webp`。它们只用于首屏三台手机，
**同名覆盖即生效，不会影响下方功能卡片和横向滚动截图**。

5 张主截图位于 `public/screenshots/`，按功能命名：`home`、`hot`、
`schedule`、`rate`、`square`。

**引用位置：**

- **Hero 大图**（首页顶部三台手机）：`hero/left.webp`、`hero/center.webp`、`hero/right.webp`，在 [LandingPage.tsx](src/components/sections/LandingPage.tsx) 搜索 `/screenshots/hero/` 查看对应位置
- **功能卡片**（5 张特性卡片）：[LandingPage.tsx](src/components/sections/LandingPage.tsx) 的 `productScenes` 数组 `image` 字段
- **详情区横滚带**：[src/config/screenshots.ts](src/config/screenshots.ts) 的 `iphone` / `ipad` 数组（按数组顺序展示）

> 💡 Hero 的 3 张图已经完全独立。当前 `iphone` 数组仍复用顶层 5 张
> `.webp`，与功能卡片共用；修改顶层图片会同时影响这两处。

**截图规格：** 同一组图片保持相同尺寸和宽高比；推荐宽度 1080–1170 px，
使用 WebP 75–80 质量，并避免状态栏、水印、设备边框和拉伸变形。

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
