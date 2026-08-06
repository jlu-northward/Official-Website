import type { Partner } from "./types";

// 把「向北」真实合作的校园组织/社团加进来。
// - `src` 是位于 /public/partners/ 下的真实品牌 logo（JPG / PNG / SVG，建议 1:1 方形）
// - 暂时没有 logo 的条目可以暂时不列，凑齐再批量填入
// - 推荐 8–16 条，过密会牺牲可读性，过疏则首屏略空
export const partners: Partner[] = [
	{ name: "向北", src: "/partners/northward.png" },
	{ name: "吉井解忧", src: "/partners/jijingjieyou.jpg" },
];
