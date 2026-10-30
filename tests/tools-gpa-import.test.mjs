import assert from "node:assert/strict";
import { test } from "node:test";
import {
	calculateGpa,
	coursesInScope,
	isCourseDrafts,
	isRequiredCourse,
} from "../src/features/tools/gpa.ts";
import {
	isGradeImportInfo,
	parseGradeRows,
} from "../src/features/tools/gpa-import.ts";

const headers = [
	"学年学期",
	"课程名",
	"总成绩",
	"课程性质",
	"学分",
	"绩点",
	"是否有效",
];
const fixture = () => [
	headers,
	["2026 第一学期", "必修数学", "90", "必修", "3.0", "1.0", "是"],
	["2026 第一学期", "任选英语", 80, "选修", 2, 3, "是"],
	["2026 第一学期", "限选物理", "87", "限选", "1.0", "3.7", "是"],
	["2026 第一学期", "等级课程", "良好", "必修", "2.0", "3.3", "是"],
	["2026 第一学期", "未出分", "", "必修", "2.0", "", "是"],
];

test("grade export imports numeric grades, skips words even with points, and filters required/all", () => {
	const result = parseGradeRows(fixture());
	assert.equal(result.total, 5);
	assert.equal(result.courses.length, 3);
	assert.deepEqual(
		result.skipped.map((row) => [row.name, row.reason]),
		[
			["等级课程", "text"],
			["未出分", "empty"],
		],
	);
	assert.equal(result.courses[0].term, "2026 第一学期");
	assert.equal(result.skipped[0].term, "2026 第一学期");
	assert.equal(result.skipped[0].nature, "必修");
	assert.equal(result.skipped[0].credits, "2.0");
	assert.equal(calculateGpa(coursesInScope(result.courses, "required")).gpa, 4);
	assert.equal(
		calculateGpa(coursesInScope(result.courses, "all")).gpa.toFixed(5),
		"3.61667",
	);
	assert.ok(isCourseDrafts(result.courses));
});

test("saved import metadata retains display-only grades and rejects malformed local records", () => {
	const imported = parseGradeRows(fixture());
	const info = {
		fileName: "成绩.xlsx",
		total: imported.total,
		skipped: imported.skipped,
	};
	assert.ok(isGradeImportInfo(JSON.parse(JSON.stringify(info))));
	assert.equal(isGradeImportInfo({ ...info, total: 0 }), false);
	assert.equal(
		isGradeImportInfo({ ...info, skipped: [{ ...info.skipped[0], term: 42 }] }),
		false,
	);
	assert.equal(
		isGradeImportInfo({
			...info,
			skipped: [{ ...info.skipped[0], reason: "made-up" }],
		}),
		false,
	);
	assert.equal(isGradeImportInfo(null), false);
});

test("headers can move, include whitespace and repeat; blank rows do not become zero grades", () => {
	const result = parseGradeRows([
		["全部成绩查询"],
		[],
		["学分", " 课 程 名 称 ", "课程属性", "成绩"],
		[2, "正常", "必修课", "０"],
		[],
		["学分", "课程名称", "课程属性", "成绩"],
		[1, "待定", "选修", null],
	]);
	assert.equal(result.courses.length, 1);
	assert.equal(result.courses[0].score, "0");
	assert.equal(result.skipped.length, 1);
	assert.equal(calculateGpa(result.courses).gpa, 0);
	assert.ok(isRequiredCourse(result.courses[0]));
});

test("unknown nature stays out of required scope, old manual drafts remain required", () => {
	const result = parseGradeRows([headers, ["", "待分类", "95", "", "2"]]);
	assert.equal(coursesInScope(result.courses, "required").length, 0);
	assert.equal(coursesInScope(result.courses, "all").length, 1);
	const oldDraft = { id: "legacy", name: "旧记录", score: "85", credits: "2" };
	assert.ok(isCourseDrafts([oldDraft]));
	assert.ok(isRequiredCourse(oldDraft));
	assert.equal(isRequiredCourse({ ...oldDraft, nature: "非必修" }), false);
	assert.equal(isCourseDrafts([{ ...oldDraft, nature: 1 }]), false);
});

test("invalid numeric grades and credits stay editable and block their selected scope", () => {
	const rows = [
		headers,
		["", "有效必修", "90", "必修", "2"],
		["", "异常选修", "101", "选修", "未知"],
		["", "负数", "-1", "选修", "2"],
	];
	const { courses } = parseGradeRows(rows);
	assert.equal(courses.length, 3);
	assert.equal(
		calculateGpa(coursesInScope(courses, "required")).status,
		"ready",
	);
	assert.equal(
		calculateGpa(coursesInScope(courses, "all")).status,
		"incomplete",
	);
});

test("invalid records are reported, retakes are preserved rather than deduplicated", () => {
	const rows = [
		headers,
		["", "同名课程", "50", "必修", "2", "0", "否"],
		["", "同名课程", "59", "必修", "2", "0", "是"],
		["", "同名课程", "90", "必修", "2", "4", "是"],
	];
	const result = parseGradeRows(rows);
	assert.equal(result.skipped[0].reason, "invalid");
	assert.equal(result.courses.length, 2);
	assert.equal(calculateGpa(result.courses).gpa, 2);
});

test("all text or unpublished grades remain importable without creating GPA inputs", () => {
	const result = parseGradeRows([
		headers,
		["2026 第一学期", "等级课", "优秀", "必修", 2],
		["2026 第一学期", "未出分", "", "选修", 1],
	]);
	assert.equal(result.total, 2);
	assert.equal(result.courses.length, 0);
	assert.deepEqual(
		result.skipped.map((course) => course.reason),
		["text", "empty"],
	);
	assert.equal(calculateGpa(result.courses).status, "empty");
});

test("wrong templates, missing records and too many courses fail without partial data", () => {
	assert.throws(() => parseGradeRows([]), /为空/);
	assert.throws(() => parseGradeRows([["课程名", "成绩", "学分"]]), /课程性质/);
	assert.throws(() => parseGradeRows([headers, []]), /没有找到/);
	assert.throws(
		() =>
			parseGradeRows([
				headers,
				...Array.from({ length: 201 }, () => ["", "课程", "90", "必修", "1"]),
			]),
		/200/,
	);
});
