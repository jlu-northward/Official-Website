import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
	FiPlus,
	FiRefreshCw,
	FiSearch,
	FiChevronRight,
	FiX,
} from "react-icons/fi";
import { request } from "./api";
import { ratingCopy, ratingImages } from "./content";
import {
	navigate,
	typeTags,
	type Rank,
	type Subject,
	type Page,
	type Params,
	safeImage,
} from "./types";
import {
	ErrorMessage,
	Loading,
	PageHeader,
	SubjectRow,
	rankStyle,
	Cover,
	useInfiniteLoad,
} from "./ui";

function FilterIndicator({ id }: { id: string }) {
	const reduceMotion = useReducedMotion();
	return (
		<motion.span
			className="rate-filter-indicator"
			aria-hidden="true"
			layoutId={reduceMotion ? undefined : id}
			initial={false}
			transition={{ type: "spring", bounce: 0, duration: 0.28 }}
		/>
	);
}

function RankPreview({ rank, campuses }: { rank: Rank; campuses: string[] }) {
	const [items, setItems] = useState<Subject[] | null>(null);
	const [error, setError] = useState("");
	const [retry, setRetry] = useState(0);
	const [failedCover, setFailedCover] = useState("");
	const cover = safeImage(rank.coverUrl);
	const hasCover = Boolean(cover && cover !== failedCover);
	useEffect(() => {
		let active = true;
		setError("");
		request<Page<Subject>>(`rate/subjects/${rank.id}`, {
			page: 1,
			size: 3,
			sortType: 0,
		})
			.then((data) => {
				if (active) {
					setItems(data.records);
				}
			})
			.catch((e) => {
				if (active) setError(e.message);
			});
		return () => {
			active = false;
		};
	}, [rank.id, retry]);
	return (
		<section
			className={`rate-rank-card ${hasCover ? "has-cover" : ""}`}
			style={rankStyle(rank.id)}
		>
			<a className="rate-rank-banner" href={`#/ranks/${rank.id}`}>
				{hasCover && (
					<img
						className="rate-rank-cover"
						src={cover}
						alt={`${rank.title}封面`}
						loading="lazy"
						onError={() => setFailedCover(cover)}
					/>
				)}
				<div className="rate-rank-copy">
					<h2>{rank.title}</h2>
					<p>{rank.description || ratingCopy.rankFallback}</p>
				</div>
				<span className="rate-rank-chevrons" aria-hidden="true">
					<FiChevronRight />
					<FiChevronRight />
					<FiChevronRight />
				</span>
			</a>
			<div className="rate-preview-list">
				{error ? (
					<ErrorMessage error={error} retry={() => setRetry((n) => n + 1)} />
				) : items === null ? (
					<Loading />
				) : items.length ? (
					items.map((subject) => (
						<SubjectRow
							key={subject.id}
							subject={subject}
							campuses={campuses}
							preview
						/>
					))
				) : (
					<p className="rate-empty">还没有评分对象，来推荐第一个吧</p>
				)}
			</div>
		</section>
	);
}
export function Overview({
	ranks,
	campuses,
}: {
	ranks: Rank[];
	campuses: string[];
}) {
	const [visible, setVisible] = useState(3);
	const load = useCallback(
		() => setVisible((value) => Math.min(value + 3, ranks.length)),
		[ranks.length],
	);
	const sentinel = useInfiniteLoad(load, visible < ranks.length);
	return (
		<>
			<header className="rate-overview-heading">
				<h1>向北评分榜</h1>
				<p>{ratingCopy.intro}</p>
			</header>
			<nav className="rate-directory" aria-label="全部榜单">
				<div className="rate-directory-tabs">
					{ranks.map((rank) => (
						<a
							key={rank.id}
							href={`#/ranks/${rank.id}`}
							className="rate-directory-item"
						>
							<span>{rank.title}</span>
						</a>
					))}
				</div>
			</nav>
			<div className="rate-ranks">
				{ranks.slice(0, visible).map((rank) => (
					<RankPreview key={rank.id} rank={rank} campuses={campuses} />
				))}
			</div>
			{!ranks.length && <p className="rate-empty">暂时还没有榜单</p>}
			<div ref={sentinel} className="rate-footer">
				{visible < ranks.length ? (
					<button onClick={load}>加载更多榜单</button>
				) : (
					ranks.length > 0 && "已加载全部榜单"
				)}
			</div>
		</>
	);
}

