// 仅由 import.meta.env.DEV 分支加载，用于不连接生产服务的本地交互验收。
import type { Comment, Envelope, Params, Rank, Subject } from "./types";
const ranks: Rank[] = [
	{
		id: 1,
		title: "校园美食榜",
		description: "从食堂窗口到校区周边，找一口喜欢的味道",
		coverUrl: "",
		status: 1,
		subjectType: "food",
	},
	{
		id: 2,
		title: "校园摄影榜",
		description: "跟着月份和校区，发现身边值得记录的风景",
		coverUrl: "",
		status: 1,
		subjectType: "photography",
	},
	{
		id: 3,
		title: "校园运动榜",
		description: "球馆、操场与健身房，一起找到运动的好去处",
		coverUrl: "",
		status: 1,
		subjectType: "sports",
	},
	{
		id: 4,
		title: "校园自习榜",
		description: "安静、明亮、离你近的学习角落",
		coverUrl: "",
		status: 1,
		subjectType: "study",
	},
	{
		id: 5,
		title: "校园蹭课榜",
		description: "值得旁听的好课，先确认时间与课堂安排",
		coverUrl: "",
		status: 1,
		subjectType: "course",
	},
];
const campuses = [
	"中心校区",
	"南岭校区",
	"南湖校区",
	"和平校区",
	"朝阳校区",
	"前卫北区",
	"新民校区",
];
export function createPreviewTransport() {
	let nextId = 100;
	const subjects: Subject[] = ranks.flatMap((rank) =>
		[0, 1, 2].map((index) => ({
			id: rank.id * 10 + index,
			rankListId: rank.id,
			title:
				[
					"日新楼面馆",
					"中心图书馆花廊",
					"体育馆羽毛球场",
					"逸夫楼自习室",
					"文学鉴赏课",
				][rank.id - 1] + (index ? ` ${index + 1}` : ""),
			description: [
				"汤底清爽，出餐很快。同学推荐的校园日常好味道。",
				"春天来这里看看花，晴天的傍晚尤其适合拍照。",
				"场地宽敞，记得提前确认开放时间和预约规则。",
				"灯光明亮，座位安静。请遵守教室使用安排。",
				"循着文字走进另一种生活，旁听前请征得任课老师同意。",
			][rank.id - 1],
			coverUrl: "",
			status: 1,
			avgScore: 9.2 - index * 0.6,
			totalCount: 128 - index * 30,
			campusCode: index % 2,
			building: index % 2 ? "南岭校区" : "日新楼",
			address: "吉林大学校园内",
			tags: rank.id === 3 ? ["室内", "羽毛球"] : rank.id === 5 ? ["人文"] : [],
			recommendedMonths: rank.id === 2 ? [4, 5] : [],
			products:
				rank.id === 1
					? [
							{ name: "招牌牛肉面", price: 15 },
							{ name: "时令小菜", price: null },
						]
					: [],
		})),
	);
	let comments: Comment[] = [
		{
			rateId: 1,
			subjectId: 10,
			parentId: null,
			rootId: 1,
			authorName: "向北同学",
			userId: 21,
			authorAvatar: "",
			content: "最近常来这里，位置很好找。\n推荐试试招牌牛肉面！",
			is_anonymous: 0,
			is_owner: false,
			score: 10,
			liked: false,
			likeCount: 12,
			replyCount: 1,
			createTime: "2026-11-10T12:30:00",
			replies: [
				{
					rateId: 2,
					subjectId: 10,
					parentId: 1,
					rootId: 1,
					authorName: "同学甲",
					content: "谢谢推荐，下课去试试",
					is_anonymous: 0,
					is_owner: false,
					liked: false,
					likeCount: 1,
					replyCount: 0,
					createTime: "2026-11-10T12:40:00",
				},
			],
		},
	];
	return async (action: string, args: Params): Promise<unknown> => {
		if (action === "session") return { uid: 42 };
		if (action === "upload")
			return [
				{
					objectKey: "preview-cover",
					url: new URL("/brand/logo.png", location.origin).href,
				},
			];
		if (action === "openMap" || action === "profile") return true;
		if (action !== "request") throw new Error("未知预览操作");
		const path = String(args.path).replace(/^api\//, "");
		const params = (args.params || {}) as Params;
		const method = args.method;
		let data: unknown = null;
		if (path === "rate/ranks") data = ranks;
		else if (path === "users/campus") data = campuses;
		else if (/^rate\/subjects\/\d+\/locations$/.test(path))
			data = [
				{ campusCode: 0, campusName: campuses[0], buildings: ["日新楼"] },
				{ campusCode: 1, campusName: campuses[1], buildings: ["南岭校区"] },
			];
		else if (/^rate\/subjects\/\d+$/.test(path)) {
			const rankId = Number(path.split("/")[2]);
			let records = subjects.filter(
				(item) =>
					item.rankListId === rankId &&
					(params.campusCode == null ||
						item.campusCode === params.campusCode) &&
					(!params.building || item.building === params.building) &&
					(!params.keyword ||
						`${item.title}${item.description}${item.building || ""}${item.address || ""}`.includes(
							String(params.keyword),
						)) &&
					(!params.tag || item.tags?.includes(String(params.tag))) &&
					(!params.month ||
						item.recommendedMonths?.includes(Number(params.month))),
			);
			if (params.sortType === 1)
				records = records.sort((a, b) => b.avgScore - a.avgScore);
			data = {
				records:
					Number(params.page) > 1
						? []
						: records.slice(0, Number(params.size) || 20),
				current: Number(params.page) || 1,
				pages: 1,
				total: records.length,
				size: Number(params.size) || 20,
			};
		} else if (/^rate\/subject\/\d+$/.test(path)) {
			const item = subjects.find(
				(item) => item.id === Number(path.split("/")[2]),
			);
			if (!item) throw new Error("评分对象不存在");
			data = {
				...item,
				myComment:
					comments.find(
						(comment) =>
							comment.subjectId === item.id &&
							comment.is_owner &&
							!comment.parentId,
					) || null,
			};
		} else if (path === "rate/subject/create") data = null;
		else if (path === "rate/submit") {
			const old = comments.find(
				(comment) =>
					comment.subjectId === Number(params.subjectId) && comment.is_owner,
			);
			const item = {
				rateId: old?.rateId || nextId++,
				subjectId: Number(params.subjectId),
				parentId: null,
				authorName: "我",
				userId: 42,
				is_owner: true,
				liked: false,
				likeCount: 0,
				replyCount: 0,
				createTime: "2026-11-10T14:00:00",
				...params,
			} as unknown as Comment;
			comments = [
				item,
				...comments.filter((comment) => comment.rateId !== item.rateId),
			];
			data = item;
		} else if (/\/like$/.test(path))
			data = {
				liked: method === "POST",
				likeCount: method === "POST" ? 13 : 12,
			};
		else if (method === "PUT") {
			const id = Number(path.split("/").pop());
			comments = comments.map((comment) =>
				comment.rateId === id
					? ({ ...comment, ...params, isEdited: 1 } as Comment)
					: comment,
			);
			data = comments.find((comment) => comment.rateId === id);
		} else if (method === "DELETE") {
			comments = comments.filter(
				(comment) => comment.rateId !== Number(path.split("/").pop()),
			);
		} else if (
			/^rate\/comments\/\d+\/replies$/.test(path) &&
			method === "POST"
		) {
			data = {
				rateId: nextId++,
				subjectId: 10,
				parentId: Number(path.split("/")[2]),
				authorName: "我",
				is_owner: true,
				liked: false,
				likeCount: 0,
				replyCount: 0,
				createTime: "2026-11-10T14:00:00",
				...params,
			};
			comments.push(data as Comment);
		} else if (/^rate\/comments\/\d+/.test(path)) {
			const id = Number(path.split("/")[2]);
			const isReplies = path.endsWith("/replies");
			const items = isReplies
				? [
						...(comments.find((comment) => comment.rateId === id)?.replies ||
							[]),
						...comments.filter((comment) => comment.parentId === id),
					]
				: comments.filter(
						(comment) => comment.subjectId === id && !comment.parentId,
					);
			data = {
				items,
				nextCursor: null,
				hasMore: false,
				totalCommentCount: items.length,
			};
		} else throw new Error(`未实现的预览接口：${path}`);
		return { success: true, code: 200, data } as Envelope<unknown>;
	};
}
