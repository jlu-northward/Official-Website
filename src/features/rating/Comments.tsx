import { useCallback, useEffect, useRef, useState } from "react";
import { FiHeart, FiMessageCircle } from "react-icons/fi";
import { call, request } from "./api";
import { type Comment, type CursorPage, type Upload } from "./types";
import {
	Cover,
	ErrorMessage,
	ImagesInput,
	Loading,
	Modal,
	useInfiniteLoad,
} from "./ui";

export interface ComposeTarget {
	editing?: Comment;
	reply?: Comment;
}
export function Composer({
	subjectId,
	target,
	onClose,
	onSaved,
}: {
	subjectId: number;
	target: ComposeTarget;
	onClose(): void;
	onSaved(): void;
}) {
	const editing = target.editing;
	const reply = target.reply;
	const isReply = Boolean(reply || editing?.parentId);
	const [score, setScore] = useState(editing?.score || 0);
	const [content, setContent] = useState(editing?.content || "");
	const [anonymous, setAnonymous] = useState(editing?.is_anonymous === 1);
	const [images, setImages] = useState<Upload[]>(
		(editing?.image_url || []).map((url) => ({ objectKey: url, url })),
	);
	const [busy, setBusy] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const submitting = useRef(false);
	async function submit(event: React.FormEvent) {
		event.preventDefault();
		if (submitting.current || uploading) return;
		if (!isReply && !score) {
			setError("请先点亮星星打分");
			return;
		}
		if (!content.trim() && !images.length) {
			setError("请写下体验或添加图片");
			return;
		}
		submitting.current = true;
		setBusy(true);
		setError("");
		const body = {
			content: content.trim(),
			is_anonymous: anonymous ? 1 : 0,
			image_url: images.map((item) => item.objectKey),
			...(!isReply ? { score } : {}),
		};
		try {
			if (editing)
				await request(
					`rate/comments/${editing.parentId ? 2 : 1}/${editing.rateId}`,
					body,
					"PUT",
				);
			else if (reply)
				await request(`rate/comments/${reply.rateId}/replies`, body, "POST");
			else await request("rate/submit", { ...body, subjectId }, "POST");
			onSaved();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			submitting.current = false;
			setBusy(false);
		}
	}
	return (
		<Modal
			title={
				editing
					? "编辑评价"
					: reply
						? `回复 ${reply.authorName || "同学"}`
						: "写下你的评价"
			}
			onClose={onClose}
			busy={busy || uploading}
		>
			<form className="rate-composer" onSubmit={submit}>
				{!isReply && (
					<div className="rate-star-picker" aria-label="选择评分">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								disabled={busy}
								aria-label={`${star * 2}分`}
								aria-pressed={score === star * 2}
								onClick={() => setScore(star * 2)}
								className={score >= star * 2 ? "lit" : ""}
							>
								★
							</button>
						))}
						<span>{score ? `${score}分` : "轻点星星评分"}</span>
					</div>
				)}
				<textarea
					aria-label="评价内容"
					placeholder={
						isReply ? "说点什么吧…" : "分享真实体验，帮助其他同学做选择…"
					}
					value={content}
					onChange={(event) => setContent(event.target.value)}
					maxLength={500}
					rows={5}
					disabled={busy}
				/>
				<p className="rate-counter">{content.length}/500</p>
				<ImagesInput
					images={images}
					onChange={setImages}
					disabled={busy}
					onBusy={setUploading}
				/>
				<label className="rate-check">
					<input
						type="checkbox"
						checked={anonymous}
						disabled={busy}
						onChange={(event) => setAnonymous(event.target.checked)}
					/>
					匿名发布
				</label>
				{error && <ErrorMessage error={error} />}
				<button
					className="rate-primary"
					type="submit"
					disabled={busy || uploading}
				>
					{busy ? "提交中…" : editing ? "保存修改" : "发布"}
				</button>
			</form>
		</Modal>
	);
}