export function RankView({
	rank,
	campuses,
	query,
}: {
	rank: Rank;
	campuses: string[];
	query: string;
}) {
	const values = new URLSearchParams(query);
	const campus = values.get("campusCode") || "";
	const sort = values.get("sortType") || "0";
	const keyword = values.get("keyword") || "";
	const tag = values.get("tag") || "";
	const month = values.get("month") || "";
	const [search, setSearch] = useState(keyword);
	const searchInput = useRef<HTMLInputElement>(null);
	const filterScope = useId();
	const [items, setItems] = useState<Subject[]>([]);
	const [page, setPage] = useState(0);
	const [pages, setPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [failedCover, setFailedCover] = useState("");
	const cover = safeImage(rank.coverUrl);
	const campusTabs = useRef<HTMLDivElement>(null);
	const busy = useRef(false);
	const version = useRef(0);
	const filters: Params = {
		sortType: Number(sort),
		...(campus !== "" ? { campusCode: Number(campus) } : {}),
		...(keyword ? { keyword } : {}),
		...(tag ? { tag } : {}),
		...(month ? { month: Number(month) } : {}),
	};
	const filterKey = JSON.stringify(filters);
	const load = useCallback(
		async (next: number, reset = false) => {
			if (busy.current && !reset) return;
			const generation = version.current;
			busy.current = true;
			setLoading(true);
			setError("");
			try {
				const data = await request<Page<Subject>>(`rate/subjects/${rank.id}`, {
					...JSON.parse(filterKey),
					page: next,
					size: 20,
				});
				if (generation !== version.current) return;
				setItems((previous) =>
					reset
						? data.records
						: [
								...previous,
								...data.records.filter(
									(item) => !previous.some((old) => old.id === item.id),
								),
							],
				);
				setPage(data.current);
				setPages(data.pages);
				setTotal(data.total);
			} catch (e) {
				if (generation === version.current) setError((e as Error).message);
			} finally {
				if (generation === version.current) {
					busy.current = false;
					setLoading(false);
				}
			}
		},
		[rank.id, filterKey],
	);
	useEffect(() => {
		version.current++;
		busy.current = false;
		setItems([]);
		setPage(0);
		setPages(1);
		setSearch(keyword);
		void load(1, true);
		return () => {
			version.current++;
		};
	}, [load]);
	const loadMore = useCallback(() => {
		if (page < pages) void load(page + 1);
	}, [page, pages, load]);
	const sentinel = useInfiniteLoad(
		loadMore,
		!loading && !error && page > 0 && page < pages,
	);
	function update(changes: Record<string, string>) {
		const params = new URLSearchParams(query);
		params.delete("building");
		for (const [key, value] of Object.entries(changes)) {
			if (value === "") params.delete(key);
			else params.set(key, value);
		}
		navigate(`/ranks/${rank.id}${params.size ? `?${params}` : ""}`, true);
	}
	const hasLocation = rank.subjectType && rank.subjectType !== "general";
	useEffect(() => {
		const tabs = campusTabs.current;
		const selected = tabs?.querySelector<HTMLButtonElement>(
			'[aria-pressed="true"]',
		);
		if (!tabs || !selected) return;
		const bounds = tabs.getBoundingClientRect();
		const item = selected.getBoundingClientRect();
		// 仅移动校区横条，避免重置或恢复筛选时把整页滚走。
		if (item.left < bounds.left + 16) {
			tabs.scrollLeft += item.left - bounds.left - 16;
		} else if (item.right > bounds.right - 32) {
			tabs.scrollLeft += item.right - bounds.right + 32;
		}
	}, [campus, campuses.length, rank.id, hasLocation]);
	return (
		<LayoutGroup id={filterScope}>
			<PageHeader title="评分榜">
				<button
					className="rate-icon"
					aria-label="刷新榜单"
					onClick={() => {
						version.current++;
						void load(1, true);
					}}
				>
					<FiRefreshCw />
				</button>
			</PageHeader>
			<section className="rate-rank-intro" style={rankStyle(rank.id)}>
				{cover && cover !== failedCover && (
					<Cover
						src={cover}
						title={rank.title}
						onError={() => setFailedCover(cover)}
					/>
				)}
				<div>
					<h2>{rank.title}</h2>
					<p>{rank.description || ratingCopy.rankFallback}</p>
				</div>
				<img
					className="rate-rank-mascot"
					src={ratingImages.rankMascot}
					alt=""
					width={56}
					height={56}
				/>
			</section>
			<div className="rate-filters">
				<form
					className="rate-search"
					onSubmit={(event) => {
						event.preventDefault();
						update({ keyword: search.trim() });
					}}
				>
					<FiSearch aria-hidden="true" />
					<input
						ref={searchInput}
						aria-label="搜索评分对象"
						placeholder={ratingCopy.searchPlaceholder}
						enterKeyHint="search"
						maxLength={60}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					{search && (
						<button
							className="rate-search-clear"
							type="button"
							aria-label="清空搜索"
							onClick={() => {
								setSearch("");
								if (keyword) update({ keyword: "" });
								searchInput.current?.focus();
							}}
						>
							<FiX aria-hidden="true" />
						</button>
					)}
					<button className="rate-search-submit" type="submit">
						搜索
					</button>
				</form>
				{hasLocation && (
					<motion.div
						ref={campusTabs}
						layoutScroll
						className="rate-campus-tabs"
						role="group"
						aria-label="校区筛选"
					>
						<button
							className={!campus ? "selected" : ""}
							aria-pressed={!campus}
							onClick={() => update({ campusCode: "" })}
						>
							{!campus && <FilterIndicator id="campus" />}
							全部校区
						</button>
						{campuses.map((name, code) => (
							<button
								key={code}
								className={campus === String(code) ? "selected" : ""}
								aria-pressed={campus === String(code)}
								onClick={() => update({ campusCode: String(code) })}
							>
								{campus === String(code) && <FilterIndicator id="campus" />}
								{name}
							</button>
						))}
					</motion.div>
				)}
				{rank.subjectType === "photography" && (
					<div className="rate-month-tabs" role="group" aria-label="拍摄月份">
						<button
							className={`rate-chip ${!month ? "selected" : ""}`}
							aria-pressed={!month}
							onClick={() => update({ month: "" })}
						>
							全年
						</button>
						{Array.from({ length: 12 }, (_, i) => String(i + 1)).map(
							(value) => (
								<button
									key={value}
									className={`rate-chip ${month === value ? "selected" : ""}`}
									aria-pressed={month === value}
									onClick={() => update({ month: value })}
								>
									{value}月
								</button>
							),
						)}
					</div>
				)}

				{(typeTags[rank.subjectType || "general"] || []).length > 0 && (
					<div className="rate-chips" aria-label="类型筛选">
						<button
							className={`rate-chip ${!tag ? "selected" : ""}`}
							aria-pressed={!tag}
							onClick={() => update({ tag: "" })}
						>
							全部类型
						</button>
						{typeTags[rank.subjectType || "general"]?.map((value) => (
							<button
								key={value}
								className={`rate-chip ${value === tag ? "selected" : ""}`}
								aria-pressed={value === tag}
								onClick={() => update({ tag: value })}
							>
								{value}
							</button>
						))}
					</div>
				)}
			</div>
			<div className="rate-result-count">
				<div className="rate-result-summary">
					<span className="rate-result-label">
						<strong>{total}</strong>
						{ratingCopy.resultsUnit}
						{ratingCopy.resultsLabel}
					</span>
					{(campus || keyword || tag || month) && (
						<button
							className="rate-reset"
							aria-label="清除筛选"
							onClick={() => {
								campusTabs.current?.scrollTo({ left: 0 });
								navigate(`/ranks/${rank.id}`, true);
							}}
						>
							重置
						</button>
					)}
				</div>
				<div
					className="rate-sort-options rate-rank-sort"
					role="group"
					aria-label="排序"
				>
					{ratingCopy.sortOptions.map((option) => (
						<button
							key={option.value}
							className={sort === option.value ? "selected" : ""}
							aria-pressed={sort === option.value}
							aria-label={option.accessibleLabel}
							onClick={() => update({ sortType: option.value })}
						>
							{sort === option.value && <FilterIndicator id="sort" />}
							{option.label}
						</button>
					))}
				</div>
			</div>
			<section className="rate-full-list" style={rankStyle(rank.id)}>
				{items.map((subject, index) => (
					<SubjectRow
						key={subject.id}
						subject={subject}
						campuses={campuses}
						index={index}
					/>
				))}
			</section>
			{error && (
				<ErrorMessage
					error={error}
					retry={() => void load(page ? page + 1 : 1, page === 0)}
				/>
			)}
			{loading && <Loading />}
			{!loading && !error && !items.length && (
				<div className="rate-empty">
					<img
						className="rate-empty-image"
						src={ratingImages.empty}
						alt=""
						width={112}
						height={112}
					/>
					<p>没有符合条件的对象，试试其他筛选</p>
				</div>
			)}
			<div ref={sentinel} className="rate-footer">
				{!loading &&
					!error &&
					items.length > 0 &&
					(page < pages ? (
						<button onClick={loadMore}>加载更多</button>
					) : (
						"已经到底了"
					))}
			</div>
			{rank.status === 1 && (
				<div className="rate-actionbar">
					<button
						className="rate-floating"
						onClick={() => navigate(`/create?rankId=${rank.id}`)}
					>
						<FiPlus />
						添加评分对象
					</button>
				</div>
			)}
		</LayoutGroup>
	);
}
