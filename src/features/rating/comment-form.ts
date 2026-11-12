import type { Comment, Upload } from "./types";

export function buildCommentBody({
	content,
	score,
	anonymous,
	images,
	editing,
	isReply,
}: {
	content: string;
	score: number;
	anonymous: boolean;
	images: Upload[];
	editing?: Comment;
	isReply: boolean;
}) {
	const imageKeys = images.map((item) => item.objectKey);
	const originalImages = editing?.image_url || [];
	const sameImages =
		editing &&
		imageKeys.length === originalImages.length &&
		imageKeys.every((key, index) => key === originalImages[index]);
	return {
		// 编辑接口以省略字段表示保留，避免重写未改动的历史文本与图片。
		...(!editing || content !== editing.content
			? { content: content.trim() }
			: {}),
		is_anonymous: anonymous ? 1 : 0,
		...(!sameImages ? { image_url: imageKeys } : {}),
		...(!isReply ? { score } : {}),
	};
}
