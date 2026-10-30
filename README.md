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

新页面使用 React + shadcn/ui + 现有 Tailwind CSS 3；`src/pages/tools.astro` 仅挂载页面和轻量 HTML 布局，沿用官网构建及 Vercel 发布。首页导航与页脚提供入口，`/tools#gpa` 可直达绩点计算，`/tools#classrooms` 可直达空教室查询。

手机端直接展示工具切换、搜索、分类与分组列表；桌面端保留介绍区和网站卡片。绩点计算组件仅在首次打开计算工具时下载，分享弹窗及图片生成代码进一步延后到点击“分享成绩单”才加载；切回导航后仍保留录入状态。导航正文随 HTML 输出，无需等待 JavaScript 即可查看和打开链接。

- `src/features/tools/`：工具箱的 React 界面、计算、导入和查询逻辑。
- `src/features/tools/content/`：工具箱中文文案、导航数据及相关常量，按工具划分；`tools.ts` 包含以 App 工具箱为基础扩充的 24 个导航链接及页面内容。个人课表与 App 内部邀请统计不在此页面实现。
- `src/features/tools/data/classroom-data.json`：课表导入脚本生成的静态数据地址清单。
- `src/features/tools/gpa.ts`：独立计算与录入校验逻辑，参考 [JLU-Toolkit](https://github.com/vinoxuan/JLU-Toolkit/blob/main/jlu_gpa_calculator.html) 的 `jida` 模式。每门课的学分绩点积先保留两位小数，再求学分加权平均，最终显示五位小数；未及格课程的学分仍计入总学分。
- `src/components/ui/` 下的小写文件：通过 Tailwind 3 兼容的 `shadcn@2.3.0` CLI 生成的组件；别名及组件配置在 `components.json`。
- `src/styles/react-pages.css`：仅作用于新布局的主题 token，避免影响现有首页。

计算器支持增删、编辑、示例、清空确认和当前浏览器本地保存。默认只计算必修，可切换全部课程（含选修、限选），每门课可修改课程性质；旧版手动录入记录按必修保留。未完成或不合法的所选课程会阻止结果展示，完整空白行自动忽略。课程不会上传到服务器，保存失败时仍可计算并显示提示。重修、免修等课程是否计入，请自行按适用要求选择。

#### Excel 成绩导入

可点击选择或拖入教务导出的 `.xlsx` 成绩表（最大 5 MB，最多 200 门数字成绩）。使用首个工作表，按列标题定位“课程名 / 课程名称”“总成绩 / 成绩”“课程性质 / 课程属性”“学分”，兼容列顺序调整、标题前的说明行和重复表头。文件在本地读取；Excel 解析代码只在选中文件后才下载，首页、其他工具及手动计算不会加载解析库。原成绩表不进入仓库或官网静态资源。

**文字成绩只排除 GPA 计算，即使表内有对应的绩点也不计算，课程清单和分享图片仍正常展示原成绩。** 未出成绩和标记为无效的记录同样保留展示，并注明不计 GPA；只有文字或未出分记录的表格也能导入查看和分享。“仅必修 / 全部课程”只决定 GPA 计算范围，清单始终按 Excel 原顺序包含全部记录。数字成绩沿用吉大模式换算，超出 0—100 的成绩或不合法学分保留为可编辑项，需要修正后才展示所选范围的结果。重复修读记录按导入行保留，不擅自选择最高分或合并。每次导入默认回到“仅必修”；切换范围与课程编辑即时更新结果，课程性质和范围会随课程在本地保存。

点击“分享成绩单”可预览并保存一张 PNG 长图，按学期展示全部课程的成绩、性质、学分和绩点，摘要注明当前 GPA 计算范围；文字、未出分及无效记录保留展示并标记不计 GPA。分享不受清单折叠或“仅必修”筛选影响。课程学期可在清单中修改，未填写时归入“未标注学期”。

图片通过浏览器 Canvas 本地生成，不调用服务端或第三方截图服务；弹窗提供滚动预览、手机长按保存及可读的文字版成绩单。不参与 GPA 的记录也随课程保存到本地，刷新后仍可生成完整成绩单，兼容之前保存的手动课程。原有记录若缺少文字成绩信息，重新导入一次 Excel 即可补齐。

已有课程时先确认替换，取消或导入失败会保留当前记录。清单初始展示 6 门，可展开全部核对；手机端保留底部结果。实现分别位于 `src/features/tools/gpa-import.ts`（字段解析）、`gpa-excel.ts`（按需读取 Excel）和 `GpaExcelImport.tsx`（文件选择与拖放），文案与支持列名在 `src/features/tools/content/gpa-import.ts`。

运行 `npm run test:tools` 检查分数分段、学分加权、舍入及异常数据（需要支持原生 TypeScript 类型擦除的 Node.js 22.18+）。UI 验收覆盖 320px/390px 手机、平板和桌面宽度、明暗主题、关键词与分类组合、课程编辑/刷新恢复/清空、对话框和键盘操作。

### 空教室与蹭课查询

查询完全在浏览器执行，不调用后端接口。首次进入“空教室查询”才动态导入组件，组件处于活动状态时才请求带内容哈希的静态课表 JSON；校园导航、绩点计算和官网首页不会请求该组件或课表。加载完成后切换工具保留筛选、结果与数据，不重复请求。支持校区、教学楼、周次、星期、1—12 节范围、全天查询和本地收藏。

`src/features/tools/classrooms.ts` 校验数据并建立按楼索引，使用周次与节次掩码判断占用。所选时间内有任一节课的教室都会排除。空教室数据仅包含地点、教室类型与占用时间。

工具内的“蹭课”模式支持课程名、教师名的独立或组合搜索，以及教学周筛选。结果按教学班展示教师、课程号、课序号、星期、节次、周次、对应日期和地点，每页最多 10 个教学班。未公布时间的课程保留在全部教学周搜索中，未映射到楼宇的地点保留原文。课程组件和独立课程 JSON 仅在首次进入蹭课模式时加载，找空教室不会下载课程与教师数据。

#### 更换 Excel / 开学日期的 CLI

在官网仓库目录运行下面的命令，按菜单操作即可。需要 Python 3，不用安装额外的 Python 包；Mac 上可以把 Excel 文件直接拖入终端输入路径。

```bash
npm run timetable
```

菜单提供“更换 Excel”“只修改开学日期”“查看当前配置”。更换 Excel 时会询问第一教学周周一、学期名称、总周数，回车沿用当前设置。也支持直接传参：

```bash
# 更换学期：一次指定新 Excel、第一教学周周一、名称和周数
npm run timetable -- update "/绝对路径/新学期课表.xlsx" \
  --start 2027-03-01 --name "2026—2027 第二学期" --weeks 18 --reset-overrides

# 同学期只刷新 Excel，沿用当前日期、名称、周数和调休设置
npm run timetable -- update "/绝对路径/更新后的课表.xlsx"

# 只改第一教学周周一，不需要找到原 Excel
npm run timetable -- date 2026-09-07

# 查看当前学期、来源文件、导入时间和数据量
npm run timetable -- status

# 先校验和预览，不写入文件；date 命令同样支持 --dry-run
npm run timetable -- update "/绝对路径/新学期课表.xlsx" --start 2027-03-01 --dry-run

npm run timetable -- --help
npm run timetable -- update --help
```

`--start` 必须是**第一教学周的周一**，格式为 `YYYY-MM-DD`，无效日期或非周一会拒绝更新。省略 `--start`、`--name`、`--weeks` 时沿用当前值；`--reset-overrides` 清空旧学期的调休/停课表，省略则保留。交互菜单在开学日期变动且已有调休表时会询问是否清空。单独改日期会保留课程、占用记录和原 Excel 导入日期。

CLI 完成解析校验后会同步写入学期配置、空教室与蹭课 JSON、内容哈希索引；写入失败会回滚，成功后清理被替换的旧哈希文件。原 Excel 只读，不会复制到官网或自动发布。更新后用 `npm run dev` 本地检查，再执行 `npm run build` 并按官网现有流程发布。

高级配置仍在 `data/classroom-semester.json`：教学楼别名用 `buildingAliases`；`dateOverrides` 用 `{"YYYY-MM-DD":{"week":1,"weekday":3}}` 表示某日期按指定教学周、星期上课，用 `null` 表示停课日。空教室与蹭课共用这份校历。手动修改后需要重新运行 `update`；若仅修改日期或调休表，可以运行 `date` 同步。当前起点为 `2026-09-07`；起点为 `null` 时仅提供按周次查询。

维护验证：

```bash
npm run test:timetable
npm run test:tools
npx astro check
npm run build
```

转换器按表头寻找字段，不依赖 Excel 的 dimension 范围。它支持单周、连续和分散周次、单双周及节次简写，合并同一地点的占用记录；无法识别的时间阻止导入，缺少地点及无法映射到校区/楼宇的记录写入 `data/classroom-import-report.json`，应在更新时检查。原始 Excel 不需要提交。生成的 `src/features/tools/data/classroom-data.json`、`public/data/classrooms/`、`data/classroom-semester.json`、`data/classroom-import-report.json` 应随代码一起提交；文件名随内容变化，避免命中旧课表缓存。课程数据保留课程名与任课教师，用于蹭课搜索，不含选课人数等无关字段。旧命令 `python3 scripts/import-classrooms.py "/路径/课表.xlsx" --imported-at YYYY-MM-DD` 仍可使用。

查询范围是课表中能定位的教室；未排过课的教室、临时借用、考试及教室开放情况需要另行核实。

### Nginx 静态部署的压缩

若将静态构建结果部署到自有 Nginx，Astro/Vite 的代码压缩不等于 HTTP 传输压缩。2026-10-24 检查线上 `/tools/` 时，HTML 响应有 `Content-Encoding: gzip`，但 `application/javascript` 和 `text/css` 仍以原始大小传输。Nginx 仅设置 `gzip on` 时默认只处理 HTML，需要另外设置 `gzip_types`。

本工作区的运维配置位于兄弟仓库 `northward-ops/nginx/nginx.conf`，其中已显式开启 JS/CSS 等文本资源的 gzip。更新服务器 `/opt/northward/ops` 的配置后，执行 `sudo /opt/northward/ops/scripts/install.sh --nginx` 才会应用；普通后端发布只更新 API 站点配置，官网 `npm run build` 也不会修改全局 Nginx。具体流程见运维仓库 README 的“Nginx 配置的两条路径”。

安装脚本会先备份，再执行 `nginx -t`，通过后 reload。用带 `Accept-Encoding` 的 GET 检查实际构建生成的 JS/CSS URL，例如：

```bash
curl --compressed -sS -D - -o /dev/null https://northward.zone/_astro/实际构建文件.js
```

JS/CSS 应返回 `Content-Encoding: gzip` 和 `Vary: Accept-Encoding`，`/_astro/` 的现有长期缓存应继续保留。HTML 的 `Cache-Control: no-cache` 允许缓存后重新验证，适合发布更新，不应把页面也设为不可变缓存。压缩配置完成后另用手机和 App 冷启动验证，服务器附近的请求耗时无法代表移动网络体验。参见 [Nginx gzip 文档](https://nginx.org/en/docs/http/ngx_http_gzip_module.html)。

## 配置入口

官网首页的文案、下载链接、截图列表在 `src/config/` 下，修改后无需改组件代码；工具箱内容统一放在 `src/features/tools/content/`：

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
