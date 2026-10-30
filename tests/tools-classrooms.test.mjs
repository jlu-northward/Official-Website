import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
	createClassroomIndex,
	queryEmptyClassrooms,
	teachingDayForDate,
} from "../src/features/tools/classrooms.ts";

const semester = {
	name: "测试学期",
	firstWeekMonday: "2026-09-07",
	weeks: 18,
	dateOverrides: {
		"2026-09-12": { week: 1, weekday: 3 },
		"2026-10-01": null,
	},
};
const fixture = () => ({
	schemaVersion: 1,
	semester: structuredClone(semester),
	importedAt: "2026-10-25",
	source: { label: "fixture", courseRows: 3 },
	rooms: [
		["前卫", "逸夫楼", "101", "多媒体"],
		["前卫", "逸夫楼", "102", ""],
		["南岭", "逸夫楼", "101", ""],
	],
	// Room 101: odd weeks, Monday periods 3–4. Room 102: week 2, periods 5–6.
	slots: [
		[0, 1, 12, 5],
		[1, 1, 48, 2],
		[2, 1, 4095, 262143],
	],
});
const query = (overrides = {}) => ({
	campus: "前卫",
	building: "逸夫楼",
	week: 1,
	weekday: 1,
	startPeriod: 3,
	endPeriod: 4,
	...overrides,
});
const names = (rooms) => rooms.map((room) => room[2]);

test("any overlap excludes the room for the entire selected interval", () => {
	const index = createClassroomIndex(fixture());
	assert.deepEqual(names(queryEmptyClassrooms(index, query())), ["102"]);
	assert.deepEqual(
		names(queryEmptyClassrooms(index, query({ startPeriod: 4, endPeriod: 5 }))),
		["102"],
	);
	assert.deepEqual(
		names(queryEmptyClassrooms(index, query({ startPeriod: 5, endPeriod: 6 }))),
		["101", "102"],
	);
	assert.deepEqual(
		names(
			queryEmptyClassrooms(index, query({ startPeriod: 1, endPeriod: 12 })),
		),
		["102"],
	);
});

test("week, weekday and campus keep similarly named rooms independent", () => {
	const index = createClassroomIndex(fixture());
	assert.deepEqual(names(queryEmptyClassrooms(index, query({ week: 2 }))), [
		"101",
		"102",
	]);
	assert.deepEqual(names(queryEmptyClassrooms(index, query({ week: 3 }))), [
		"102",
	]);
	assert.deepEqual(names(queryEmptyClassrooms(index, query({ weekday: 2 }))), [
		"101",
		"102",
	]);
	assert.deepEqual(queryEmptyClassrooms(index, query({ campus: "南岭" })), []);
});

test("invalid selections and corrupt data cannot turn into an all-free result", () => {
	const index = createClassroomIndex(fixture());
	for (const change of [
		{ week: 0 },
		{ week: 19 },
		{ weekday: 0 },
		{ startPeriod: 4, endPeriod: 3 },
		{ endPeriod: 13 },
		{ building: "未知楼" },
	])
		assert.throws(() => queryEmptyClassrooms(index, query(change)), RangeError);
	for (const mutate of [
		(data) => {
			data.slots[0][0] = 99;
		},
		(data) => {
			data.slots[0][3] = 0;
		},
		(data) => {
			data.slots = [];
		},
		(data) => {
			data.rooms.push(data.rooms[0]);
		},
		(data) => {
			data.semester.firstWeekMonday = "2026-09-08";
		},
	]) {
		const data = fixture();
		mutate(data);
		assert.throws(() => createClassroomIndex(data));
	}
});

test("calendar conversion uses civil dates, guards semester boundaries and applies overrides", () => {
	assert.deepEqual(teachingDayForDate(semester, "2026-09-07"), {
		week: 1,
		weekday: 1,
	});
	assert.deepEqual(teachingDayForDate(semester, "2026-09-13"), {
		week: 1,
		weekday: 7,
	});
	assert.deepEqual(teachingDayForDate(semester, "2026-09-14"), {
		week: 2,
		weekday: 1,
	});
	assert.deepEqual(teachingDayForDate(semester, "2026-09-12"), {
		week: 1,
		weekday: 3,
	});
	for (const date of [
		"2026-09-06",
		"2027-01-11",
		"2026-02-30",
		"2026-10-01",
		"invalid",
	])
		assert.equal(teachingDayForDate(semester, date), null);
	assert.equal(
		teachingDayForDate({ ...semester, firstWeekMonday: null }, "2026-09-07"),
		null,
	);
});

test("published data matches the semester config and excludes a scheduled room", async () => {
	const manifest = JSON.parse(
		await readFile(
			new URL("../src/features/tools/data/classroom-data.json", import.meta.url),
			"utf8",
		),
	);
	const data = JSON.parse(
		await readFile(
			new URL(`../public${manifest.url}`, import.meta.url),
			"utf8",
		),
	);
	const index = createClassroomIndex(data);
	const config = JSON.parse(
		await readFile(
			new URL("../data/classroom-semester.json", import.meta.url),
			"utf8",
		),
	);
	const { buildingAliases: _aliases, ...calendar } = config;
	assert.deepEqual(data.semester, calendar);
	// Follow an actual slot so a future semester does not need this test edited.
	const [roomId, weekday, periods, weeks] = data.slots[0];
	const room = data.rooms[roomId];
	const firstBit = (mask) => Math.log2(mask & -mask) + 1;
	const available = queryEmptyClassrooms(
		index,
		query({
			campus: room[0],
			building: room[1],
			weekday,
			week: firstBit(weeks),
			startPeriod: firstBit(periods),
			endPeriod: firstBit(periods),
		}),
	);
	assert.ok(!available.includes(room));
});