export function CommentCard({
	comment,
	onReply,
	onEdit,
	onChanged,
	readOnly = false,
	compact = false,
	hidePreview = false,
}: {
	comment: Comment;
	onReply(comment: Comment): void;
	onEdit(comment: Comment): void;
	onChanged(): void;
	readOnly?: boolean;
	compact?: boolean;
	hidePreview?: boolean;
}) {
	const [liked, setLiked] = useState(comment.liked);
	const [count, setCount] = useState(comment.likeCount || 0);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [remove, setRemove] = useState(false);
	const [image, setImage] = useState<string | null>(null);
	const inFlight = useRef(false);
	useEffect(() => {
		setLiked(comment.liked);
		setCount(comment.likeCount || 0);
	}, [comment.liked, comment.likeCount]);
	async function like() {
		if (inFlight.current) return;
		inFlight.current = true;
		setBusy(true);
		setError("");
		try {
			const next = await request<{ liked: boolean; likeCount: number }>(
				`rate/comments/${comment.parentId ? 2 : 1}/${comment.rateId}/like`,
				{},
				liked ? "DELETE" : "POST",
			);
			setLiked(next.liked);
			setCount(next.likeCount);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			inFlight.current = false;
			setBusy(false);
		}
	}
	async function deleteComment() {
		if (inFlight.current) return;
		inFlight.current = true;
		setBusy(true);
		setError("");
		try {
			await request(`rate/comments/${comment.rateId}`, {}, "DELETE");
			setRemove(false);
			onChanged();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			inFlight.current = false;
			setBusy(false);
		}
	}
	const name = comment.is_anonymous
		? "匿名同学"
		: comment.authorName || "向北同学";
	const root = comment.rootId || comment.rateId;
	return (
		<article className={`rate-comment ${compact ? "compact" : ""}`}>
			<button
				className="rate-avatar-button"
				disabled={!comment.userId || Boolean(comment.is_anonymous)}
				aria-label={`查看${name}主页`}
				onClick={() =>
					void call("profile", { uid: comment.userId }).catch((e) =>
						setError(e.message),
					)
				}
			>
				<Cover src={comment.authorAvatar} title={name} />
			</button>
			<div className="rate-comment-body">
				<div className="rate-comment-meta">
					<b>{name}</b>
					{comment.score || comment.user_score ? (
						<span className="rate-score-badge">
							★ {comment.score || comment.user_score}分
						</span>
					) : null}
					{comment.is_owner && <small>我</small>}
				</div>
				{comment.replyToName && (
					<p className="rate-reply-to">
						回复 {comment.reply_to_anonymous ? "匿名同学" : comment.replyToName}
					</p>
				)}
				{comment.content && (
					<p className="rate-comment-text">{comment.content}</p>
				)}
				{!!comment.image_url?.length && (
					<div className="rate-comment-images">
						{comment.image_url.map((url, index) => (
							<button
								key={`${url}-${index}`}
								aria-label={`查看配图 ${index + 1}`}
								onClick={() => setImage(url)}
							>
								<Cover src={url} title={`配图 ${index + 1}`} />
							</button>
						))}
					</div>
				)}
				<div className="rate-comment-actions">
					<small>
						{comment.createTime?.replace("T", " ").slice(0, 16)}
						{comment.isEdited ? " · 已编辑" : ""}
					</small>
					<span>
						<button
							aria-label={liked ? "取消点赞" : "点赞"}
							className={liked ? "liked" : ""}
							disabled={busy || readOnly}
							onClick={like}
						>
							<FiHeart />
							{count || ""}
						</button>
						{!readOnly && (
							<button onClick={() => onReply(comment)}>
								<FiMessageCircle />
								回复
							</button>
						)}
						{comment.is_owner && !readOnly && (
							<>
								<button onClick={() => onEdit(comment)}>编辑</button>
								<button onClick={() => setRemove(true)}>删除</button>
							</>
						)}
					</span>
				</div>
				{error && <ErrorMessage error={error} />}
				{!hidePreview &&
					(comment.replyCount > 0 || Boolean(comment.replies?.length)) && (
						<div className="rate-reply-preview">
							{comment.replies?.slice(0, 1).map((reply) => (
								<p key={reply.rateId}>
									<b>{reply.is_anonymous ? "匿名同学" : reply.authorName}：</b>
									{reply.content || "[图片]"}
								</p>
							))}
							<a href={`#/subjects/${comment.subjectId}/replies/${root}`}>
								查看全部 {comment.replyCount || ""} 条回复 ›
							</a>
						</div>
					)}
			</div>
			{image && (
				<Modal title="查看图片" onClose={() => setImage(null)}>
					<Cover className="rate-full-image" src={image} title="评论图片" />
				</Modal>
			)}
			{remove && (
				<Modal
					title="删除这条评价？"
					onClose={() => setRemove(false)}
					busy={busy}
				>
					<p className="rate-dialog-copy">
						删除后将移除这条内容，相关评分统计会随之更新。
					</p>
					<div className="rate-dialog-actions">
						<button disabled={busy} onClick={() => setRemove(false)}>
							取消
						</button>
						<button
							className="rate-danger"
							disabled={busy}
							onClick={deleteComment}
						>
							{busy ? "删除中…" : "确认删除"}
						</button>
					</div>
					{error && <ErrorMessage error={error} />}
				</Modal>
			)}
		</article>
	);
}

