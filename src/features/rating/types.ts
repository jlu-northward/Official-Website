export type SubjectType =
	"general" | "food" | "photography" | "sports" | "study" | "course";
export interface Rank {
	id: number;
	title: string;
	description: string;
	coverUrl: string;
	status: number;
	subjectType?: SubjectType;
}
export interface Product {
	name: string;
	price: number | null;
}
export interface Subject {
	id: number;
	rankListId: number;
	title: string;
	description: string;
	coverUrl: string;
	status: number;
	avgScore: number;
	totalCount: number;
	creatorUid?: number;
	campusCode?: number | null;
	building?: string;
	address?: string;
	latitude?: number | null;
	longitude?: number | null;
	tags?: string[];
	recommendedMonths?: number[];
	products?: Product[];
	myComment?: Comment | null;
}
export interface Comment {
	rateId: number;
	subjectId: number;
	parentId?: number | null;
	rootId?: number | null;
	replyToName?: string;
	reply_to_anonymous?: number;
	authorName: string;
	authorAvatar?: string;
	userId?: number;
	content: string;
	image_url?: string[];
	score?: number;
	user_score?: number;
	show_rate_badge?: boolean;
	is_anonymous: number;
	is_owner: boolean;
	liked: boolean;
	likeCount: number;
	replyCount: number;
	createTime: string;
	isEdited?: number;
	replies?: Comment[];
}
export interface Page<T> {
	records: T[];
	current: number;
	pages: number;
	total: number;
	size: number;
}
export interface CursorPage {
	items: Comment[];
	nextCursor: string | null;
	hasMore: boolean;
	totalCommentCount: number;
}
export interface Location {
	campusCode: number;
	campusName: string;
	buildings: string[];
}
export interface Upload {
	objectKey: string;
	url: string | null;
}
export interface Envelope<T> {
	success: boolean;
	code?: number;
	message?: string;
	data: T;
}
export type Params = Record<string, unknown>;
export const typeLabels: Record<SubjectType, string> = {
	general: "综合",
	food: "美食",
	photography: "摄影",
	sports: "运动",
	study: "自习",
	course: "蹭课",
};
export const typeTags: Partial<Record<SubjectType, string[]>> = {
	photography: ["拍景", "拍人"],
	sports: ["室内", "室外", "跑步", "羽毛球", "乒乓球", "篮球", "健身", "台球"],
	study: ["图书馆", "教室"],
	course: ["人文", "理科", "公选课", "体育课"],
};
export const scoreText = (value: unknown) =>
	Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "0.0";
export const cleanTags = (text: string) => [
	...new Set(
		text
			.split(/[,，]/)
			.map((s) => s.trim())
			.filter(Boolean),
	),
];
export const locationText = (subject: Subject, campuses: string[]) =>
	[
		subject.campusCode == null ? "" : campuses[subject.campusCode],
		subject.building,
	]
		.filter(Boolean)
		.join(" · ");
export const safeImage = (value?: string | null) =>
	value && /^https?:\/\//.test(value) ? value : "";
export function readRoute() {
	return typeof window === "undefined"
		? "/"
		: window.location.hash.slice(1) || "/";
}
export function navigate(route: string, replace = false) {
	if (replace) {
		window.history.replaceState(window.history.state, "", `#${route}`);
		window.dispatchEvent(new HashChangeEvent("hashchange"));
	} else window.location.hash = route;
}
export function navigateBack(fallback: string) {
	if (Number(window.history.state?.ratingDepth) > 0) window.history.back();
	else navigate(fallback, true);
}
