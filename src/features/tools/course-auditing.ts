import {
	dateNumber,
	isClassroomSemester,
	teachingDayForDate,
	type ClassroomDataset,
} from "./classrooms.ts";

export type CourseMeeting = [
	weekday: number,
	periods: number,
	weeks: number,
	location: number,
];
export type AuditCourse = [
	code: string,
	name: string,
	section: string,
	teacher: string,
	meetings: CourseMeeting[],
];
export interface CourseDataset {
	schemaVersion: 1;
	semester: ClassroomDataset["semester"];
	importedAt: string;
	locations: string[];
	courses: AuditCourse[];
}
export interface CourseIndex {
	data: CourseDataset;
	entries: { id: number; course: AuditCourse; name: string; teacher: string }[];
	calendar: Map<string, string[]>;
}
export interface CourseQuery {
	name: string;
	teacher: string;
	week: number;
}
export interface CourseMatch {
	id: number;
	course: AuditCourse;
	meetings: CourseMeeting[];
}

const normalize = (text: string) =>
	text.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, "");
const integer = (value: unknown, min: number, max: number) =>
	typeof value === "number" &&
	Number.isInteger(value) &&
	value >= min &&
	value <= max;

export function createCourseIndex(value: unknown): CourseIndex {
	const fail = () => {
		throw new Error("课程数据格式有误，请重新加载。");
	};
	if (!value || typeof value !== "object") return fail();
	const data = value as CourseDataset;
	if (
		data.schemaVersion !== 1 ||
		!isClassroomSemester(data.semester) ||
		typeof data.importedAt !== "string" ||
		!Number.isFinite(dateNumber(data.importedAt)) ||
		!Array.isArray(data.locations) ||
		data.locations.some((place) => typeof place !== "string") ||
		!Array.isArray(data.courses) ||
		!data.courses.length
	)
		return fail();
	const entries = data.courses.map((course, id) => {
		if (
			!Array.isArray(course) ||
			course.length !== 5 ||
			course.slice(0, 4).some((text) => typeof text !== "string") ||
			!course[1].trim() ||
			!Array.isArray(course[4])
		)
			return fail();
		for (const meeting of course[4]) {
			if (
				!Array.isArray(meeting) ||
				meeting.length !== 4 ||
				!integer(meeting[0], 1, 7) ||
				!integer(meeting[1], 1, 4095) ||
				!integer(meeting[2], 1, 2 ** data.semester.weeks - 1) ||
				!integer(meeting[3], 0, data.locations.length - 1)
			)
				return fail();
		}
		return {
			id,
			course,
			name: normalize(course[1]),
			teacher: normalize(course[3]),
		};
	});
	const calendar = new Map<string, string[]>();
	if (data.semester.firstWeekMonday) {
		const first = dateNumber(data.semester.firstWeekMonday);
		for (let day = 0; day < data.semester.weeks * 7; day++) {
			const date = new Date(first + day * 86_400_000)
				.toISOString()
				.slice(0, 10);
			const teachingDay = teachingDayForDate(data.semester, date);
			if (!teachingDay) continue;
			const key = `${teachingDay.week}-${teachingDay.weekday}`;
			if (!calendar.has(key)) calendar.set(key, []);
			calendar.get(key)!.push(date);
		}
	}
	return { data, entries, calendar };
}

export function queryCourses(
	index: CourseIndex,
	query: CourseQuery,
): CourseMatch[] {
	const name = normalize(query.name);
	const teacher = normalize(query.teacher);
	if ((!name && !teacher) || !integer(query.week, 0, index.data.semester.weeks))
		throw new RangeError("请输入课程名或教师名，并选择有效教学周。");
	const matches = index.entries.filter(
		(entry) => entry.name.includes(name) && entry.teacher.includes(teacher),
	);
	const collator = new Intl.Collator("zh-CN", { numeric: true });
	matches.sort(
		(a, b) =>
			Number(b.name === name) - Number(a.name === name) ||
			Number(b.teacher === teacher) - Number(a.teacher === teacher) ||
			collator.compare(a.course[1], b.course[1]) ||
			collator.compare(a.course[3], b.course[3]) ||
			collator.compare(a.course[2], b.course[2]) ||
			a.id - b.id,
	);
	return matches
		.map(({ id, course }) => ({
			id,
			course,
			meetings: course[4].filter(
				(meeting) =>
					!query.week || Boolean(meeting[2] & (2 ** (query.week - 1))),
			),
		}))
		.filter((match) => !query.week || match.meetings.length > 0);
}

function maskValues(mask: number, count: number): number[] {
	return Array.from({ length: count }, (_, i) => i + 1).filter(
		(value) => mask & (2 ** (value - 1)),
	);
}

function ranges(values: number[]): string {
	const parts: string[] = [];
	for (let i = 0; i < values.length; i++) {
		const first = values[i];
		while (values[i + 1] === values[i] + 1) i++;
		parts.push(first === values[i] ? String(first) : `${first}—${values[i]}`);
	}
	return parts.join("、");
}

export function formatCourseWeeks(mask: number, totalWeeks: number): string {
	const weeks = maskValues(mask, totalWeeks);
	if (
		weeks.length >= 3 &&
		weeks.every((week, i) => i === 0 || week - weeks[i - 1] === 2)
	)
		return `第 ${weeks[0]}—${weeks[weeks.length - 1]} 周（${weeks[0] % 2 ? "单" : "双"}周）`;
	return `第 ${ranges(weeks)} 周`;
}

export const formatCoursePeriods = (mask: number) =>
	`第 ${ranges(maskValues(mask, 12))} 节`;

export function datesForCourseMeeting(
	index: CourseIndex,
	meeting: CourseMeeting,
	week = 0,
): string[] {
	return maskValues(meeting[2], index.data.semester.weeks)
		.filter((value) => !week || week === value)
		.flatMap((value) => index.calendar.get(`${value}-${meeting[0]}`) ?? [])
		.sort();
}
