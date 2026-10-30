import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGpaTranscript } from "../src/features/tools/gpa-transcript.ts";
import { emptyCourses } from "../src/features/tools/gpa.ts";

const courses = [
	{
		id: "excel-row-6",
		name: "大学英语",
		score: "80",
		credits: "2",
		nature: "选修",
		term: "2026-2027学年第2学期",
	},
	{
		id: "excel-row-2",
		name: "高等数学",
		score: "90",
		credits: "3",
		nature: "必修",
		term: "2026-2027学年第1学期",
	},
	{
		id: "excel-row-4",
		name: "大学物理",
		score: "87",
		credits: "1",
		nature: "必修",
		term: "2026-2027学年第1学期",
	},
];
const skipped = [
	{
		row: 3,
		name: "体育",
		score: "优秀",
		credits: "1",
		nature: "必修",
		term: "2026-2027学年第1学期",
		reason: "text",
	},
	{
		row: 7,
		name: "课程实践",
		score: "",
		credits: "2",
		nature: "必修",
		term: "2026-2027学年第2学期",
		reason: "empty",
	},
	{
		row: 8,
		name: "无效记录",
		score: "100",
		credits: "99",
		nature: "必修",
		term: "2026-2027学年第2学期",
		reason: "invalid",
	},
];

test("transcript contains all grades grouped by semester, regardless of GPA scope", () => {
	const required = buildGpaTranscript(courses, skipped, "required");
	const all = buildGpaTranscript(courses, skipped, "all");
	assert.equal(required.count, 6);
	assert.equal(required.skippedCount, 3);
	assert.equal(required.calculatedCount, 2);
	assert.equal(required.result.gpa, 3.925);
	assert.equal(all.result.gpa.toFixed(5), "3.61667");
	assert.equal(required.groups.length, 2);
	assert.deepEqual(
		required.groups[0].courses.map((course) => course.name),
		["高等数学", "体育", "大学物理"],
	);
	assert.deepEqual(
		required.groups[1].courses.map((course) => course.name),
		["大学英语", "课程实践", "无效记录"],
	);
	assert.equal(required.groups[0].courses[1].score, "优秀");
	assert.equal(required.groups[0].courses[1].credits, "1");
	assert.equal(required.groups[0].courses[1].included, false);
	assert.equal(required.groups[0].courses[1].points, null);
	assert.equal(required.groups[1].courses[0].included, false);
	assert.equal(all.groups[1].courses[0].included, true);
	assert.equal(required.groups[1].courses[1].score, "未出分");
	assert.equal(required.groups[1].courses[2].points, null);
	assert.equal(required.groups[1].result.gpa, null);
});

test("legacy/manual drafts keep working; empty placeholders do not appear in the image", () => {
	const transcript = buildGpaTranscript(
		[...emptyCourses(), { id: "manual", name: "", score: "0", credits: "2" }],
		[],
		"required",
	);
	assert.equal(transcript.count, 1);
	assert.equal(transcript.groups[0].term, "未标注学期");
	assert.equal(transcript.groups[0].courses[0].name, "未命名课程");
	assert.equal(transcript.groups[0].courses[0].nature, "必修");
	assert.equal(transcript.groups[0].courses[0].included, true);
	assert.equal(transcript.result.gpa, 0);
	assert.equal(buildGpaTranscript(emptyCourses(), [], "all").groups.length, 0);
});

test("unselected invalid courses remain visible while preserving the selected GPA", () => {
	const transcript = buildGpaTranscript(
		[
			...courses,
			{
				id: "incomplete",
				name: "选修待完善",
				score: "101",
				credits: "2",
				nature: "选修",
			},
		],
		[],
		"required",
	);
	assert.equal(transcript.result.status, "ready");
	assert.equal(transcript.groups.at(-1).term, "未标注学期");
	assert.equal(transcript.groups.at(-1).courses[0].points, null);
	assert.equal(transcript.groups.at(-1).courses[0].included, false);
	assert.equal(transcript.groups.at(-1).courses[0].note, "成绩或学分待完善");
});

test("large transcripts and retakes retain every row without modifying original data", () => {
	const source = Array.from({ length: 200 }, (_, index) => ({
		id: `record-${index}`,
		name: "同名重修课程",
		score: "90",
		credits: "1",
		term: `第${Math.floor(index / 20) + 1}学期`,
	}));
	const snapshot = JSON.stringify(source);
	const transcript = buildGpaTranscript(source, skipped, "all");
	assert.equal(transcript.count, 203);
	assert.equal(transcript.groups.flatMap((group) => group.courses).length, 203);
	assert.equal(JSON.stringify(source), snapshot);
	assert.equal(
		transcript.groups.findIndex((group) => group.term === "第2学期") <
			transcript.groups.findIndex((group) => group.term === "第10学期"),
		true,
	);
});
