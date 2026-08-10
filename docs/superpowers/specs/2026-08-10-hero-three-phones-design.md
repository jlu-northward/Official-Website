# 首页三手机视觉设计

## 目标

将首页首屏的两台手机调整为三台手机，并让首屏手机截图使用独立资源，
不再与下方产品滚动栏共用图片文件。

## 资源

- `public/screenshots/hero/left.webp`：左侧手机截图，初始复制自
  `public/screenshots/home.webp`。
- `public/screenshots/hero/center.webp`：中间主手机截图，初始复制自
  `public/screenshots/hot.webp`。
- `public/screenshots/hero/right.webp`：右侧手机截图，初始复制自
  `public/screenshots/square.webp`。

下方产品滚动栏继续使用原有截图。后续替换 `hero` 目录中的任一文件时，
不会影响滚动栏。

## 布局

中间手机位于最前方并保持视觉主位；左右手机分别向外轻微旋转、降低层级。
三台手机统一放在现有首屏视觉容器中，并在移动端随容器缩放，避免溢出。

## 验证

- 运行 `npx astro check`。
- 运行 `npm run build`。
- 在桌面与移动端视口检查三台手机的层级、边界和首屏文字是否重叠。
