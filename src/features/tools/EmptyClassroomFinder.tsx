import { useEffect, useMemo, useState } from "react";
import {
	FiCalendar,
	FiHeart,
	FiMapPin,
	FiRefreshCw,
	FiSearch,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { classroomContent as copy } from "./content/classrooms";
import {
	buildingKey,
	createClassroomIndex,
	queryEmptyClassrooms,
	teachingDayForDate,
	type ClassroomIndex,
	type ClassroomQuery,
} from "./classrooms";

const selectClass =
	"h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
const periods = Array.from({ length: 12 }, (_, i) => i + 1);
const presets = [
	[1, 2],
	[3, 4],
	[5, 6],
	[7, 8],
	[9, 12],
	[1, 12],
];
const todayInChina = () =>
	new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date());

export default function EmptyClassroomFinder({ active }: { active: boolean }) {
	const [index, setIndex] = useState<ClassroomIndex | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const [campus, setCampus] = useState("");
	const [building, setBuilding] = useState("");
	const [mode, setMode] = useState<"week" | "date">("week");
	const [date, setDate] = useState(todayInChina);
	const [week, setWeek] = useState(1);
	const [weekday, setWeekday] = useState(1);
	const [startPeriod, setStartPeriod] = useState(1);
	const [endPeriod, setEndPeriod] = useState(2);
	const [query, setQuery] = useState<ClassroomQuery | null>(null);
	const [favorites, setFavorites] = useState<string[]>([]);
	const [storageNotice, setStorageNotice] = useState("");

	useEffect(() => {
		if (!active || index) return;
		const controller = new AbortController();
		let cancelled = false;
		setLoadFailed(false);
		fetch(copy.dataUrl, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) throw new Error("Could not load classroom data");
				return response.json();
			})
			.then((value: unknown) => {
				if (cancelled) return;
				const loaded = createClassroomIndex(value);
				setIndex(loaded);
				const firstCampus = loaded.campuses.includes("前卫")
					? "前卫"
					: loaded.campuses[0];
				const priority = copy.buildingPriority[firstCampus] ?? [];
				const firstBuilding =
					priority.find((name) =>
						loaded.buildings.some(
							(item) => item.campus === firstCampus && item.name === name,
						),
					) ??
					loaded.buildings.find((item) => item.campus === firstCampus)!.name;
				setCampus(firstCampus);
				setBuilding(firstBuilding);
				const current = teachingDayForDate(
					loaded.data.semester,
					todayInChina(),
				);
				if (current) {
					setWeek(current.week);
					setWeekday(current.weekday);
					setMode("date");
				}
			})
			.catch(() => {
				if (!cancelled) setLoadFailed(true);
			});
		return () => {
			cancelled = true;
			controller.abort();
		};
	}, [active, index, attempt]);

	useEffect(() => {
		try {
			const saved: unknown = JSON.parse(
				localStorage.getItem(copy.storageKey) ?? "[]",
			);
			if (
				Array.isArray(saved) &&
				saved.length <= 100 &&
				saved.every((key) => typeof key === "string" && key.length < 200)
			)
				setFavorites([...new Set(saved)]);
		} catch {
			// Favorites are optional; searching does not depend on local storage.
		}
	}, []);

	const buildings = useMemo(() => {
		const priority = copy.buildingPriority[campus] ?? [];
		const rank = (name: string) => {
			if (favorites.includes(buildingKey(campus, name))) return -1;
			const position = priority.indexOf(name);
			return position >= 0 ? position : 100;
		};
		return (index?.buildings.filter((item) => item.campus === campus) ?? [])
			.slice()
			.sort(
				(a, b) =>
					rank(a.name) - rank(b.name) ||
					a.name.localeCompare(b.name, "zh-CN", { numeric: true }),
			);
	}, [index, campus, favorites]);
	const result = useMemo(
		() => (index && query ? queryEmptyClassrooms(index, query) : null),
		[index, query],
	);
	const dateDay = index ? teachingDayForDate(index.data.semester, date) : null;
	const selectedDay = mode === "date" ? dateDay : { week, weekday };
	const favorite = favorites.includes(buildingKey(campus, building));
	const savedBuildings =
		index?.buildings.filter((item) =>
			favorites.includes(buildingKey(item.campus, item.name)),
		) ?? [];
	const clearResult = () => setQuery(null);

	if (!index)
		return (
			<div
				role="status"
				className="rounded-2xl border bg-card px-5 py-16 text-center text-sm text-muted-foreground"
			>
				<FiCalendar
					className="mx-auto mb-4 h-7 w-7 text-primary"
					aria-hidden="true"
				/>
				<p>{loadFailed ? copy.loadError : copy.loading}</p>
				{loadFailed && (
					<Button
						className="mt-4"
						variant="outline"
						onClick={() => setAttempt((value) => value + 1)}
					>
						<FiRefreshCw />
						重新加载
					</Button>
				)}
			</div>
		);

	return (
		<div className="space-y-5 sm:space-y-7">
			<div>
				<h2 className="text-xl font-semibold tracking-tight">{copy.title}</h2>
				<p className="mt-1.5 text-xs leading-6 text-muted-foreground sm:text-sm">
					{copy.dataSource(index.data.importedAt)}
				</p>
			</div>
			<form
				className="rounded-2xl border bg-card p-4 sm:p-6"
				onSubmit={(event) => {
					event.preventDefault();
					if (selectedDay)
						setQuery({
							campus,
							building,
							...selectedDay,
							startPeriod,
							endPeriod,
						});
				}}
			>
				<div className="grid gap-4 sm:grid-cols-2">
					<label className="min-w-0 space-y-2 text-xs font-medium">
						校区
						<select
							aria-label="校区"
							className={cn(selectClass, "mt-2")}
							value={campus}
							onChange={(event) => {
								const next = event.target.value;
								setCampus(next);
								const priority = copy.buildingPriority[next] ?? [];
								setBuilding(
									priority.find((name) =>
										index.buildings.some(
											(item) => item.campus === next && item.name === name,
										),
									) ??
										index.buildings.find((item) => item.campus === next)!.name,
								);
								clearResult();
							}}
						>
							{index.campuses.map((name) => (
								<option key={name} value={name}>
									{name}校区
								</option>
							))}
						</select>
					</label>
					<div className="min-w-0">
						<div className="mb-2 flex items-center justify-between text-xs font-medium">
							<label htmlFor="classroom-building">教学楼</label>
							<button
								type="button"
								aria-pressed={favorite}
								aria-label={favorite ? "取消收藏当前教学楼" : "收藏当前教学楼"}
								className={cn(
									"flex items-center gap-1 rounded text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
									favorite ? "text-primary" : "text-muted-foreground",
								)}
								onClick={() => {
									const key = buildingKey(campus, building);
									const next = favorite
										? favorites.filter((item) => item !== key)
										: [...favorites, key];
									setFavorites(next);
									try {
										localStorage.setItem(copy.storageKey, JSON.stringify(next));
										setStorageNotice("");
									} catch {
										setStorageNotice(
											"收藏仅在本次打开时保留，浏览器暂时无法保存。",
										);
									}
								}}
							>
								<FiHeart
									className={cn("h-3 w-3", favorite && "fill-current")}
								/>
								{favorite ? "已收藏" : "收藏"}
							</button>
						</div>
						<select
							id="classroom-building"
							className={selectClass}
							value={building}
							onChange={(event) => {
								setBuilding(event.target.value);
								clearResult();
							}}
						>
							{buildings.map((item) => (
								<option key={item.name} value={item.name}>
									{item.name}
								</option>
							))}
						</select>
					</div>
				</div>
				{savedBuildings.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-2" aria-label="收藏的教学楼">
						{savedBuildings.map((item) => (
							<button
								key={buildingKey(item.campus, item.name)}
								type="button"
								className="rounded-full border px-3 py-1.5 text-[11px] text-muted-foreground outline-none hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
								onClick={() => {
									setCampus(item.campus);
									setBuilding(item.name);
									clearResult();
								}}
							>
								{item.campus} · {item.name}
							</button>
						))}
					</div>
				)}
				{storageNotice && (
					<p role="status" className="mt-2 text-xs text-muted-foreground">
						{storageNotice}
					</p>
				)}
				<div className="my-5 border-t" />
				<div className="mb-3 flex items-center justify-between gap-3">
					<span className="text-xs font-medium">上课时间</span>
					{index.data.semester.firstWeekMonday && (
						<div
							className="flex gap-1 rounded-lg bg-muted p-1"
							aria-label="时间选择方式"
						>
							{(["date", "week"] as const).map((value) => (
								<button
									key={value}
									type="button"
									aria-pressed={mode === value}
									className={cn(
										"rounded-md px-3 py-1 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
										mode === value
											? "bg-card text-foreground shadow-sm"
											: "text-muted-foreground",
									)}
									onClick={() => {
										setMode(value);
										clearResult();
									}}
								>
									{value === "date" ? "按日期" : "按周次"}
								</button>
							))}
						</div>
					)}
				</div>
				{mode === "date" ? (
					<div className="min-w-0">
						<label
							className="text-xs text-muted-foreground"
							htmlFor="classroom-date"
						>
							查询日期
						</label>
						<Input
							id="classroom-date"
							type="date"
							className="mt-2 block h-11 w-full min-w-0 max-w-full appearance-none rounded-xl sm:max-w-sm"
							value={date}
							onChange={(event) => {
								setDate(event.target.value);
								clearResult();
							}}
						/>
						<p role="status" className="mt-2 text-xs text-muted-foreground">
							{dateDay
								? `第 ${dateDay.week} 周 · ${copy.weekdays[dateDay.weekday - 1]}`
								: "该日期不在可查询的教学日内，请选择其他日期或按周次查询。"}
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-3 sm:gap-4">
						<label className="text-xs text-muted-foreground">
							教学周
							<select
								aria-label="教学周"
								className={cn(selectClass, "mt-2 text-foreground")}
								value={week}
								onChange={(event) => {
									setWeek(Number(event.target.value));
									clearResult();
								}}
							>
								{Array.from(
									{ length: index.data.semester.weeks },
									(_, i) => i + 1,
								).map((value) => (
									<option key={value} value={value}>
										第 {value} 周
									</option>
								))}
							</select>
						</label>
						<label className="text-xs text-muted-foreground">
							星期
							<select
								aria-label="星期"
								className={cn(selectClass, "mt-2 text-foreground")}
								value={weekday}
								onChange={(event) => {
									setWeekday(Number(event.target.value));
									clearResult();
								}}
							>
								{copy.weekdays.map((name, i) => (
									<option key={name} value={i + 1}>
										{name}
									</option>
								))}
							</select>
						</label>
					</div>
				)}
				<div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
					<label className="text-xs text-muted-foreground">
						开始节次
						<select
							aria-label="开始节次"
							className={cn(selectClass, "mt-2 text-foreground")}
							value={startPeriod}
							onChange={(event) => {
								const value = Number(event.target.value);
								setStartPeriod(value);
								if (value > endPeriod) setEndPeriod(value);
								clearResult();
							}}
						>
							{periods.map((value) => (
								<option key={value} value={value}>
									第 {value} 节
								</option>
							))}
						</select>
					</label>
					<label className="text-xs text-muted-foreground">
						结束节次
						<select
							aria-label="结束节次"
							className={cn(selectClass, "mt-2 text-foreground")}
							value={endPeriod}
							onChange={(event) => {
								const value = Number(event.target.value);
								setEndPeriod(value);
								if (value < startPeriod) setStartPeriod(value);
								clearResult();
							}}
						>
							{periods.map((value) => (
								<option key={value} value={value}>
									第 {value} 节
								</option>
							))}
						</select>
					</label>
				</div>
				<div className="mt-3 flex flex-wrap gap-2">
					{presets.map(([start, end]) => (
						<button
							key={`${start}-${end}`}
							type="button"
							aria-pressed={startPeriod === start && endPeriod === end}
							className={cn(
								"rounded-lg border px-3 py-2 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
								startPeriod === start && endPeriod === end
									? "border-primary/30 bg-secondary text-primary"
									: "text-muted-foreground hover:border-primary/30",
							)}
							onClick={() => {
								setStartPeriod(start);
								setEndPeriod(end);
								clearResult();
							}}
						>
							{start === 1 && end === 12 ? "全天" : `${start}—${end} 节`}
						</button>
					))}
				</div>
				<Button
					type="submit"
					disabled={!selectedDay}
					className="mt-5 h-11 w-full rounded-xl sm:w-auto sm:min-w-44"
				>
					<FiSearch />
					查询空教室
				</Button>
			</form>
			<section aria-label="查询结果" aria-live="polite" aria-atomic="true">
				{result && query ? (
					<>
						<div className="mb-4 flex flex-wrap items-end justify-between gap-2">
							<div>
								<h3 className="text-base font-semibold">
									{result.length > 0 ? (
										<>
											找到{" "}
											<span className="font-mono text-xl text-primary">
												{result.length}
											</span>{" "}
											间空教室
										</>
									) : (
										"该时段没有空教室"
									)}
								</h3>
								<p className="mt-1 text-xs leading-6 text-muted-foreground">
									{query.campus} · {query.building} · 第 {query.week} 周
									{copy.weekdays[query.weekday - 1]} · 第 {query.startPeriod}—
									{query.endPeriod} 节
								</p>
							</div>
							<span className="text-[11px] text-muted-foreground">
								所选时段全程无排课
							</span>
						</div>
						{result.length > 0 ? (
							<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
								{result.map(([, , name, type]) => (
									<div
										key={name}
										className="min-w-0 rounded-xl border bg-card px-4 py-4"
									>
										<p className="break-words text-sm font-semibold">{name}</p>
										<p className="mt-1.5 text-[11px] text-muted-foreground">
											{type || "课表显示空闲"}
										</p>
									</div>
								))}
							</div>
						) : (
							<div className="rounded-2xl border border-dashed px-5 py-10 text-center text-sm text-muted-foreground">
								可以试试其他教学楼或缩短查询时段。
							</div>
						)}
					</>
				) : (
					<div className="rounded-2xl border border-dashed px-5 py-10 text-center">
						<FiMapPin
							className="mx-auto mb-3 h-6 w-6 text-primary/60"
							aria-hidden="true"
						/>
						<p className="text-sm text-muted-foreground">
							选好教学楼和时间，查找适合自习的教室。
						</p>
					</div>
				)}
			</section>
			<p className="text-[11px] leading-6 text-muted-foreground">
				{copy.coverage}
			</p>
		</div>
	);
}
