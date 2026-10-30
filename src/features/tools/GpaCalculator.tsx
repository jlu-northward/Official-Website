import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	FiBookOpen,
	FiCheck,
	FiChevronDown,
	FiChevronRight,
	FiHelpCircle,
	FiInfo,
	FiPlus,
	FiShield,
	FiShare2,
	FiTrash2,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toolsContent } from "./content/tools";
import { gpaImportContent as importCopy } from "./content/gpa-import";
import { gpaTranscriptContent as transcriptCopy } from "./content/gpa-transcript";
import GpaExcelImport from "./GpaExcelImport";
import {
	isGradeImportInfo,
	type GradeImport,
	type GradeImportInfo,
	type SkippedGrade,
} from "./gpa-import";
import { buildGradeRecords } from "./gpa-records";
import {
	calculateGpa,
	coursesInScope,
	emptyCourses,
	inspectCourse,
	isRequiredCourse,
	isCourseDrafts,
	JLU_GRADE_SCALE,
	type CourseDraft,
	type GpaScope,
} from "./gpa";

const GpaTranscriptDialog = lazy(() => import("./GpaTranscriptDialog"));
const EMPTY_SKIPPED: SkippedGrade[] = [];

function CalculationRules() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					className="h-9 gap-1.5 px-2 text-xs text-muted-foreground"
				>
					<FiHelpCircle className="h-3.5 w-3.5" />
					计算规则
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85svh] max-w-lg overflow-y-auto rounded-2xl p-6">
				<DialogHeader>
					<DialogTitle>吉大绩点计算规则</DialogTitle>
					<DialogDescription className="pt-1 text-xs leading-6">
						{toolsContent.gpaRulesDescription}
					</DialogDescription>
				</DialogHeader>
				<div className="overflow-hidden rounded-xl border">
					<table className="w-full text-left text-sm">
						<thead className="bg-muted">
							<tr>
								<th scope="col" className="px-4 py-2.5 font-medium">
									百分制成绩
								</th>
								<th scope="col" className="px-4 py-2.5 text-right font-medium">
									单科绩点
								</th>
							</tr>
						</thead>
						<tbody>
							{JLU_GRADE_SCALE.map((range, index) => (
								<tr key={range.minimum} className="border-t">
									<td className="px-4 py-2 font-mono text-xs text-muted-foreground">
										{index === 0
											? "90 ≤ 成绩 ≤ 100"
											: `${range.minimum} ≤ 成绩 < ${JLU_GRADE_SCALE[index - 1].minimum}`}
									</td>
									<td className="px-4 py-2 text-right font-mono text-xs font-medium text-primary">
										{range.points.toFixed(1)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="rounded-xl bg-secondary/60 p-4 text-xs leading-6">
					<p className="font-medium text-primary">
						GPA = Σ（学分 × 单科绩点）÷ Σ 学分
					</p>
					<p className="mt-1 text-muted-foreground">
						每门课的加权值先保留两位小数，最终 GPA 保留五位小数。未及格课程以 0
						绩点参与计算，学分仍计入总学分。允许 0 学分课程，但总学分须大于 0。
					</p>
				</div>
				<p className="text-[11px] leading-5 text-muted-foreground">
					仅作为成绩估算工具，课程计入范围请按你的实际要求选择，最终以学校认定为准。
				</p>
			</DialogContent>
		</Dialog>
	);
}

const exampleCourses = (): CourseDraft[] => [
	{ id: "example-math", name: "高等数学", score: "92", credits: "4" },
	{ id: "example-english", name: "大学英语", score: "85", credits: "3" },
	{ id: "example-physics", name: "大学物理", score: "78", credits: "2" },
];

const formatNumber = (value: number) => Number(value.toFixed(3)).toString();

export default function GpaCalculator({ active }: { active: boolean }) {
	const [courses, setCourses] = useState<CourseDraft[]>(emptyCourses);
	const [scope, setScope] = useState<GpaScope>("required");
	const [expanded, setExpanded] = useState(false);
	const [importInfo, setImportInfo] = useState<GradeImportInfo | null>(null);
	const [shareOpen, setShareOpen] = useState(false);
	const [shareLoaded, setShareLoaded] = useState(false);
	const [stagedImport, setStagedImport] = useState<
		(GradeImport & { fileName: string }) | null
	>(null);
	const [loaded, setLoaded] = useState(false);
	const [storageStatus, setStorageStatus] = useState("loading");
	const [storageNotice, setStorageNotice] = useState("");
	const [pending, setPending] = useState<"clear" | "example" | "import" | null>(
		null,
	);
	const [touched, setTouched] = useState<Set<string>>(() => new Set());
	const focusAfterAdd = useRef<string | null>(null);
	const courseList = useRef<HTMLDivElement>(null);
	const confirmationTrigger = useRef<HTMLButtonElement | null>(null);
	const shareTrigger = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(toolsContent.storageKey);
			if (localStorage.getItem(toolsContent.gpaScopeStorageKey) === "all")
				setScope("all");
			if (saved !== null) {
				const parsed: unknown = JSON.parse(saved);
				if (isCourseDrafts(parsed)) setCourses(parsed);
				else if (
					parsed &&
					typeof parsed === "object" &&
					"courses" in parsed &&
					isCourseDrafts(parsed.courses)
				) {
					setCourses(parsed.courses);
					if ("importInfo" in parsed && isGradeImportInfo(parsed.importInfo))
						setImportInfo(parsed.importInfo);
				} else
					setStorageNotice(
						"本地记录格式有误，已打开空白清单。你可以正常重新录入。",
					);
			}
		} catch {
			setStorageNotice("暂时无法读取本地记录，你仍可以正常使用计算工具。");
		}
		setLoaded(true);
	}, []);

	useEffect(() => {
		if (!loaded) return;
		try {
			localStorage.setItem(
				toolsContent.storageKey,
				JSON.stringify({ courses, importInfo }),
			);
			localStorage.setItem(toolsContent.gpaScopeStorageKey, scope);
			setStorageStatus("saved");
		} catch {
			setStorageStatus("unavailable");
		}
	}, [courses, importInfo, scope, loaded]);

	useEffect(() => {
		if (!focusAfterAdd.current) return;
		document.getElementById(`name-${focusAfterAdd.current}`)?.focus();
		focusAfterAdd.current = null;
	}, [courses]);

	const scopedCourses = coursesInScope(courses, scope);
	const gradeRecords = buildGradeRecords(
		courses,
		importInfo?.skipped ?? EMPTY_SKIPPED,
	);
	const visibleRecords = expanded
		? gradeRecords
		: gradeRecords.slice(0, importCopy.previewCount);
	const enteredCourses = courses.filter(
		(course) => !inspectCourse(course).empty,
	);
	const enteredRecords = gradeRecords.filter(
		(record) => !inspectCourse(record.course).empty,
	);
	const requiredCount = enteredRecords.filter((record) =>
		isRequiredCourse(record.course),
	).length;
	const result = calculateGpa(scopedCourses);
	const hasData =
		enteredCourses.length > 0 || Boolean(importInfo?.skipped.length);
	const openShare = (event: { currentTarget: HTMLButtonElement }) => {
		shareTrigger.current = event.currentTarget;
		setShareLoaded(true);
		setShareOpen(true);
	};
	const complete =
		result.status === "ready" || result.status === "zero-credits";
	const updateCourse = (
		id: string,
		field: keyof Omit<CourseDraft, "id">,
		value: string,
	) => {
		const excludedRow = /^skipped-row-(\d+)$/.exec(id);
		if (excludedRow) {
			setImportInfo(
				(current) =>
					current && {
						...current,
						skipped: current.skipped.map((grade) =>
							grade.row === Number(excludedRow[1])
								? { ...grade, [field]: value }
								: grade,
						),
					},
			);
			return;
		}
		setCourses((current) =>
			current.map((course) =>
				course.id === id ? { ...course, [field]: value } : course,
			),
		);
	};
	const addCourse = () => {
		if (courses.length >= 200) return;
		const id = crypto.randomUUID();
		focusAfterAdd.current = id;
		setExpanded(true);
		setCourses((current) => [
			...current,
			{ id, name: "", score: "", credits: "", nature: "必修" },
		]);
	};
	const replaceCourses = (action: "clear" | "example") => {
		setCourses(action === "clear" ? emptyCourses() : exampleCourses());
		setTouched(new Set());
		setPending(null);
		setStorageNotice("");
		setImportInfo(null);
		setScope("required");
		setExpanded(false);
	};
	const commitImport = (value: GradeImport, fileName: string) => {
		setCourses(value.courses);
		setImportInfo({ fileName, total: value.total, skipped: value.skipped });
		setScope("required");
		setExpanded(
			coursesInScope(value.courses, "required").some(
				(course) => !inspectCourse(course).valid,
			),
		);
		setTouched(new Set());
		setPending(null);
		setStagedImport(null);
		setStorageNotice("");
	};
	const resultHint =
		result.status === "incomplete"
			? `还有 ${result.incomplete} 门课程的成绩或学分待完善`
			: result.status === "zero-credits"
				? "总学分须大于 0，请检查课程学分"
				: result.status === "overflow"
					? "输入的数值过大，请检查课程学分"
					: result.status === "empty"
						? hasData
							? enteredCourses.length === 0
								? importCopy.noNumericGrades
								: importCopy.emptyScope
							: "导入成绩表或填入成绩和学分，结果自动出现"
						: scope === "required"
							? "已按必修数字成绩计算"
							: "已按全部数字成绩计算";

	return (
		<div>
			<div className="mb-5 sm:mb-6">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2.5">
						<h2 className="text-lg font-semibold tracking-tight sm:text-xl">
							吉大绩点计算
						</h2>
						<span className="rounded-md border border-primary/15 bg-secondary px-2 py-0.5 text-[10px] font-medium text-primary">
							4.0 分制
						</span>
					</div>
					<CalculationRules />
				</div>
				<p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-[13px]">
					{importCopy.calculatorDescription}
				</p>
			</div>
			<GpaExcelImport
				fileName={importInfo?.fileName}
				onImport={(value, fileName) => {
					if (hasData) {
						setStagedImport({ ...value, fileName });
						confirmationTrigger.current = null;
						setPending("import");
					} else commitImport(value, fileName);
				}}
			/>
			{importInfo && (
				<div
					className="mb-5 text-xs leading-6 text-muted-foreground"
					role="status"
				>
					<p>
						<FiCheck className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
						{importCopy.importSummary(
							enteredRecords.length,
							importInfo.skipped.length,
						)}
					</p>
					{importInfo.skipped.length > 0 && (
						<details className="mt-1.5">
							<summary className="w-fit cursor-pointer text-[11px] text-primary underline-offset-4 hover:underline">
								{importCopy.skippedTitle}
							</summary>
							<ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border bg-card p-3 text-[11px]">
								{importInfo.skipped.map((item) => (
									<li
										key={item.row}
										className="flex justify-between gap-4 py-1"
									>
										<span className="min-w-0 break-words">{item.name}</span>
										<span className="shrink-0 text-right">
											{item.score || "—"} ·{" "}
											{importCopy.skippedReasons[item.reason]}
										</span>
									</li>
								))}
							</ul>
						</details>
					)}
				</div>
			)}

			{storageNotice && (
				<p
					role="status"
					className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-muted-foreground"
				>
					{storageNotice}
				</p>
			)}
			<div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
				<section
					aria-labelledby="course-list-title"
					className="min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card"
				>
					<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3.5 sm:px-5">
						<h3
							id="course-list-title"
							className="flex items-center gap-2 text-sm font-semibold"
						>
							<FiBookOpen className="h-4 w-4 text-primary" />
							课程清单
							<span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] font-medium text-primary">
								{gradeRecords.length}
							</span>
						</h3>
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								className="h-8 px-2 text-xs text-muted-foreground"
								onClick={(event) => {
									if (hasData) {
										confirmationTrigger.current = event.currentTarget;
										setPending("example");
									} else replaceCourses("example");
								}}
							>
								填入示例
							</Button>
							<span className="h-3 w-px bg-border" />
							<Button
								variant="ghost"
								disabled={!hasData}
								className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
								onClick={(event) => {
									confirmationTrigger.current = event.currentTarget;
									setPending("clear");
								}}
							>
								<FiTrash2 className="h-3 w-3" />
								清空
							</Button>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 bg-background/40 px-4 py-3 sm:px-5">
						<p className="text-[11px] text-muted-foreground">
							{importCopy.scopeTitle}
						</p>
						<div
							role="group"
							aria-label={importCopy.scopeTitle}
							className="flex rounded-lg border border-border/60 bg-card p-0.5"
						>
							{(["required", "all"] as const).map((value) => (
								<button
									key={value}
									type="button"
									aria-pressed={scope === value}
									onClick={() => {
										setScope(value);
										if (
											coursesInScope(courses, value).some((course) => {
												const inspection = inspectCourse(course);
												return !inspection.empty && !inspection.valid;
											})
										)
											setExpanded(true);
									}}
									className={cn(
										"flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3",
										scope === value
											? "bg-secondary font-medium text-primary"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									{value === "required" ? importCopy.required : importCopy.all}
									{hasData && (
										<span className="font-mono text-[10px] opacity-60">
											{value === "required"
												? requiredCount
												: enteredRecords.length}
										</span>
									)}
								</button>
							))}
						</div>
						<p className="w-full text-[10px] leading-5 text-muted-foreground/80 xl:ml-auto xl:w-auto">
							{importCopy.scopeHint}
						</p>
					</div>
					<div
						className="hidden grid-cols-[minmax(0,1fr)_76px_64px_44px_28px] gap-3 border-b border-border/60 px-5 py-2.5 text-[11px] text-muted-foreground sm:grid"
						aria-hidden="true"
					>
						<span>{importCopy.courseDetails}</span>
						<span>{importCopy.scoreLabel}</span>
						<span>学分</span>
						<span className="text-center">绩点</span>
						<span />
					</div>
					<div ref={courseList}>
						{visibleRecords.map(({ course, reason }, index) => {
							const inspection = inspectCourse(course);
							const points = reason ? null : inspection.points;
							const excludedNote = reason
								? importCopy.skippedReasons[reason]
								: scope === "required" && !isRequiredCourse(course)
									? importCopy.notInScope
									: "";
							const scoreError =
								!reason &&
								!inspection.scoreValid &&
								(course.score.length > 0 || touched.has(`${course.id}-score`));
							const creditError =
								!reason &&
								!inspection.creditsValid &&
								(course.credits.length > 0 ||
									touched.has(`${course.id}-credits`));
							const errors = [
								scoreError && "成绩须为 0–100 的数字",
								creditError && "学分须为不小于 0 的数字",
							].filter(Boolean);
							return (
								<div
									key={course.id}
									data-course-row
									className="relative border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/20 sm:px-5"
								>
									<div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_48px] items-center gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_76px_64px_44px_28px]">
										<div className="col-span-3 min-w-0 pr-8 sm:col-span-1 sm:pr-1">
											<div className="flex min-w-0 items-center gap-2">
												<span className="w-4 shrink-0 font-mono text-[10px] text-muted-foreground/50">
													{String(index + 1).padStart(2, "0")}
												</span>
												<label
													htmlFor={`name-${course.id}`}
													className="sr-only"
												>
													第 {index + 1} 门课程名称（选填）
												</label>
												<div className="relative min-w-0 flex-initial">
													<span
														aria-hidden="true"
														className="invisible block h-8 truncate whitespace-pre pr-1 text-base font-medium leading-8 sm:text-sm"
													>
														{course.name || "课程名称（选填）"}
													</span>
													<Input
														id={`name-${course.id}`}
														value={course.name}
														maxLength={100}
														onChange={(event) =>
															updateCourse(
																course.id,
																"name",
																event.target.value,
															)
														}
														placeholder="课程名称（选填）"
														title={course.name}
														className="absolute inset-0 h-8 min-w-0 rounded-md border-transparent bg-transparent px-0 text-base font-medium shadow-none placeholder:font-normal placeholder:text-muted-foreground/60 focus-visible:bg-background sm:text-sm"
													/>
												</div>
												<div className="relative shrink-0">
													<select
														aria-label={`第 ${index + 1} 门${importCopy.natureLabel}`}
														value={course.nature ?? "必修"}
														onChange={(event) =>
															updateCourse(
																course.id,
																"nature",
																event.target.value,
															)
														}
														title={course.nature ?? "必修"}
														className="h-6 max-w-[96px] appearance-none truncate rounded-md border border-transparent bg-secondary/60 pl-2 pr-5 text-[10px] font-medium text-primary outline-none transition-colors hover:border-primary/20 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring [&>option]:bg-card [&>option]:text-foreground"
													>
														{!importCopy.natureOptions.includes(
															course.nature ?? "必修",
														) && (
															<option value={course.nature}>
																{course.nature}
															</option>
														)}
														{importCopy.natureOptions.map((nature) => (
															<option key={nature} value={nature}>
																{nature}
															</option>
														))}
													</select>
													<FiChevronDown
														aria-hidden="true"
														className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-primary/60"
													/>
												</div>
											</div>
											<div className="ml-6 flex min-w-0 items-center">
												<Input
													aria-label={`第 ${index + 1} 门${importCopy.termLabel}`}
													value={course.term ?? ""}
													maxLength={100}
													onChange={(event) =>
														updateCourse(course.id, "term", event.target.value)
													}
													placeholder={importCopy.termPlaceholder}
													title={course.term}
													className="h-6 min-w-0 flex-1 rounded-md border-transparent bg-transparent px-0 text-[11px] text-muted-foreground shadow-none placeholder:text-muted-foreground/45 focus-visible:bg-background md:text-[11px]"
												/>
											</div>
										</div>
										<div className="min-w-0">
											<label
												htmlFor={`score-${course.id}`}
												className="mb-1.5 block text-[11px] text-muted-foreground sm:sr-only"
											>
												{importCopy.scoreLabel}
												<span className="sr-only">，第 {index + 1} 门课程</span>
											</label>
											<Input
												id={`score-${course.id}`}
												inputMode={reason ? "text" : "decimal"}
												readOnly={Boolean(reason)}
												value={
													course.score || (reason ? importCopy.noScore : "")
												}
												maxLength={reason ? 100 : 20}
												title={
													reason
														? `${course.score || "—"} · ${excludedNote}`
														: undefined
												}
												aria-invalid={scoreError}
												aria-describedby={
													scoreError
														? `errors-${course.id}`
														: excludedNote
															? `note-${course.id}`
															: undefined
												}
												onChange={(event) =>
													updateCourse(course.id, "score", event.target.value)
												}
												onBlur={() =>
													setTouched((current) =>
														new Set(current).add(`${course.id}-score`),
													)
												}
												placeholder="0–100"
												className={cn(
													"h-10 rounded-lg border-border/70 bg-background/50 px-3 font-mono text-base shadow-none focus-visible:bg-card sm:h-9 sm:text-sm",
													scoreError &&
														"border-destructive focus-visible:ring-destructive",
												)}
											/>
										</div>
										<div className="min-w-0">
											<label
												htmlFor={`credits-${course.id}`}
												className="mb-1.5 block text-[11px] text-muted-foreground sm:sr-only"
											>
												学分
												<span className="sr-only">，第 {index + 1} 门课程</span>
											</label>
											<Input
												id={`credits-${course.id}`}
												inputMode="decimal"
												value={course.credits}
												maxLength={20}
												aria-invalid={creditError}
												aria-describedby={
													creditError ? `errors-${course.id}` : undefined
												}
												onChange={(event) =>
													updateCourse(course.id, "credits", event.target.value)
												}
												onBlur={() =>
													setTouched((current) =>
														new Set(current).add(`${course.id}-credits`),
													)
												}
												placeholder="如 3"
												className={cn(
													"h-10 rounded-lg border-border/70 bg-background/50 px-3 font-mono text-base shadow-none focus-visible:bg-card sm:h-9 sm:text-sm",
													creditError &&
														"border-destructive focus-visible:ring-destructive",
												)}
											/>
										</div>
										<div className="text-center">
											<span className="mb-1.5 block text-[11px] text-muted-foreground sm:sr-only">
												绩点
											</span>
											<output
												aria-label={`第 ${index + 1} 门课程绩点`}
												className={cn(
													"flex h-10 items-center justify-center rounded-lg font-mono text-sm sm:h-9",
													points === null
														? "text-muted-foreground/50"
														: "bg-secondary/70 font-medium text-primary",
												)}
											>
												{points === null ? "—" : points.toFixed(1)}
											</output>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="absolute right-2 top-2 h-10 w-10 text-muted-foreground/60 hover:bg-destructive/5 hover:text-destructive sm:static sm:h-10 sm:w-7"
											aria-label={`删除第 ${index + 1} 门课程${course.name ? `：${course.name}` : ""}`}
											onClick={() => {
												if (reason) {
													setImportInfo(
														(current) =>
															current && {
																...current,
																skipped: current.skipped.filter(
																	(grade) =>
																		`skipped-row-${grade.row}` !== course.id,
																),
															},
													);
												} else {
													setCourses((current) =>
														current.filter((item) => item.id !== course.id),
													);
												}
												requestAnimationFrame(() => {
													const row =
														courseList.current?.querySelectorAll(
															"[data-course-row]",
														)[
															Math.max(
																0,
																Math.min(index, visibleRecords.length - 2),
															)
														];
													(
														row?.querySelector("input") ??
														document.getElementById("add-course")
													)?.focus();
												});
											}}
										>
											<FiTrash2 className="h-3.5 w-3.5" />
										</Button>
									</div>
									{excludedNote && (
										<p
											id={`note-${course.id}`}
											className="mt-2 text-[10px] leading-5 text-muted-foreground sm:ml-7"
										>
											{excludedNote}
										</p>
									)}
									{errors.length > 0 && (
										<p
											id={`errors-${course.id}`}
											className="mt-2 text-[11px] leading-5 text-destructive"
										>
											{errors.join("；")}
										</p>
									)}
								</div>
							);
						})}
						{gradeRecords.length === 0 && (
							<div className="px-4 py-12 text-center">
								<FiBookOpen className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
								<p className="text-sm text-muted-foreground">
									{hasData
										? importCopy.emptyScope
										: "从第一门课开始，记录这个学期。"}
								</p>
							</div>
						)}
					</div>
					{gradeRecords.length > importCopy.previewCount && (
						<div className="border-t px-4 py-2 text-center sm:px-5">
							<Button
								variant="ghost"
								className="h-10 w-full text-xs text-primary"
								onClick={() => setExpanded((value) => !value)}
							>
								{expanded
									? importCopy.collapse
									: `${importCopy.expand}（${gradeRecords.length} 门）`}
								<FiChevronRight
									className={cn(
										"ml-1 h-3.5 w-3.5 transition-transform",
										expanded ? "-rotate-90" : "rotate-90",
									)}
								/>
							</Button>
						</div>
					)}
					<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-3 py-2.5 sm:px-4">
						<Button
							id="add-course"
							variant="ghost"
							className="h-9 gap-1.5 rounded-lg px-2 text-xs text-primary hover:bg-secondary/70"
							onClick={addCourse}
							disabled={courses.length >= 200}
						>
							<FiPlus className="h-4 w-4" />
							{courses.length >= 200 ? "最多支持 200 门课程" : "添加一门课程"}
						</Button>
						<span
							className="flex items-center gap-1 pr-1 text-[10px] text-muted-foreground"
							title="支持小数成绩与学分 · 空白行不参与计算"
						>
							{storageStatus === "saved" && (
								<FiCheck className="h-3 w-3 text-primary" />
							)}
							{storageStatus === "saved"
								? "已在此设备保存"
								: storageStatus === "unavailable"
									? "本地保存不可用，请保留此页面"
									: "正在读取本地记录…"}
						</span>
					</div>
				</section>
				<aside
					id="gpa-result-details"
					className="scroll-mt-6 space-y-4 lg:sticky lg:top-6"
					aria-label="计算结果"
				>
					<div className="relative overflow-hidden rounded-2xl bg-[#244e43] p-5 text-white sm:p-6">
						<div className="tools-dot-grid pointer-events-none absolute -right-6 -top-5 h-36 w-36 text-white/[0.08]" />
						<div className="flex items-center justify-between">
							<h3 className="text-xs font-medium text-white/75">
								加权平均绩点
							</h3>
							<span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 text-[9px] text-[#d5e8d9]">
								<span className="h-1 w-1 rounded-full bg-[#c2dcb0]" />
								自动计算
							</span>
						</div>
						<div
							className="relative mb-3 mt-4 flex items-baseline gap-2 sm:mt-5"
							aria-live="polite"
							aria-atomic="true"
						>
							<output
								aria-label="加权平均绩点结果"
								className="font-mono text-[42px] font-light tracking-[-0.07em] text-[#d7ebc2] sm:text-[46px]"
							>
								{result.gpa === null ? "—.—————" : result.gpa.toFixed(5)}
							</output>
							<span className="shrink-0 font-mono text-xs text-white/40">
								/ 4.0
							</span>
						</div>
						<p role="status" className="text-[11px] leading-5 text-white/60">
							{resultHint}
						</p>
						<div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
							<div>
								<p className="text-[10px] text-white/55">参与课程</p>
								<p className="mt-1.5 font-mono text-xl">
									{result.count}
									<span className="ml-1.5 font-sans text-[10px] text-white/50">
										门
									</span>
								</p>
							</div>
							<div>
								<p className="text-[10px] text-white/55">总学分</p>
								<p className="mt-1.5 font-mono text-xl">
									{complete ? formatNumber(result.totalCredits) : "—"}
								</p>
							</div>
						</div>
						<Button
							type="button"
							disabled={!hasData}
							onClick={openShare}
							className="relative mt-5 h-11 w-full gap-2 rounded-xl border border-white/20 bg-white/10 text-xs text-white shadow-none hover:bg-white/20"
						>
							<FiShare2 className="h-3.5 w-3.5" />
							{transcriptCopy.trigger}
						</Button>
					</div>
					<details className="group rounded-2xl border bg-card px-5 py-4 lg:hidden">
						<summary className="flex min-h-7 cursor-pointer list-none items-center justify-between text-xs font-medium [&::-webkit-details-marker]:hidden">
							{toolsContent.gpaDetailsTitle}
							<FiChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
						</summary>
						<p className="mt-3 text-xs leading-6 text-muted-foreground">
							{toolsContent.gpaDetailsDescription}
						</p>
						<p className="mt-3 rounded-lg bg-background px-3 py-2.5 font-mono text-xs text-muted-foreground">
							{complete
								? `${result.totalWeighted.toFixed(2)} ÷ ${formatNumber(result.totalCredits)}`
								: "Σ (学分 × 绩点) ÷ Σ 学分"}
						</p>
					</details>
					<div className="hidden rounded-2xl border bg-card px-5 py-5 lg:block">
						<div className="mb-3 flex items-center gap-2 text-xs font-medium">
							<FiInfo className="h-3.5 w-3.5 text-primary" />
							怎么算出来的？
						</div>
						<p className="text-[12px] leading-6 text-muted-foreground">
							将每门课的学分乘以对应绩点，相加后除以总学分。
						</p>
						<div className="mt-4 flex items-center justify-between rounded-lg bg-background px-3 py-2.5 font-mono text-xs">
							<span className="text-muted-foreground">
								{complete
									? `${result.totalWeighted.toFixed(2)} ÷ ${formatNumber(result.totalCredits)}`
									: "Σ (学分 × 绩点) ÷ Σ 学分"}
							</span>
							<FiChevronRight className="h-3.5 w-3.5 text-primary" />
						</div>
						<p className="mt-3 text-[10px] leading-5 text-muted-foreground">
							未及格课程以 0
							绩点计入，学分同样参与加权。仅供估算，以学校认定为准。
						</p>
					</div>
					<p className="flex gap-2.5 px-1 text-[10px] leading-5 text-muted-foreground">
						<FiShield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
						课程信息仅保存在当前浏览器，不会上传。清除浏览器数据会一并删除记录。
					</p>
				</aside>
			</div>
			{active &&
				hasData &&
				loaded &&
				createPortal(
					<div
						data-mobile-result
						className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-4 pt-2 shadow-[0_-4px_24px_-12px_hsl(var(--foreground)/0.15)] backdrop-blur-xl lg:hidden"
						style={{
							paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
						}}
					>
						<div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
							<div>
								<p className="text-[10px] text-muted-foreground">
									当前加权平均绩点
								</p>
								<p
									className={cn(
										"mt-0.5 font-mono text-2xl leading-8 tracking-tight text-primary",
										result.gpa === null && "font-sans text-lg",
									)}
								>
									{result.gpa === null
										? result.status === "empty"
											? importCopy.noGpaLabel
											: "待完善"
										: result.gpa.toFixed(5)}
								</p>
							</div>
							<div className="min-w-0 text-right">
								<p className="max-w-[160px] text-[10px] leading-4 text-muted-foreground">
									{complete
										? `${result.count} 门课程 · ${formatNumber(result.totalCredits)} 学分`
										: resultHint}
								</p>
								<Button
									type="button"
									onClick={openShare}
									className="mt-1 h-9 gap-1.5 rounded-lg px-3 text-[11px]"
								>
									<FiShare2 className="h-3 w-3" />
									{transcriptCopy.trigger}
								</Button>
								<button
									type="button"
									className="sr-only focus:not-sr-only focus:inline-flex focus:min-h-8 focus:items-center focus:text-xs"
									onClick={() =>
										document
											.getElementById("gpa-result-details")
											?.scrollIntoView({
												block: "start",
												behavior: window.matchMedia(
													"(prefers-reduced-motion: reduce)",
												).matches
													? "instant"
													: "smooth",
											})
									}
								>
									计算明细
									<FiChevronRight className="h-3 w-3" />
								</button>
							</div>
						</div>
					</div>,
					document.body,
				)}
			{shareLoaded && (
				<Suspense fallback={null}>
					<GpaTranscriptDialog
						courses={courses}
						skipped={importInfo?.skipped ?? EMPTY_SKIPPED}
						scope={scope}
						open={shareOpen}
						onOpenChange={setShareOpen}
						onCloseAutoFocus={(event) => {
							event.preventDefault();
							shareTrigger.current?.focus();
						}}
					/>
				</Suspense>
			)}
			<Dialog
				open={pending !== null}
				onOpenChange={(open) => {
					if (!open) {
						setPending(null);
						setStagedImport(null);
					}
				}}
			>
				<DialogContent
					className="max-w-sm rounded-2xl p-6"
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						const trigger = confirmationTrigger.current;
						if (trigger && !trigger.disabled) trigger.focus();
						else document.getElementById("add-course")?.focus();
					}}
				>
					<DialogHeader>
						<DialogTitle>
							{pending === "clear"
								? "清空课程清单？"
								: pending === "import"
									? importCopy.importTitle
									: "用示例替换当前课程？"}
						</DialogTitle>
						<DialogDescription className="pt-2 text-sm leading-6">
							{pending === "clear"
								? "当前浏览器保存的课程记录也会清空。清空后可以重新录入。"
								: pending === "import"
									? `${stagedImport?.fileName}：${importCopy.importSummary(stagedImport?.total ?? 0, stagedImport?.skipped.length ?? 0)}${importCopy.importDescription}`
									: "当前课程会被三门示例课程替换。示例仅用于体验计算方式。"}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-2 gap-2">
						<Button
							variant="outline"
							onClick={() => {
								setPending(null);
								setStagedImport(null);
							}}
						>
							{importCopy.keepCourses}
						</Button>
						<Button
							variant={pending === "clear" ? "destructive" : "default"}
							onClick={() => {
								if (pending === "import" && stagedImport)
									commitImport(stagedImport, stagedImport.fileName);
								else if (pending === "clear" || pending === "example")
									replaceCourses(pending);
							}}
						>
							{pending === "clear"
								? "确认清空"
								: pending === "import"
									? importCopy.confirmImport
									: "填入示例"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
