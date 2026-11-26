export type MusicPlatform = "netease_music" | "qq_music";

export interface MusicRef {
	platform: MusicPlatform;
	id: string;
}

export interface MusicTrack {
	name: string;
	artists: string;
	coverUrl: string;
}

export interface MusicCard {
	ref: MusicRef;
	track: MusicTrack | null;
}

export interface SharePollChoice {
	text: string | null;
	votes: number;
}

export interface SharePoll {
	options: SharePollChoice[];
	totalVotes: number;
}

export interface ShareComment {
	authorName: string | null;
	authorAvatarUrl: string | null;
	replyName: string | null;
	text: string | null;
	position: number | null;
	createTime: string | null;
	imageUrls: string[];
}

export interface ShareFloor {
	first: ShareComment;
	replies: ShareComment[];
}

export interface PublicPostSharePage {
	postId: number;
	title: string | null;
	content: string | null;
	authorName: string | null;
	authorAvatarUrl: string | null;
	createTime: string | null;
	likeCount: number;
	commentCount: number;
	pv: number;
	coverUrl: string | null;
	imageUrls: string[];
	floors: ShareFloor[];
	totalFloors: number;
	essence: boolean;
	poll: SharePoll | null;
}
