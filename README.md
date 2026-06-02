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

所有文案、下载链接、截图列表都在 `src/config/` 下，修改后无需改动组件代码：

| 文件 | 用途 |
| --- | --- |
| `src/config/appInfo.ts` | 标题、描述、商店链接 |
| `src/config/screenshots.ts` | 首页滚动截图列表 |
| `src/config/features.ts` | 功能特性卡片 |
| `src/config/faq.ts` | FAQ 列表 |
| `src/config/reviews.ts` | 用户评价 |
| `src/config/socialLinks.ts` | 社交链接 |

## 更新首页截图

首页"详情"区域的横向滚动截图，文件路径和顺序都在 [src/config/screenshots.ts](src/config/screenshots.ts) 的 `iphone` 数组里，**按数组顺序展示**。要替换或新增截图，编辑该数组并把文件放进 `public/screenshots/android/`（或 `iphone/`，视分组而定）。

### 硬性要求

- **尺寸**：宽 1080 px，高不超过 2275 px（参考 Google Play 1080×1920 起，竖屏 9:19.5 比例内即可，不要超过 2275），**每张图片的尺寸必须一致**
- **格式**：WebP，质量 75–80
- **体积**：单张最好 < 150 KB
- **内容必须完整可见**：
  - **不要**顶部状态栏、时间、信号、电池图标
  - **不要**叠加商店水印、推广文字、设备边框
  - **不要**拉伸或变形
  - 整个应用界面要在画面内，四周允许少量留白

### 推荐工作流

1. 在真机或模拟器中截取完整屏幕
2. 将图片resize到统一尺寸，并转为 WebP 格式（网上很多在线免费工具）
3. 丢进 `public/screenshots/android/`
4. 在 [src/config/screenshots.ts](src/config/screenshots.ts) 数组里按你想要的展示顺序更新路径

### 相关文件

- 滚动组件：[src/components/sections/Screenshots.tsx](src/components/sections/Screenshots.tsx)
- 灯箱组件：[src/components/ui/Lightbox.tsx](src/components/ui/Lightbox.tsx)
- 静态资源根目录：[public/](public/)
