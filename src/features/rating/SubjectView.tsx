import { useEffect, useState } from "react";
import {
	FiEdit3,
	FiMapPin,
	FiNavigation,
	FiShare2,
	FiStar,
} from "react-icons/fi";
import { call, request } from "./api";
import { ratingCopy } from "./content";
import { type Rank, type Subject, scoreText, typeLabels } from "./types";
import {
	Cover,
	ErrorMessage,
	Loading,
	LocationLine,
	Modal,
	PageHeader,
	Stars,
	rankStyle,
} from "./ui";
import { Comments, Composer, type ComposeTarget } from "./Comments";

export function SubjectView({
	id,
	campuses,
	ranks,
	replyRoot,
}: {
	id: number;
	campuses: string[];
	ranks: Rank[];
	replyRoot?: number;
}) {
	const [subject, setSubject] = useState<Subject | null>(null);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [revision, setRevision] = useState(0);
	const [compose, setCompose] = useState<ComposeTarget | null>(null);
	const [cover, setCover] = useState(false);
	useEffect(() => {
		let active = true;
		setError("");
		request<Subject>(`rate/subject/${id}`)
			.then((data) => {
				if (active) setSubject(data);
			})
			.catch((e) => {
				if (active) setError(e.message);
			});
		return () => {
			active = false;
		};
	}, [id, revision]);
	const rank = ranks.find((item) => item.id === subject?.rankListId);
	const readOnly = subject?.status === 3 || rank?.status === 0;
	const refresh = () => {
		setCompose(null);
		setRevision((value) => value + 1);
	};
	async function share() {
		try {
			const url = `https://northward.zone/rating/#/subjects/${id}`;
			if (navigator.share)
				await navigator.share({ title: subject?.title, url });
			else {
				await navigator.clipboard.writeText(url);
				setNotice("链接已复制");
			}
		} catch (e) {
			if ((e as Error).name !== "AbortError")
				setNotice("暂时无法分享，请稍后重试");
		}
	}
	if (!subject)
		return (
			<>
				<PageHeader title="评分详情" />
				{error ? <ErrorMessage error={error} retry={refresh} /> : <Loading />}
			</>
		);
	return (
		<>
			<PageHeader
				title={replyRoot ? "全部回复" : rank?.title || "评分详情"}
				back={replyRoot ? `/subjects/${id}` : `/ranks/${subject.rankListId}`}
			>
				<button className="rate-icon" aria-label="分享" onClick={share}>
					<FiShare2 />
				</button>
			</PageHeader>
			{!replyRoot && (
				<>
					<section
						className="rate-detail-hero"
						style={rankStyle(subject.rankListId)}
					>
						<button
							className="rate-cover-button"
							onClick={() => setCover(true)}
						>
							<Cover src={subject.coverUrl} title={subject.title} />
						</button>
						<div>
							<span className="rate-eyebrow">
								{typeLabels[rank?.subjectType || "general"] || "校园"}评分
							</span>
							<h1>{subject.title}</h1>
							<LocationLine subject={subject} campuses={campuses} />
						</div>
					</section>
					<section className="rate-description">
						<p>{subject.description}</p>
						{!!subject.tags?.length && (
							<div className="rate-chips">
								{subject.tags.map((tag) => (
									<span className="rate-chip" key={tag}>
										{tag}
									</span>
								))}
							</div>
						)}
						{!!subject.recommendedMonths?.length && (
							<p className="rate-season">
								推荐月份：
								{subject.recommendedMonths
									.map((month) => `${month}月`)
									.join("、")}
							</p>
						)}
						{(subject.address ||
							subject.building ||
							(subject.latitude != null && subject.longitude != null)) && (
							<div className="rate-map-row">
								<span>
									<FiMapPin />
									<span>
										{subject.address || subject.building || "已标记位置"}
									</span>
								</span>
								<button
									aria-label="地图导航"
									onClick={() =>
										void call<boolean>("openMap", {
											latitude: subject.latitude,
											longitude: subject.longitude,
											name: subject.title,
											address: [
												subject.campusCode != null
													? campuses[subject.campusCode]
													: "",
												subject.building,
												subject.address,
											]
												.filter(Boolean)
												.join(" "),
										})
											.then((opened) => {
												if (!opened) setNotice("无法打开地图，请稍后重试");
											})
											.catch((e) => setNotice(e.message))
									}
								>
									<FiNavigation aria-hidden="true" />
									{ratingCopy.detail.navigation}
								</button>
							</div>
						)}
					</section>
					<section className="rate-rating-panel" aria-label="评分概况">
						<div className="rate-rating-overview">
							<div className="rate-detail-score">
								<span className="rate-score-label">
									{ratingCopy.detail.scoreLabel}
								</span>
								<div className="rate-score-value">
									<b>
										{subject.totalCount > 0 ? scoreText(subject.avgScore) : "—"}
									</b>
									{subject.totalCount > 0 && <span>/ 10</span>}
								</div>
							</div>
							<div className="rate-rating-stars">
								<Stars score={subject.totalCount > 0 ? subject.avgScore : 0} />
								<span>
									{subject.totalCount > 0
										? `${subject.totalCount}人评分`
										: "暂无评分 · 来分享第一份体验"}
								</span>
							</div>
						</div>
						{!readOnly && (
							<div className="rate-quick-rating">
								<div className="rate-quick-label">
									<strong>
										{subject.myComment
											? `我的评分 ${subject.myComment.score}分`
											: ratingCopy.detail.myRating}
									</strong>
									<span>
										{subject.myComment
											? ratingCopy.detail.editPrompt
											: ratingCopy.detail.ratePrompt}
									</span>
								</div>
								<div className="rate-quick-stars" aria-label="选择我的评分">
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											aria-label={`评${star * 2}分`}
											className={
												(subject.myComment?.score || 0) >= star * 2 ? "lit" : ""
											}
											onClick={() =>
												setCompose(
													subject.myComment
														? {
																editing: {
																	...subject.myComment,
																	score: star * 2,
																},
															}
														: { score: star * 2 },
												)
											}
										>
											<FiStar aria-hidden="true" />
										</button>
									))}
								</div>
							</div>
						)}
					</section>
					{!!subject.products?.length && (
						<section className="rate-products">
							<header>
								<h2>招牌单品</h2>
								<p>{ratingCopy.detail.productsHint}</p>
							</header>
							{subject.products.map((product, index) => (
								<div key={`${product.name}-${index}`}>
									<strong>{product.name}</strong>
									<span
										className={
											product.price == null ? "rate-price-empty" : "rate-price"
										}
									>
										{product.price == null
											? "价格待补充"
											: `¥${Number(product.price).toFixed(2)}`}
									</span>
								</div>
							))}
						</section>
					)}
				</>
			)}
			{notice && (
				<p className="rate-notice" role="status">
					{notice}
				</p>
			)}
			{error && <ErrorMessage error={error} retry={refresh} />}
			<Comments
				key={`${id}-${replyRoot || 0}`}
				subjectId={id}
				replyRoot={replyRoot}
				revision={revision}
				onCompose={setCompose}
				onMutated={refresh}
				readOnly={readOnly}
			/>
			{!replyRoot && !readOnly && (
				<div className="rate-actionbar rate-detail-actionbar">
					<button
						className="rate-comment-entry"
						onClick={() =>
							setCompose(
								subject.myComment ? { editing: subject.myComment } : {},
							)
						}
					>
						<FiEdit3 />
						{subject.myComment ? "修改我的评价…" : "我来评两句…"}
					</button>
					<button className="rate-icon" aria-label="分享评分" onClick={share}>
						<FiShare2 />
					</button>
				</div>
			)}
			{readOnly && <p className="rate-readonly">当前榜单或对象仅供浏览</p>}
			{compose && (
				<Composer
					subjectId={id}
					target={compose}
					onClose={() => setCompose(null)}
					onSaved={() => {
						setNotice("发布成功");
						refresh();
					}}
				/>
			)}
			{cover && (
				<Modal title={subject.title} onClose={() => setCover(false)}>
					<Cover
						className="rate-full-image"
						src={subject.coverUrl}
						title={subject.title}
					/>
				</Modal>
			)}
		</>
	);
}
