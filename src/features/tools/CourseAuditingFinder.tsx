import { useEffect, useMemo, useRef, useState } from "react";
import {
	FiBookOpen,
	FiChevronLeft,
	FiChevronRight,
	FiMapPin,
	FiRefreshCw,
	FiSearch,
	FiUser,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { classroomContent } from "./content/classrooms";
import { courseAuditingContent as copy } from "./content/course-auditing";
import {
	createCourseIndex,
	datesForCourseMeeting,
	formatCoursePeriods,
	formatCourseWeeks,
	queryCourses,
	type CourseIndex,
	type CourseQuery,
} from "./course-auditing";

const shortDate = (date: string) =>
	`${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;

export default function CourseAuditingFinder({ active }: { active: boolean }) {
	const [index, setIndex] = useState<CourseIndex | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const [name, setName] = useState("");
	const [teacher, setTeacher] = useState("");
	const [week, setWeek] = useState(0);
	const [query, setQuery] = useState<CourseQuery | null>(null);
	const [page, setPage] = useState(0);
	const resultsHeading = useRef<HTMLHeadingElement>(null);
	useEffect(() => {
		if (!active || index) return;
		const controller = new AbortController();
		let cancelled = false;
		setLoadFailed(false);
		fetch(copy.dataUrl, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) throw new Error("Could not load course data");
				return response.json();
			})
			.then((value: unknown) => {
				if (!cancelled) setIndex(createCourseIndex(value));
			})
			.catch(() => {
				if (!cancelled) setLoadFailed(true);
			});
		return () => {
			cancelled = true;
			controller.abort();
		};
	}, [active, index, attempt]);
	const results = useMemo(
		() => (index && query ? queryCourses(index, query) : null),
		[index, query],
	);
	const pageCount = results ? Math.ceil(results.length / copy.pageSize) : 0;
	const visibleResults =
		results?.slice(page * copy.pageSize, (page + 1) * copy.pageSize) ?? [];
	const clearResults = () => {
		setQuery(null);
		setPage(0);
	};
	const changePage = (value: number) => {
		setPage(value);
		requestAnimationFrame(() => {
			resultsHeading.current?.focus({ preventScroll: true });
			resultsHeading.current?.scrollIntoView({
				block: "start",
				behavior: "instant",
			});
		});
	};
	if (!index)
		return (
			<div
				role="status"
				className="rounded-2xl border bg-card px-5 py-16 text-center text-sm text-muted-foreground"
			>
				<FiBookOpen
					className="mx-auto mb-4 h-7 w-7 text-primary"
					aria-hidden="true"
				/>
				<p>{loadFailed ? copy.loadError : copy.loading}</p>
				{loadFailed && (
					<Button
						variant="outline"
						className="mt-4"
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
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-xl font-semibold tracking-tight">{copy.title}</h2>
					<p className="mt-1.5 text-xs leading-6 text-muted-foreground sm:text-sm">
						{copy.description}
					</p>
				</div>
				<p className="pt-1 text-[11px] leading-5 text-muted-foreground">
					第 1 周始于 {index.data.semester.firstWeekMonday}
					<br />
					课表导入于 {index.data.importedAt}
				</p>
			</div>
			<form
				className="rounded-2xl border bg-card p-4 sm:p-6"
				onSubmit={(event) => {
					event.preventDefault();
					if (name.trim() || teacher.trim()) {
						setQuery({ name, teacher, week });
						setPage(0);
					}
				}}
			>
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<label
							htmlFor="auditing-course-name"
							className="text-xs font-medium"
						>
							课程名称
						</label>
						<Input
							id="auditing-course-name"
							maxLength={100}
							className="mt-2 h-11 rounded-xl text-base sm:text-sm"
							placeholder="例如：高等数学"
							value={name}
							onChange={(event) => {
								setName(event.target.value);
								clearResults();
							}}
						/>
					</div>
					<div>
						<label
							htmlFor="auditing-teacher-name"
							className="text-xs font-medium"
						>
							教师姓名
						</label>
						<Input
							id="auditing-teacher-name"
							maxLength={100}
							className="mt-2 h-11 rounded-xl text-base sm:text-sm"
							placeholder="输入教师姓名，可单独搜索"
							value={teacher}
							onChange={(event) => {
								setTeacher(event.target.value);
								clearResults();
							}}
						/>
					</div>
				</div>
				<p
					id="auditing-search-hint"
					className="mt-3 text-[11px] leading-5 text-muted-foreground"
				>
					{copy.searchHint}
				</p>
				<div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div className="sm:w-56">
						<label htmlFor="auditing-week" className="text-xs font-medium">
							教学周
						</label>
						<select
							id="auditing-week"
							className="mt-2 h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
							value={week}
							onChange={(event) => {
								setWeek(Number(event.target.value));
								clearResults();
							}}
						>
							<option value={0}>全部教学周</option>
							{Array.from({ length: index.data.semester.weeks }, (_, i) => (
								<option key={i + 1} value={i + 1}>
									第 {i + 1} 周
								</option>
							))}
						</select>
					</div>
					<Button
						type="submit"
						aria-describedby="auditing-search-hint"
						disabled={!name.trim() && !teacher.trim()}
						className="h-11 rounded-xl sm:min-w-44"
					>
						<FiSearch />
						查询课程安排
					</Button>
				</div>
			</form>
			<section aria-label="课程查询结果">
				{results && query ? (
					<>
						<div className="mb-4 flex flex-wrap items-end justify-between gap-2">
							<div role="status">
								<h3
									ref={resultsHeading}
									tabIndex={-1}
									className="scroll-mt-24 text-base font-semibold outline-none sm:scroll-mt-6"
								>
									{results.length ? (
										<>
											找到{" "}
											<span className="font-mono text-xl text-primary">
												{results.length}
											</span>{" "}
											个教学班
										</>
									) : (
										"没有找到匹配的课程"
									)}
								</h3>
								<p className="mt-1 text-xs leading-6 text-muted-foreground">
									{[
										query.name.trim() && `课程：${query.name.trim()}`,
										query.teacher.trim() && `教师：${query.teacher.trim()}`,
										query.week ? `第 ${query.week} 周` : "全部教学周",
									]
										.filter(Boolean)
										.join(" · ")}
								</p>
							</div>
							{results.length > 0 && (
								<span className="text-[11px] text-muted-foreground">
									第 {page * copy.pageSize + 1}—
									{Math.min((page + 1) * copy.pageSize, results.length)} 个
								</span>
							)}
						</div>
						{results.length ? (
							<div className="space-y-4">
								{visibleResults.map(({ id, course, meetings }) => (
									<article
										key={id}
										className="min-w-0 overflow-hidden rounded-2xl border bg-card"
									>
										<div className="px-4 py-4 sm:px-5">
											<h4 className="break-words text-base font-semibold leading-7">
												{course[1]}
											</h4>
											<p className="mt-1 flex items-start gap-1.5 text-sm text-primary">
												<FiUser
													className="mt-1 h-3.5 w-3.5 shrink-0"
													aria-hidden="true"
												/>
												<span className="break-words">
													{course[3] || "教师待公布"}
												</span>
											</p>
											<p className="mt-2 break-words text-[11px] text-muted-foreground">
												课程号 {course[0] || "未提供"} · 教学班{" "}
												{course[2] || "未提供"}
											</p>
										</div>
										{meetings.length ? (
											<ul className="divide-y border-t">
												{meetings.map((meeting) => {
													const dates = datesForCourseMeeting(
														index,
														meeting,
														query.week,
													);
													return (
														<li
															key={meeting.join("-")}
															className="px-4 py-4 text-xs leading-6 sm:px-5"
														>
															<div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
																<span>
																	{classroomContent.weekdays[meeting[0] - 1]}
																</span>
																<span>{formatCoursePeriods(meeting[1])}</span>
																<span className="font-normal text-muted-foreground">
																	{query.week
																		? `第 ${query.week} 周`
																		: formatCourseWeeks(
																				meeting[2],
																				index.data.semester.weeks,
																			)}
																</span>
															</div>
															{index.data.semester.firstWeekMonday && (
																<p className="mt-0.5 text-[11px] text-muted-foreground">
																	{dates.length === 0
																		? "本周无对应上课日"
																		: dates.length === 1
																			? shortDate(dates[0])
																			: `${shortDate(dates[0])}—${shortDate(dates[dates.length - 1])} · 共 ${dates.length} 次`}
																</p>
															)}
															<p className="mt-1 flex items-start gap-1.5 text-muted-foreground">
																<FiMapPin
																	className="mt-1.5 h-3 w-3 shrink-0"
																	aria-hidden="true"
																/>
																<span className="min-w-0 break-words">
																	{index.data.locations[meeting[3]] ||
																		"地点待公布"}
																</span>
															</p>
														</li>
													);
												})}
											</ul>
										) : (
											<p className="border-t px-4 py-4 text-xs leading-6 text-muted-foreground sm:px-5">
												课表尚未公布上课时间。
											</p>
										)}
									</article>
								))}
							</div>
						) : (
							<div className="rounded-2xl border border-dashed px-5 py-10 text-center text-sm leading-7 text-muted-foreground">
								试试缩短关键词，或切换到全部教学周。
								<br />
								也可以只填课程名或教师名。
							</div>
						)}
						{pageCount > 1 && (
							<nav
								aria-label="课程结果分页"
								className="mt-5 flex items-center justify-center gap-4"
							>
								<Button
									type="button"
									variant="outline"
									disabled={page === 0}
									onClick={() => changePage(page - 1)}
									aria-label="上一页课程"
								>
									<FiChevronLeft />
									上一页
								</Button>
								<span className="text-xs text-muted-foreground">
									{page + 1} / {pageCount}
								</span>
								<Button
									type="button"
									variant="outline"
									disabled={page + 1 >= pageCount}
									onClick={() => changePage(page + 1)}
									aria-label="下一页课程"
								>
									下一页
									<FiChevronRight />
								</Button>
							</nav>
						)}
					</>
				) : (
					<div className="rounded-2xl border border-dashed px-5 py-10 text-center">
						<FiBookOpen
							className="mx-auto mb-3 h-6 w-6 text-primary/60"
							aria-hidden="true"
						/>
						<p className="text-sm text-muted-foreground">
							输入课程名或教师名，查看上课时间与地点。
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
