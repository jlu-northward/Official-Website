// 合成样例：按旧表及现有 DTO 构造，不包含生产数据。
import type { Comment, Rank, Subject } from "./types";

export const legacyRank: Rank = {
	id: 6,
	title: "校园生活榜",
	description: null,
	status: 1,
	// 旧接口没有 subjectType 和 coverUrl。
};

export const legacySubject: Subject = {
	id: 60,
	rankListId: 6,
	title: "老食堂",
	description: "以前留下的校园记忆",
	coverUrl: null,
	status: 1,
	creatorUid: 0,
	avgScore: 7.5,
	totalCount: 2,
	// 不填校区、类型标签、月份或单品。
};

export const legacyComment: Comment = {
	rateId: 60,
	subjectId: 60,
	parentId: null,
	rootId: null,
	userId: null,
	authorName: "匿名用户",
	authorAvatar: null,
	content: "旧评价第一行\n第二行也要保留",
	image_url: ["https://example.com/rate/legacy-photo.jpg"],
	score: 7,
	user_score: 7,
	show_rate_badge: true,
	is_anonymous: 1,
	is_owner: true,
	liked: true,
	likeCount: 8,
	replyCount: 0,
	createTime: "2025-06-01T12:30:00",
	isEdited: 0,
	replies: [],
};
