# 首页三手机视觉 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页首屏改为使用三张独立截图的三手机布局。

**Architecture:** 在 `public/screenshots/hero/` 中保存首屏专用资源，首屏组件
直接引用它们；产品滚动栏继续引用原文件。三台手机沿用现有 `Phone` 组件，
通过定位、旋转和层级形成中间主视觉。

**Tech Stack:** Astro、React、Tailwind CSS、Framer Motion

## Global Constraints

- 首屏图片不得与下方产品滚动栏共用文件。
- 中间手机位于最前方，左右手机位于后方并向外轻微旋转。
- 不新增依赖，不重构无关组件。

---

### Task 1: 独立资源与三手机布局

**Files:**

- Create: `public/screenshots/hero/left.webp`
- Create: `public/screenshots/hero/center.webp`
- Create: `public/screenshots/hero/right.webp`
- Modify: `src/components/sections/LandingPage.tsx`

**Interfaces:**

- Consumes: 现有 `Phone` 组件的 `src`、`alt`、`width`、`height`、
  `priority` 和 `className` 属性。
- Produces: 首屏三个独立图片路径 `/screenshots/hero/left.webp`、
  `/screenshots/hero/center.webp`、`/screenshots/hero/right.webp`。

- [ ] **Step 1: 建立资源隔离检查基线**

运行：

```bash
test ! -e public/screenshots/hero/left.webp
test ! -e public/screenshots/hero/center.webp
test ! -e public/screenshots/hero/right.webp
```

预期：三个命令成功，证明新资源尚不存在。

- [ ] **Step 2: 创建三份首屏专用资源**

将 `home.webp`、`hot.webp`、`square.webp` 分别复制为 `left.webp`、
`center.webp`、`right.webp`，保持滚动栏原文件不变。

- [ ] **Step 3: 实现三手机布局**

在首屏视觉容器中使用三个 `Phone`：左侧引用 `left.webp`，中间引用
`center.webp` 并设为最高层级，右侧引用 `right.webp`。使用百分比宽度与定位，
使三台手机在现有移动端和桌面容器内缩放。

- [ ] **Step 4: 验证资源不再复用**

运行：

```bash
rg -n 'src="/screenshots/hero/(left|center|right)\.webp"' \
  src/components/sections/LandingPage.tsx
rg -n 'image: "/screenshots/(home|hot|square)\.webp"' \
  src/components/sections/LandingPage.tsx
```

预期：首屏匹配三个 `hero` 路径，产品场景仍匹配原始路径。

- [ ] **Step 5: 运行项目检查**

运行：

```bash
npx astro check
npm run build
```

预期：两个命令均以状态码 0 结束。

- [ ] **Step 6: 视觉核验**

启动开发服务器，在桌面和移动端视口确认三台手机全部可见、中心手机位于最前、
图片和首屏文字不重叠，并确认页面无横向溢出。
