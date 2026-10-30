/** JLU-Toolkit's `jida` mode; comparisons use the original unrounded score. */
export const JLU_GRADE_SCALE = [
	{ minimum: 90, points: 4.0 },
	{ minimum: 87, points: 3.7 },
	{ minimum: 84, points: 3.3 },
	{ minimum: 80, points: 3.0 },
	{ minimum: 77, points: 2.7 },
	{ minimum: 74, points: 2.3 },
	{ minimum: 70, points: 2.0 },
	{ minimum: 67, points: 1.7 },
	{ minimum: 64, points: 1.3 },
	{ minimum: 60, points: 1.0 },
	{ minimum: 0, points: 0.0 },
] as const;

export interface CourseDraft {
	id: string;
	name: string;
	score: string;
	credits: string;
	nature?: string;
	term?: string;
}

export type GpaScope = "required" | "all";

export function isRequiredCourse(course: CourseDraft): boolean {
	return /^(必修|必修课)$/.test(
		(course.nature ?? "必修").normalize("NFKC").replace(/\s+/g, ""),
	);
}

export const coursesInScope = (courses: CourseDraft[], scope: GpaScope) =>
	scope === "all" ? courses : courses.filter(isRequiredCourse);

export function gradePoint(score: number): number {
	if (!Number.isFinite(score) || score < 0 || score > 100) {
		throw new RangeError("成绩须在 0–100 之间");
	}
	return JLU_GRADE_SCALE.find((range) => score >= range.minimum)!.points;
}

function numericInput(value: string): number | null {
	// Reject partial numeric strings, exponent/hex syntax, and non-finite values.
	if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

export function inspectCourse(course: CourseDraft) {
	const empty =
		!course.name.trim() && !course.score.trim() && !course.credits.trim();
	const score = numericInput(course.score);
	const credits = numericInput(course.credits);
	const scoreValid = score !== null && score >= 0 && score <= 100;
	const creditsValid = credits !== null && credits >= 0;
	return {
		empty,
		score,
		credits,
		scoreValid,
		creditsValid,
		valid: scoreValid && creditsValid,
		points: scoreValid ? gradePoint(score) : null,
	};
}

export function calculateGpa(courses: CourseDraft[]) {
	const entered = courses.map(inspectCourse).filter((course) => !course.empty);
	const incomplete = entered.filter((course) => !course.valid).length;
	if (entered.length === 0 || incomplete > 0) {
		return {
			status: entered.length === 0 ? "empty" : "incomplete",
			incomplete,
			count: entered.length,
			totalCredits: 0,
			totalWeighted: 0,
			gpa: null,
		} as const;
	}
	let totalCredits = 0;
	let totalWeighted = 0;
	for (const course of entered) {
		totalCredits += course.credits!;
		// The reference rounds each course's credits × points to 2 decimals first.
		totalWeighted += Number((course.credits! * course.points!).toFixed(2));
	}
	if (!Number.isFinite(totalCredits) || !Number.isFinite(totalWeighted)) {
		return {
			status: "overflow",
			incomplete: 0,
			count: entered.length,
			totalCredits: 0,
			totalWeighted: 0,
			gpa: null,
		} as const;
	}
	return {
		status: totalCredits === 0 ? "zero-credits" : "ready",
		incomplete: 0,
		count: entered.length,
		totalCredits,
		totalWeighted,
		gpa: totalCredits === 0 ? null : totalWeighted / totalCredits,
	} as const;
}

export function isCourseDrafts(value: unknown): value is CourseDraft[] {
	return (
		Array.isArray(value) &&
		value.length <= 200 &&
		value.every(
			(course) =>
				course &&
				typeof course === "object" &&
				["id", "name", "score", "credits"].every(
					(field) => typeof course[field] === "string",
				) &&
				course.id.length > 0 &&
				course.name.length <= 100 &&
				course.score.length <= 20 &&
				course.credits.length <= 20 &&
				(course.nature === undefined ||
					(typeof course.nature === "string" && course.nature.length <= 30)) &&
				(course.term === undefined ||
					(typeof course.term === "string" && course.term.length <= 100)),
		) &&
		new Set(value.map((course) => course.id)).size === value.length
	);
}

export function emptyCourses(): CourseDraft[] {
	return [1, 2, 3].map((id) => ({
		id: `course-${id}`,
		name: "",
		score: "",
		credits: "",
	}));
}
