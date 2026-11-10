import { useCallback, useEffect, useRef, useState } from "react";
import { FiPlus, FiRefreshCw, FiSearch, FiChevronRight } from "react-icons/fi";
import { request } from "./api";
import { ratingCopy } from "./content";
import {
	navigate,
	typeTags,
	type Rank,
	type Subject,
	type Page,
	type Location,
	type Params,
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

function RankPreview({ rank, campuses }: { rank: Rank; campuses: string[] }) {
	const [items, setItems] = useState<Subject[] | null>(null);
	const [error, setError] = useState("");
	const [retry, setRetry] = useState(0);
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
		<section className="rate-rank-card" style={rankStyle(rank.id)}>
			<a className="rate-rank-banner" href={`#/ranks/${rank.id}`}>
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
	const building = values.get("building") || "";
	const sort = values.get("sortType") || "0";
	const keyword = values.get("keyword") || "";
	const tag = values.get("tag") || "";
	const month = values.get("month") || "";
	const [search, setSearch] = useState(keyword);
	const [locations, setLocations] = useState<Location[]>([]);
	const [locationError, setLocationError] = useState("");
	const [locationRevision, setLocationRevision] = useState(0);
	const [items, setItems] = useState<Subject[]>([]);
	const [page, setPage] = useState(0);
	const [pages, setPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const busy = useRef(false);
	const version = useRef(0);
	const filters: Params = {
		sortType: Number(sort),
		...(campus !== "" ? { campusCode: Number(campus) } : {}),
		...(building ? { building } : {}),
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
	useEffect(() => {
		let active = true;
		setLocations([]);
		setLocationError("");
		if (rank.subjectType && rank.subjectType !== "general")
			request<Location[]>(`rate/subjects/${rank.id}/locations`)
				.then((data) => {
					if (active) setLocations(data);
				})
				.catch(() => {
					if (active) setLocationError("地点选项加载失败，请重试");
				});
		return () => {
			active = false;
		};
	}, [rank.id, rank.subjectType, locationRevision]);
	const loadMore = useCallback(() => {
		if (page < pages) void load(page + 1);
	}, [page, pages, load]);
	const sentinel = useInfiniteLoad(
		loadMore,
		!loading && !error && page > 0 && page < pages,
	);
	function update(changes: Record<string, string>) {
		const params = new URLSearchParams(query);
		for (const [key, value] of Object.entries(changes)) {
			if (value === "") params.delete(key);
			else params.set(key, value);
		}
		navigate(`/ranks/${rank.id}${params.size ? `?${params}` : ""}`, true);
	}
	const hasLocation = rank.subjectType && rank.subjectType !== "general";
	return (
		<>
			<PageHeader title="评分榜">
				<button
					className="rate-icon"
					aria-label="刷新榜单"
					onClick={() => {
						version.current++;
						setLocationRevision((value) => value + 1);
						void load(1, true);
					}}
				>
					<FiRefreshCw />
				</button>
			</PageHeader>
			<section className="rate-rank-intro" style={rankStyle(rank.id)}>
				<Cover src={rank.coverUrl} title={rank.title} />
				<div>
					<h2>{rank.title}</h2>
					<p>{rank.description || ratingCopy.rankFallback}</p>
				</div>
			</section>
			<div className="rate-filters">
				{locationError && (
					<ErrorMessage
						error={locationError}
						retry={() => setLocationRevision((value) => value + 1)}
					/>
				)}
				<form
					className="rate-search"
					onSubmit={(event) => {
						event.preventDefault();
						update({ keyword: search.trim() });
					}}
				>
					<FiSearch aria-hidden="true" />
					<input
						aria-label="搜索评分对象"
						placeholder="搜索店铺、地点或课程"
						maxLength={60}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<button type="submit">搜索</button>
				</form>
				<div className="rate-filter-row">
					{hasLocation && (
						<>
							<label>
								校区
								<select
									value={campus}
									onChange={(event) =>
										update({ campusCode: event.target.value, building: "" })
									}
								>
									<option value="">全部校区</option>
									{campuses.map((name, code) => (
										<option key={code} value={code}>
											{name}
										</option>
									))}
								</select>
							</label>
							<label>
								楼栋
								<select
									value={building}
									disabled={!campus}
									onChange={(event) => update({ building: event.target.value })}
								>
									<option value="">全部地点</option>
									{locations
										.find((item) => String(item.campusCode) === campus)
										?.buildings.map((name) => (
											<option key={name}>{name}</option>
										))}
								</select>
							</label>
						</>
					)}

					{rank.subjectType === "photography" && (
						<label className="rate-month-filter">
							拍摄月份
							<select
								value={month}
								onChange={(event) => update({ month: event.target.value })}
							>
								<option value="">全年</option>
								{Array.from({ length: 12 }, (_, i) => (
									<option key={i} value={i + 1}>
										{i + 1}月
									</option>
								))}
							</select>
						</label>
					)}
				</div>

				{(typeTags[rank.subjectType || "general"] || []).length > 0 && (
					<div className="rate-chips" aria-label="类型筛选">
						<button
							className={`rate-chip ${!tag ? "selected" : ""}`}
							onClick={() => update({ tag: "" })}
						>
							全部类型
						</button>
						{typeTags[rank.subjectType || "general"]?.map((value) => (
							<button
								key={value}
								className={`rate-chip ${value === tag ? "selected" : ""}`}
								onClick={() => update({ tag: value })}
							>
								{value}
							</button>
						))}
					</div>
				)}
			</div>
			<div className="rate-result-count">
				<span>
					<strong>{total}</strong> 个评分对象
				</span>
				<div className="rate-result-actions">
					<select
						aria-label="排序"
						value={sort}
						onChange={(event) => update({ sortType: event.target.value })}
					>
						<option value="0">综合排序</option>
						<option value="1">按得分排序</option>
						<option value="2">按人数排序</option>
					</select>
					{(campus || keyword || tag || month || building) && (
						<button onClick={() => navigate(`/ranks/${rank.id}`, true)}>
							清除筛选
						</button>
					)}
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
				<p className="rate-empty">没有符合条件的对象，试试其他筛选</p>
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
		</>
	);
}
