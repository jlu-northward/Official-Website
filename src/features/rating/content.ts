export const ratingCopy = {
	intro: "评出你心里的从夯到拉",
	rankFallback: "看看大家心里的排名",
	searchPlaceholder: "搜索店铺、地点、课程",
	resultsLabel: "评分对象",
	resultsUnit: "个",
	detail: {
		navigation: "导航",
		scoreLabel: "向北评分",
		ratePrompt: "轻点星星评分",
		editPrompt: "轻点星星修改",
		myRating: "我的评分",
		productsHint: "价格以店内为准",
	},
	commentSortOptions: [
		{ value: "createTime", label: "最新", accessibleLabel: "最新发布" },
		{ value: "likeCount", label: "最热", accessibleLabel: "最多点赞" },
	],
	sortOptions: [
		{ value: "0", label: "综合", accessibleLabel: "综合排序" },
		{ value: "1", label: "得分", accessibleLabel: "按得分排序" },
		{ value: "2", label: "人数", accessibleLabel: "按人数排序" },
	],
};

// 沿用原 App 评分页的本地素材。
export const ratingImages = {
	rankMascot: "/rating/emoji-right.webp",
	empty: "/rating/empty.webp",
};
