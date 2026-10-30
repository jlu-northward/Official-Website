import type { CourseDraft } from "./gpa.ts";
import type { SkippedGrade } from "./gpa-import.ts";

export interface GradeRecord {
	course: CourseDraft;
	source: "course" | "excluded";
	reason?: SkippedGrade["reason"];
	row?: number;
}

/** The course list contains every record; GPA eligibility is a separate concern. */
export function buildGradeRecords(
	courses: CourseDraft[],
	skipped: SkippedGrade[],
): GradeRecord[] {
	const records: GradeRecord[] = courses.map((course) => {
		const match = /^excel-row-(\d+)$/.exec(course.id);
		const row = match ? Number(match[1]) : undefined;
		return {
			course: { ...course },
			source: "course",
			row:
				row !== undefined && Number.isSafeInteger(row) && row > 0
					? row
					: undefined,
		};
	});
	for (const grade of skipped) {
		records.push({
			course: {
				id: `skipped-row-${grade.row}`,
				name: grade.name,
				score: grade.score,
				credits: grade.credits ?? "",
				nature: grade.nature ?? "其他",
				term: grade.term ?? "",
			},
			source: "excluded",
			reason: grade.reason,
			row: grade.row,
		});
	}
	return records.sort((a, b) => {
		if (a.row === undefined || b.row === undefined)
			return a.row === undefined ? (b.row === undefined ? 0 : 1) : -1;
		return a.row - b.row;
	});
}
