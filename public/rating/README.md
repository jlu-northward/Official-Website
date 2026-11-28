# 评分页素材

- `emoji-right.webp`：原 App 榜单详情页的举牌小鸭，来自 `lib/img/emojis/emoji_right.png`，无损转换。
- `empty.webp`：原 App 空列表插画，来自 `lib/img/empty.png`，无损转换。
- 其余 `emoji-*.webp`：复用 App 同名表情，仅用于开发预览的对象示意图。
- `preview-*.webp`：从本仓库 `public/screenshots/rate.webp` 裁出的原 App 食品对象封面，仅用于开发预览；不作为实际对象封面的默认值。

生产对象图片继续使用 API 的 `coverUrl`。榜单若返回 `coverUrl`，首页以头图展示，榜单页同时展示该封面；无封面时沿用原 App 的粉彩头部与小鸭。
