import {
	FiAward,
	FiMessageCircle,
	FiMoreHorizontal,
	FiUsers,
} from "react-icons/fi";
import type { Feature } from "./types";

export const features: Feature[] = [
	{
		title: "想说就说",
		description:
			"支持匿名发帖、评论，社恐也能畅所欲言；这里还可关注、私信，找适合你的校园搭子。",
		icon: FiMessageCircle,
	},
	{
		title: "社团大厅",
		description:
			"刷一刷社团大厅，找到自己感兴趣的组织；无论是学术、文体还是志愿，都能找到同好。",
		icon: FiUsers,
	},
	{
		title: "从夯到拉",
		description:
			"「向北」评分榜，万物皆可评——美食、专业、地标，评出你心中的从夯到拉。",
		icon: FiAward,
	},
	{
		title: "更多玩法",
		description:
			"课表一键查看，闲暇之余还能在上面找份家教赚点外快，让课余时间不止一种打开方式。",
		icon: FiMoreHorizontal,
	},
];