export function Comments({
	subjectId,
	replyRoot,
	onCompose,
	onMutated,
	revision,
	readOnly = false,
}: {
	subjectId: number;
	replyRoot?: number;
	onCompose(target: ComposeTarget): void;
	onMutated(): void;
	revision: number;
	readOnly?: boolean;
}) {
	const [sort, setSort] = useState("createTime");
	const [items, setItems] = useState<Comment[]>([]);
	const [cursor, setCursor] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [total, setTotal] = useState(0);
	const generation = useRef(0);
	const busy = useRef(false);
	const endpoint = replyRoot
		? `rate/comments/${replyRoot}/replies`
		: `rate/comments/${subjectId}`;
	const load = useCallback(
		async (after: string | null, reset: boolean) => {
			if (busy.current && !reset) return;
			busy.current = true;
			const version = generation.current;
			setLoading(true);
			setError("");
			try {
				const data = await request<CursorPage>(endpoint, {
					size: 20,
					sortBy: sort,
					...(after ? { cursor: after } : {}),
				});
				if (version !== generation.current) return;
				if (data.items.some((item) => item.subjectId !== subjectId))
					throw new Error("回复不属于当前评分对象，请返回后重试");
				setItems((previous) =>
					reset
						? data.items
						: [
								...previous,
								...data.items.filter(
									(item) => !previous.some((old) => old.rateId === item.rateId),
								),
							],
				);
				setCursor(data.nextCursor);
				setHasMore(data.hasMore && Boolean(data.nextCursor));
				setTotal(data.totalCommentCount || 0);
			} catch (e) {
				if (version === generation.current) setError((e as Error).message);
			} finally {
				if (version === generation.current) {
					busy.current = false;
					setLoading(false);
				}
			}
		},
		[endpoint, sort],
	);
	useEffect(() => {
		generation.current++;
		setItems([]);
		setCursor(null);
		setHasMore(false);
		void load(null, true);
		return () => {
			generation.current++;
		};
	}, [load, revision]);
	const more = useCallback(() => {
		if (hasMore) void load(cursor, false);
	}, [hasMore, cursor, load]);
	const sentinel = useInfiniteLoad(more, !loading && !error && hasMore);
	return (
		<section className="rate-comments">
			<div className="rate-section-heading">
				<h2>
					{replyRoot ? "全部回复" : `全部评价${total ? ` · ${total}` : ""}`}
				</h2>
				<select
					aria-label="评论排序"
					value={sort}
					onChange={(event) => setSort(event.target.value)}
				>
					<option value="createTime">最新发布</option>
					<option value="likeCount">最多点赞</option>
				</select>
			</div>
			{items.map((comment) => (
				<CommentCard
					key={comment.rateId}
					comment={comment}
					onReply={(reply) => onCompose({ reply })}
					onEdit={(editing) => onCompose({ editing })}
					onChanged={onMutated}
					readOnly={readOnly}
					hidePreview={Boolean(replyRoot)}
				/>
			))}
			{error && (
				<ErrorMessage
					error={error}
					retry={() => void load(cursor, !items.length)}
				/>
			)}
			{loading && <Loading />}
			{!loading && !error && !items.length && (
				<p className="rate-empty">
					{replyRoot ? "还没有回复" : "还没有评价，来分享你的体验"}
				</p>
			)}
			<div ref={sentinel} className="rate-footer">
				{!loading &&
					!error &&
					items.length > 0 &&
					(hasMore ? <button onClick={more}>加载更多</button> : "已经到底了")}
			</div>
		</section>
	);
}
