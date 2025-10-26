import { FiBox, FiStar, FiZap } from "react-icons/fi";
import type { Feature } from "./types";

export const features: Feature[] = [
	{
		title: "匿名交流",
		description: "在匿名社区中，你可以与他人交流，分享你的想法和经验。",
		icon: FiStar,
	},
	{
		title: "夜间模式",
		description: "在夜间模式下，你可以更舒适地使用社区。",
		icon: FiZap,
	},
	{
		title: "无广告",
		description: "我们不会在社区中投放广告，你可以更专注于交流和分享。",
		icon: FiBox,
	},
];
