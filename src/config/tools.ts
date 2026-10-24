export type ToolCategoryId =
	"campus" | "academic" | "services" | "library" | "utilities";

export interface CampusLink {
	name: string;
	href: string;
	description: string;
	icon: string;
	keywords?: string;
}

export interface ToolCategory {
	id: ToolCategoryId;
	name: string;
	description: string;
	icon: string;
	links: CampusLink[];
}

// Match the navigation in northward-app/lib/page/square/quick_links_sheet.dart.
export const toolCategories: ToolCategory[] = [
	{
		id: "campus",
		name: "校园入口",
		description: "从这里，连接吉大生活。",
		icon: "campus",
		links: [
			{
				name: "吉大官网",
				href: "https://www.jlu.edu.cn",
				description: "学校资讯与官方信息",
				icon: "campus",
			},
			{
				name: "向北 App 官网",
				href: "https://northward.zone",
				description: "吉大人自己的校园社区",
				icon: "northward",
			},
			{
				name: "吉林大学网站导航",
				href: "https://stulenpid.cn",
				description: "发现更多校园网站",
				icon: "compass",
				keywords: "导航 网址",
			},
		],
	},
	{
		id: "academic",
		name: "教务与事务",
		description: "选课、考试与学习中的大小事。",
		icon: "academic",
		links: [
			{
				name: "教务管理系统",
				href: "https://iedu.jlu.edu.cn",
				description: "本科教务综合服务",
				icon: "academic",
				keywords: "选课 成绩 绩点",
			},
			{
				name: "学生事务管理系统",
				href: "https://sais.jlu.edu.cn",
				description: "学生事务在线办理",
				icon: "file",
			},
			{
				name: "教务处",
				href: "https://eol.jlu.edu.cn",
				description: "教务信息与服务入口",
				icon: "book",
			},
			{
				name: "本科教学信息网",
				href: "https://jwc.jlu.edu.cn",
				description: "本科教学通知与资讯",
				icon: "news",
			},
			{
				name: "注册与考试中心",
				href: "https://registry.jlu.edu.cn",
				description: "注册与考试相关事务",
				icon: "check",
			},
			{
				name: "考试中心",
				href: "https://kszx.jlu.edu.cn",
				description: "考试通知与信息查询",
				icon: "file",
			},
		],
	},
	{
		id: "services",
		name: "校内服务",
		description: "把校园生活，安排得更顺手。",
		icon: "services",
		links: [
			{
				name: "校内通知网",
				href: "https://oa.jlu.edu.cn",
				description: "及时了解校内通知",
				icon: "news",
				keywords: "OA 办公",
			},
			{
				name: "校园卡平台",
				href: "https://dsf.jlu.edu.cn",
				description: "校园卡相关服务",
				icon: "card",
				keywords: "一卡通 充值",
			},
			{
				name: "网络中心",
				href: "https://nic.jlu.edu.cn",
				description: "校园网络服务与指南",
				icon: "network",
			},
			{
				name: "校园网自助营业厅",
				href: "https://ip.jlu.edu.cn",
				description: "校园网络账户自助服务",
				icon: "wifi",
				keywords: "网费 IP",
			},
			{
				name: "学生工作部",
				href: "https://xsc.jlu.edu.cn",
				description: "学生工作资讯与服务",
				icon: "users",
			},
			{
				name: "勤工助学中心",
				href: "https://qgzx.jlu.edu.cn",
				description: "勤工助学相关信息",
				icon: "heart",
				keywords: "资助",
			},
			{
				name: "招生办",
				href: "https://zsb.jlu.edu.cn",
				description: "招生信息与报考指南",
				icon: "campus",
			},
			{
				name: "外网",
				href: "https://vpns.jlu.edu.cn",
				description: "WebVPN · 校外访问校园资源",
				icon: "globe",
				keywords: "vpn 外网 校外",
			},
		],
	},
	{
		id: "library",
		name: "图书馆",
		description: "给阅读与自习，留一个好位置。",
		icon: "library",
		links: [
			{
				name: "图书馆",
				href: "https://lib.jlu.edu.cn",
				description: "馆藏资源与图书馆服务",
				icon: "library",
				keywords: "借书 文献 论文",
			},
			{
				name: "图书馆预定座位",
				href: "https://libseat.jlu.edu.cn",
				description: "提前安排你的自习座位",
				icon: "seat",
				keywords: "预约 预约座位 自习",
			},
		],
	},
	{
		id: "utilities",
		name: "实用工具",
		description: "校园之外，也有一些好帮手。",
		icon: "utilities",
		links: [
			{
				name: "更改地址工具包（仅限苹果）",
				href: "https://www.i4.cn/pro_pc.html",
				description: "爱思助手 · iOS 设备工具",
				icon: "phone",
				keywords: "苹果 iPhone 定位",
			},
			{
				name: "Open-JLU 奇妙工具包",
				href: "https://github.com/userElaina/Open-JLU",
				description: "来自社区的吉大开源工具集",
				icon: "code",
				keywords: "github 开源",
			},
		],
	},
];

export const toolsContent = {
	title: "校园工具箱｜向北",
	description:
		"吉大人的校园工具箱：校园网站导航、教务与校内服务入口，以及吉大绩点计算。",
	heroTitle: "校园日常，",
	heroAccent: "一处就好。",
	calculatorLoading: "正在打开绩点计算…",
	calculatorLoadError: "暂时无法打开绩点计算，请检查网络后重试。",
	gpaDetailsTitle: "计算明细与说明",
	gpaDetailsDescription:
		"各门课程的学分乘以对应绩点，加总后除以总学分。未及格课程以 0 绩点计入，学分同样参与加权。仅供估算，以学校认定为准。",
	heroDescription:
		"常用网站不必翻找，学期努力清晰有数。\n把吉大生活里需要的小工具，放在你手边。",
	gpaReference:
		"https://github.com/vinoxuan/JLU-Toolkit/blob/main/jlu_gpa_calculator.html",
	storageKey: "northward.tools.gpa.v1",
};
