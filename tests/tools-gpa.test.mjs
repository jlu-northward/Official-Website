import assert from "node:assert/strict";
import { test } from "node:test";
import {
	calculateGpa,
	earliestAcademicYear,
	emptyCourses,
	gradePoint,
	inspectCourse,
	isCourseDrafts,
	JLU_GRADE_SCALE,
	resolveGpaRule,
} from "../src/features/tools/gpa.ts";

const course = (score, credits, name = "课程") => ({
	id: `${name}-${score}`,
	name,
	score: String(score),
	credits: String(credits),
});

test("every JLU boundary and scores immediately below it match the reference", () => {
	JLU_GRADE_SCALE.forEach(({ minimum, points }, index) => {
		assert.equal(gradePoint(minimum), points);
		if (minimum > 0)
			assert.equal(
				gradePoint(minimum - 0.001),
				JLU_GRADE_SCALE[index + 1].points,
			);
	});
	assert.equal(gradePoint(100), 4);
});

test("out of range and non-finite scores are rejected", () => {
	[-1, 100.01, NaN, Infinity].forEach((score) =>
		assert.throws(() => gradePoint(score), RangeError),
	);
});

test("2026 continuous points match the conversion table and floor fractional grades", () => {
	const points = [
		0, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.3, 2.4,
		2.5, 2.6, 2.7, 2.8, 2.9, 3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4,
	];
	points.forEach((expected, index) => {
		assert.equal(gradePoint(59 + index, "2026"), expected);
		assert.equal(gradePoint(59.99 + index, "2026"), expected);
	});
	assert.equal(gradePoint(0, "2026"), 0);
	assert.equal(gradePoint(100, "2026"), 4);
	for (const score of [-0.1, 100.01, NaN, Infinity])
		assert.throws(() => gradePoint(score, "2026"), RangeError);
});

test("automatic rule uses the earliest academic year, with legacy fallback and manual overrides", () => {
	const year = earliestAcademicYear([
		"２０２７－２０２８－１",
		"2025—2026学年第2学期",
		"2026 第一学期",
	]);
	assert.equal(year, 2025);
	assert.equal(resolveGpaRule("auto", year), "legacy");
	assert.equal(resolveGpaRule("2026", year), "2026");
	assert.equal(earliestAcademicYear(["2026 年春季学期"]), 2025);
	assert.equal(earliestAcademicYear(["", undefined, "第2学期"]), null);
	assert.equal(resolveGpaRule("auto", null), "legacy");
	for (const firstYear of [2026, 2027]) {
		assert.equal(resolveGpaRule("auto", firstYear), "2026");
		assert.equal(resolveGpaRule("legacy", firstYear), "legacy");
	}
});

test("weighted GPA matches the reference example, with five-decimal display", () => {
	const result = calculateGpa([course(92, 4), course(85, 3), course(78, 2)]);
	assert.equal(result.status, "ready");
	assert.equal(result.totalCredits, 9);
	assert.equal(result.totalWeighted.toFixed(2), "31.30");
	assert.equal(result.gpa.toFixed(5), "3.47778");
});

test("failed courses still contribute credits to the denominator", () => {
	assert.equal(calculateGpa([course(100, 3), course(59, 3)]).gpa, 2);
	assert.equal(calculateGpa([course(0, 3)]).gpa, 0);
});

test("per-course weighted values are rounded to two decimals like the reference", () => {
	const result = calculateGpa([course(87, 1.234), course(84, 0.555)]);
	assert.equal(
		result.totalWeighted,
		Number((1.234 * 3.7).toFixed(2)) + Number((0.555 * 3.3).toFixed(2)),
	);
});

test("blank rows are ignored, partially completed rows block results", () => {
	assert.equal(calculateGpa(emptyCourses()).status, "empty");
	assert.equal(calculateGpa([...emptyCourses(), course(90, 3)]).gpa, 4);
	assert.equal(calculateGpa([course(90, "")]).status, "incomplete");
	assert.equal(calculateGpa([course("", 3)]).status, "incomplete");
	assert.equal(calculateGpa([course("", "", "只有名字")]).status, "incomplete");
});

test("zero credits are permitted but a zero-credit total has no GPA", () => {
	assert.equal(calculateGpa([course(90, 0)]).status, "zero-credits");
	assert.equal(calculateGpa([course(90, 0), course(70, 2)]).gpa, 2);
});

test("decimal input is supported; malformed and negative input is rejected", () => {
	assert.equal(inspectCourse(course("89.99", ".5")).points, 3.7);
	["-1", "Infinity", "NaN", "3abc", "0xff", "1e2"].forEach((value) => {
		assert.equal(inspectCourse(course(value, 3)).valid, false);
		assert.equal(inspectCourse(course(90, value)).valid, false);
	});
});

test("saved drafts reject corruption, duplicate IDs, and unreasonable payloads", () => {
	assert.equal(isCourseDrafts(emptyCourses()), true);
	[
		null,
		{},
		[null],
		[{ id: "x" }],
		[...emptyCourses(), emptyCourses()[0]],
		[course(90, "1".repeat(21))],
	].forEach((value) => assert.equal(isCourseDrafts(value), false));
});
