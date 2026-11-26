export const squareContent = {
	title: "向北广场｜吉林大学校园社区",
	description: "在向北广场玩弹射冰球、恰好合拍，也能找到校园日常用得上的工具。",
	name: "广场",
	eyebrow: "NORTHWARD · SQUARE",
	heading: "课间，来点好玩的。",
	body: "和朋友来一局，或安静拼一会儿。",
	pending: {
		description:
			"向北广场正在建设中，这里会是吉大同学交流与分享的新去处。现在可以先用校园工具箱：绩点计算、空教室查询和校园网站导航。",
		heading: "广场正在搭建",
		body: "这里会是向北的新去处。\n更多内容还在准备，敬请期待。",
	},
	backHome: "返回官网",
	gamesHeading: "玩一会儿",
	gamesNote: "即点即玩",
	play: "开始玩",
	toolsHeading: "校园日常",
	games: [
		{
			id: "hockey",
			name: "弹射冰球",
			description: "拉住、瞄准、松手。把冰球送过中线，先清空自己的半场。",
			modes: "人机练习 · 在线匹配 · 好友对战",
			href: "https://games.northward.zone/hockey/?northward=1",
			cover: "/assets/games/hockey.svg",
		},
		{
			id: "perfect-match",
			name: "恰好合拍",
			description: "移动、旋转、微调。让彩色形状与轮廓，恰好合拍。",
			modes: "每日挑战 · 无尽连击 · 慢慢拼",
			href: "https://games.northward.zone/perfect-match/?northward=1",
			cover: "/assets/games/perfect-match.svg",
		},
	],
	toolbox: {
		name: "校园工具箱",
		tagline: "校园日常，\n一处就好。",
		href: "/tools/",
		features: [
			{ name: "校园导航", icon: "compass" },
			{ name: "绩点计算", icon: "grid" },
			{ name: "教室查询", icon: "pin" },
		],
	},
};
