import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { teachingDayForDate } from "../src/features/tools/classrooms.ts";
import {
	createCourseIndex,
	datesForCourseMeeting,
	formatCoursePeriods,
	formatCourseWeeks,
	queryCourses,
} from "../src/features/tools/course-auditing.ts";

const fixture = () => ({
	schemaVersion: 1,
	semester: {
		name: "测试",
		firstWeekMonday: "2026-09-07",
		weeks: 18,
		dateOverrides: {
			"2026-09-12": { week: 1, weekday: 3 },
			"2026-09-14": null,
		},
	},
	importedAt: "2026-10-25",
	locations: ["前卫-逸夫楼-101", "", "线上教学-前卫"],
	courses: [
		["math-1", "高等数学", "01", "张三", [[1, 3, 5, 0]]],
		["math-1", "高等数学", "02", "李四", [[3, 12, 3, 1]]],
		["math-2", "高等数学拓展", "01", "张三、王五", [[1, 48, 2, 2]]],
		["ai", "AI 基础", "01", "Seyoon Kim", []],
	],
});
const search = (index, overrides) =>
	queryCourses(index, { name: "", teacher: "", week: 0, ...overrides });

test("course and teacher searches work independently and combine with AND semantics", () => {
	const index = createCourseIndex(fixture());
	assert.equal(search(index, { name: "高等数学" }).length, 3);
	assert.equal(search(index, { teacher: "张三" }).length, 2);
	assert.deepEqual(
		search(index, { name: "高等数学", teacher: "李四" }).map(
			({ course }) => course[2],
		),
		["02"],
	);
	assert.equal(search(index, { name: "AI", teacher: "李四" }).length, 0);
	assert.equal(
		search(index, { teacher: "ＳＥＹＯＯＮ ＫＩＭ" })[0].course[1],
		"AI 基础",
	);
	assert.equal(search(index, { name: " 高 等数学 " }).length, 3);
	assert.equal(search(index, { name: "不存在" }).length, 0);
});

test("week filtering respects disjoint weeks and retains unpublished schedules in all-week searches", () => {
	const index = createCourseIndex(fixture());
	assert.deepEqual(
		search(index, { teacher: "张三", week: 2 }).map(({ course }) => course[0]),
		["math-2"],
	);
	assert.deepEqual(
		search(index, { teacher: "张三", week: 3 }).map(({ course }) => course[0]),
		["math-1"],
	);
	assert.equal(search(index, { name: "AI" })[0].meetings.length, 0);
	assert.equal(search(index, { name: "AI", week: 1 }).length, 0);
	for (const query of [{}, { name: "  " }, { name: "数学", week: 19 }])
		assert.throws(() => search(index, query), RangeError);
});

test("calendar dates use the confirmed epoch and include makeup days and closures", () => {
	const index = createCourseIndex(fixture());
	assert.deepEqual(datesForCourseMeeting(index, [1, 3, 5, 0]), [
		"2026-09-07",
		"2026-09-21",
	]);
	assert.deepEqual(datesForCourseMeeting(index, [3, 12, 1, 0]), [
		"2026-09-09",
		"2026-09-12",
	]);
	assert.deepEqual(datesForCourseMeeting(index, [1, 3, 2, 0], 2), []);
	assert.deepEqual(datesForCourseMeeting(index, [1, 3, 5, 0], 3), [
		"2026-09-21",
	]);
	assert.deepEqual(teachingDayForDate(index.data.semester, "2026-10-25"), {
		week: 7,
		weekday: 7,
	});
});

test("week and period descriptions preserve holes, parity and individual lessons", () => {
	assert.equal(formatCourseWeeks(21, 18), "第 1—5 周（单周）");
	assert.equal(formatCourseWeeks(39, 18), "第 1—3、6 周");
	assert.equal(formatCourseWeeks(4, 18), "第 3 周");
	assert.equal(formatCoursePeriods(12), "第 3—4 节");
});

test("invalid calendars and broken location or week references reject the dataset", () => {
	for (const mutate of [
		(data) => {
			data.courses[0][4][0][3] = 20;
		},
		(data) => {
			data.courses[0][4][0][2] = 2 ** 20;
		},
		(data) => {
			data.courses[0][1] = "";
		},
		(data) => {
			data.semester.firstWeekMonday = "2026-09-08";
		},
		(data) => {
			data.importedAt = "invalid";
		},
	]) {
		const data = fixture();
		mutate(data);
		assert.throws(() => createCourseIndex(data));
	}
});

test("generated catalog matches the active semester and keeps teacher data separate", async () => {
	const manifest = JSON.parse(
		await readFile(
			new URL("../src/features/tools/data/classroom-data.json", import.meta.url),
			"utf8",
		),
	);
	const catalog = JSON.parse(
		await readFile(
			new URL(`../public${manifest.coursesUrl}`, import.meta.url),
			"utf8",
		),
	);
	const occupancy = JSON.parse(
		await readFile(
			new URL(`../public${manifest.url}`, import.meta.url),
			"utf8",
		),
	);
	const index = createCourseIndex(catalog);
	const config = JSON.parse(
		await readFile(
			new URL("../data/classroom-semester.json", import.meta.url),
			"utf8",
		),
	);
	const { buildingAliases: _aliases, ...calendar } = config;
	assert.deepEqual(catalog.semester, calendar);
	assert.deepEqual(occupancy.semester, catalog.semester);
	const course = catalog.courses.find((entry) => entry[4].length > 0);
	assert.ok(course);
	const match = search(index, {
		name: course[1],
		teacher: course[3],
	});
	assert.ok(match.some((result) => result.course === course));
	assert.equal(catalog.courses.length, occupancy.source.courseRows);
	assert.equal("courses" in occupancy, false);
});
