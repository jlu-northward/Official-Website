import { gpaTranscriptContent as copy } from "./content/gpa-transcript.ts";
import {
	calculateGpa,
	coursesInScope,
	inspectCourse,
	isRequiredCourse,
	type CourseDraft,
	type GpaScope,
} from "./gpa.ts";
import type { SkippedGrade } from "./gpa-import.ts";

export interface TranscriptCourse {
	id: string;
	name: string;
	score: string;
	credits: string;
	nature: string;
	points: number | null;
	included: boolean;
	note: string;
}

export interface TranscriptGroup {
	term: string;
	courses: TranscriptCourse[];
	result: ReturnType<typeof calculateGpa>;
}

export interface GpaTranscript {
	scope: GpaScope;
	groups: TranscriptGroup[];
	count: number;
	calculatedCount: number;
	skippedCount: number;
	result: ReturnType<typeof calculateGpa>;
}

/** Includes display-only grades without ever feeding them into GPA calculation. */
export function buildGpaTranscript(
	courses: CourseDraft[],
	skipped: SkippedGrade[],
	scope: GpaScope,
): GpaTranscript {
	const entered = courses.filter((course) => !inspectCourse(course).empty);
	const grouped = new Map<
		string,
		{
			entries: { course: TranscriptCourse; order: number }[];
			numeric: CourseDraft[];
		}
	>();
	const groupFor = (term: string | undefined) => {
		const key = term?.trim() || "";
		if (!grouped.has(key)) grouped.set(key, { entries: [], numeric: [] });
		return grouped.get(key)!;
	};
	for (const [index, course] of entered.entries()) {
		const inspection = inspectCourse(course);
		const selected = scope === "all" || isRequiredCourse(course);
		const group = groupFor(course.term);
		const excelRow = /^excel-row-(\d+)$/.exec(course.id);
		group.entries.push({
			order: excelRow
				? Number(excelRow[1])
				: Number.MAX_SAFE_INTEGER - entered.length + index,
			course: {
				id: course.id,
				name: course.name.trim() || copy.unnamedCourse,
				score: course.score.trim() || copy.noGrade,
				credits: course.credits.trim() || "—",
				nature: course.nature?.trim() || copy.requiredNature,
				points: inspection.points,
				included: selected && inspection.valid,
				note: !inspection.valid
					? copy.incomplete
					: selected
						? copy.included
						: copy.excluded,
			},
		});
		group.numeric.push(course);
	}
	for (const grade of skipped) {
		groupFor(grade.term).entries.push({
			order: grade.row,
			course: {
				id: `skipped-row-${grade.row}`,
				name: grade.name.trim() || copy.unnamedCourse,
				score: grade.score.trim() || copy.noGrade,
				credits: grade.credits?.trim() || "—",
				nature: grade.nature?.trim() || copy.otherNature,
				points: null,
				included: false,
				note: copy.skippedReasons[grade.reason],
			},
		});
	}
	const groups = [...grouped.entries()]
		.sort(([a], [b]) => {
			if (!a || !b) return a ? -1 : b ? 1 : 0;
			return a.localeCompare(b, "zh-CN", { numeric: true });
		})
		.map(([term, group]) => ({
			term: term || copy.noTerm,
			courses: group.entries
				.sort((a, b) => a.order - b.order)
				.map((entry) => entry.course),
			result: calculateGpa(coursesInScope(group.numeric, scope)),
		}));
	const result = calculateGpa(coursesInScope(entered, scope));
	return {
		scope,
		groups,
		count: entered.length + skipped.length,
		calculatedCount: result.count,
		skippedCount: skipped.length,
		result,
	};
}
