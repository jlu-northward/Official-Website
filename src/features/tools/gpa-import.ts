import { gpaImportContent as copy } from "./content/gpa-import.ts";
import type { CourseDraft } from "./gpa.ts";

export interface SkippedGrade {
	row: number;
	name: string;
	score: string;
	credits?: string;
	nature?: string;
	term?: string;
	reason: "text" | "empty" | "invalid";
}
export interface GradeImport {
	courses: CourseDraft[];
	skipped: SkippedGrade[];
	total: number;
}

export interface GradeImportInfo extends Omit<GradeImport, "courses"> {
	fileName: string;
}

export function isGradeImportInfo(value: unknown): value is GradeImportInfo {
	if (!value || typeof value !== "object") return false;
	const info = value as GradeImportInfo;
	return (
		typeof info.fileName === "string" &&
		info.fileName.length <= 255 &&
		Number.isSafeInteger(info.total) &&
		info.total >= 0 &&
		Array.isArray(info.skipped) &&
		info.skipped.length <= info.total &&
		info.skipped.every(
			(item) =>
				item &&
				Number.isSafeInteger(item.row) &&
				item.row > 0 &&
				typeof item.name === "string" &&
				item.name.length <= 100 &&
				typeof item.score === "string" &&
				item.score.length <= 100 &&
				["text", "empty", "invalid"].includes(item.reason) &&
				(["credits", "nature", "term"] as const).every(
					(field) =>
						item[field] === undefined ||
						(typeof item[field] === "string" && item[field].length <= 100),
				),
		)
	);
}

export class GradeImportError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "GradeImportError";
	}
}

const text = (value: unknown): string =>
	typeof value === "string" || typeof value === "number"
		? String(value).trim()
		: "";
const header = (value: unknown) =>
	text(value).normalize("NFKC").replace(/\s+/g, "");
const numberText = (value: string) => /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value);

/** Parse values, not formulas/instructions, from the exported grade worksheet. */
export function parseGradeRows(rows: unknown[][]): GradeImport {
	if (!rows.length) throw new GradeImportError(copy.emptyError);
	const required = ["name", "score", "nature", "credits"] as const;
	const findColumns = (row: unknown[]) =>
		Object.fromEntries(
			Object.entries(copy.headers).map(([key, aliases]) => [
				key,
				row.findIndex((value) =>
					aliases.some((alias) => header(value) === alias),
				),
			]),
		) as Record<keyof typeof copy.headers, number>;
	const headerRow = rows.slice(0, 20).findIndex((row) => {
		const columns = findColumns(row);
		return required.every((key) => columns[key] >= 0);
	});
	if (headerRow < 0) throw new GradeImportError(copy.headerError);
	const columns = findColumns(rows[headerRow]);
	const courses: CourseDraft[] = [];
	const skipped: SkippedGrade[] = [];
	for (let index = headerRow + 1; index < rows.length; index++) {
		const row = rows[index];
		const name = text(row[columns.name]);
		if (!name || copy.headers.name.includes(header(row[columns.name])))
			continue;
		const score = text(row[columns.score]).normalize("NFKC");
		const credits = text(row[columns.credits]).normalize("NFKC");
		const nature = text(row[columns.nature]) || "其他";
		const term = text(row[columns.term]);
		if (
			name.length > 100 ||
			score.length > 100 ||
			credits.length > 20 ||
			nature.length > 30 ||
			term.length > 100
		)
			throw new GradeImportError(`第 ${index + 1} 行内容过长，请检查成绩表。`);
		const invalid = ["否", "无效", "false", "0"].includes(
			text(row[columns.valid]).toLowerCase(),
		);
		if (!numberText(score) || invalid) {
			skipped.push({
				row: index + 1,
				name,
				score,
				credits,
				nature,
				term,
				reason: invalid ? "invalid" : score ? "text" : "empty",
			});
			continue;
		}
		const course = {
			id: `excel-row-${index + 1}`,
			name,
			score,
			credits,
			nature,
			term,
		};
		if (
			course.name.length > 100 ||
			course.score.length > 20 ||
			course.credits.length > 20 ||
			course.nature.length > 30 ||
			course.term.length > 100
		)
			throw new GradeImportError(`第 ${index + 1} 行内容过长，请检查成绩表。`);
		courses.push(course);
		if (courses.length > copy.maxCourses)
			throw new GradeImportError(copy.limitError);
	}
	if (!courses.length && !skipped.length)
		throw new GradeImportError(copy.noCoursesError);
	return { courses, skipped, total: courses.length + skipped.length };
}
