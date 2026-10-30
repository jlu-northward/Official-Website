import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGradeRecords } from "../src/features/tools/gpa-records.ts";
import { parseGradeRows } from "../src/features/tools/gpa-import.ts";
import {
	calculateGpa,
	coursesInScope,
	emptyCourses,
} from "../src/features/tools/gpa.ts";

test("the course list retains every imported grade in worksheet order while GPA only uses numeric grades", () => {
	const result = parseGradeRows([
		["课程名", "成绩", "课程性质", "学分", "学期", "是否有效"],
		["必修数学", 90, "必修", 3, "2026 第一学期", "是"],
		["等级课程", "优秀", "必修", 1, "2026 第一学期", "是"],
		["选修英语", 80, "选修", 2, "2026 第一学期", "是"],
		["未出分", "", "选修", 1, "2026 第二学期", "是"],
		["无效记录", 100, "必修", 2, "2026 第二学期", "否"],
	]);
	const snapshot = JSON.stringify(result);
	const records = buildGradeRecords(result.courses, result.skipped);
	assert.deepEqual(
		records.map(({ course }) => course.name),
		["必修数学", "等级课程", "选修英语", "未出分", "无效记录"],
	);
	assert.deepEqual(
		records.map(({ reason }) => reason),
		[undefined, "text", undefined, "empty", "invalid"],
	);
	assert.equal(records[1].course.score, "优秀");
	assert.equal(records[1].course.credits, "1");
	assert.equal(records[1].course.nature, "必修");
	assert.equal(records[1].course.term, "2026 第一学期");
	assert.equal(records[1].course.id, "skipped-row-3");
	assert.equal(calculateGpa(coursesInScope(result.courses, "required")).gpa, 4);
	assert.equal(calculateGpa(coursesInScope(result.courses, "all")).gpa, 3.6);
	assert.equal(JSON.stringify(result), snapshot);
});

test("manual rows including blank placeholders retain their order after imported rows", () => {
	const manual = emptyCourses();
	const records = buildGradeRecords(
		[
			manual[0],
			{ id: "excel-row-4", name: "较后", score: "80", credits: "2" },
			manual[1],
			{ id: "excel-row-2", name: "较前", score: "90", credits: "2" },
			manual[2],
		],
		[{ row: 3, name: "文字课", score: "良好", reason: "text" }],
	);
	assert.deepEqual(
		records.map(({ course }) => course.id),
		[
			"excel-row-2",
			"skipped-row-3",
			"excel-row-4",
			...manual.map(({ id }) => id),
		],
	);
	assert.equal(records[1].course.credits, "");
	assert.equal(records[1].course.nature, "其他");
	assert.equal(records[1].course.term, "");
	assert.equal(records[3].course.score, "");
	assert.notEqual(records[3].course, manual[0]);
});

test("retakes are distinct records and text-only imports are fully visible", () => {
	const records = buildGradeRecords(
		[],
		[
			{ row: 4, name: "同名课", score: "良好", reason: "text" },
			{ row: 2, name: "同名课", score: "优秀", reason: "text" },
		],
	);
	assert.equal(records.length, 2);
	assert.deepEqual(
		records.map(({ course }) => [course.id, course.score]),
		[
			["skipped-row-2", "优秀"],
			["skipped-row-4", "良好"],
		],
	);
	assert.ok(records.every(({ source }) => source === "excluded"));
});
