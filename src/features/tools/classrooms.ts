export type ClassroomRoom = [
	campus: string,
	building: string,
	name: string,
	type: string,
];
export type ClassroomSlot = [
	room: number,
	weekday: number,
	periods: number,
	weeks: number,
];
export interface ClassroomDataset {
	schemaVersion: 1;
	semester: {
		name: string;
		firstWeekMonday: string | null;
		weeks: number;
		dateOverrides: Record<string, { week: number; weekday: number } | null>;
	};
	importedAt: string;
	source: { label: string; courseRows: number };
	rooms: ClassroomRoom[];
	slots: ClassroomSlot[];
}
export interface ClassroomQuery {
	campus: string;
	building: string;
	week: number;
	weekday: number;
	startPeriod: number;
	endPeriod: number;
}
export interface ClassroomBuilding {
	campus: string;
	name: string;
	roomIds: number[];
	slots: ClassroomSlot[];
}
export interface ClassroomIndex {
	data: ClassroomDataset;
	campuses: string[];
	buildings: ClassroomBuilding[];
}

const integer = (value: unknown, min: number, max: number): value is number =>
	typeof value === "number" &&
	Number.isInteger(value) &&
	value >= min &&
	value <= max;

export function dateNumber(value: string): number {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
	const result = Date.parse(`${value}T00:00:00Z`);
	return Number.isFinite(result) &&
		new Date(result).toISOString().slice(0, 10) === value
		? result
		: NaN;
}

export function isClassroomSemester(
	value: unknown,
): value is ClassroomDataset["semester"] {
	if (!value || typeof value !== "object") return false;
	const semester = value as ClassroomDataset["semester"];
	if (
		typeof semester.name !== "string" ||
		!semester.name.trim() ||
		!integer(semester.weeks, 1, 30) ||
		!semester.dateOverrides ||
		typeof semester.dateOverrides !== "object" ||
		Array.isArray(semester.dateOverrides)
	)
		return false;
	if (
		semester.firstWeekMonday !== null &&
		(typeof semester.firstWeekMonday !== "string" ||
			!Number.isFinite(dateNumber(semester.firstWeekMonday)) ||
			new Date(dateNumber(semester.firstWeekMonday)).getUTCDay() !== 1)
	)
		return false;
	return Object.entries(semester.dateOverrides).every(
		([date, override]) =>
			Number.isFinite(dateNumber(date)) &&
			(override === null ||
				(override &&
					integer(override.week, 1, semester.weeks) &&
					integer(override.weekday, 1, 7))),
	);
}

export function createClassroomIndex(value: unknown): ClassroomIndex {
	const fail = () => {
		throw new Error("课表数据格式有误，请重新加载。");
	};
	if (!value || typeof value !== "object") return fail();
	const data = value as ClassroomDataset;
	const semester = data.semester;
	if (
		data.schemaVersion !== 1 ||
		!isClassroomSemester(semester) ||
		typeof data.importedAt !== "string" ||
		!Number.isFinite(dateNumber(data.importedAt)) ||
		!data.source ||
		typeof data.source.label !== "string" ||
		!integer(data.source.courseRows, 1, 1_000_000) ||
		!Array.isArray(data.rooms) ||
		!data.rooms.length ||
		!Array.isArray(data.slots) ||
		!data.slots.length
	)
		return fail();
	const campuses = new Set<string>();
	const buildings = new Map<string, ClassroomBuilding>();
	const roomKeys = new Set<string>();
	data.rooms.forEach((room, id) => {
		if (
			!Array.isArray(room) ||
			room.length !== 4 ||
			room.some((part) => typeof part !== "string") ||
			room.slice(0, 3).some((part) => !part.trim())
		)
			return fail();
		const [campus, building, name] = room;
		const roomKey = JSON.stringify([campus, building, name]);
		if (roomKeys.has(roomKey)) return fail();
		roomKeys.add(roomKey);
		campuses.add(campus);
		const key = JSON.stringify([campus, building]);
		if (!buildings.has(key))
			buildings.set(key, { campus, name: building, roomIds: [], slots: [] });
		buildings.get(key)!.roomIds.push(id);
	});
	data.slots.forEach((slot) => {
		if (
			!Array.isArray(slot) ||
			slot.length !== 4 ||
			!integer(slot[0], 0, data.rooms.length - 1) ||
			!integer(slot[1], 1, 7) ||
			!integer(slot[2], 1, (1 << 12) - 1) ||
			!integer(slot[3], 1, 2 ** semester.weeks - 1)
		)
			return fail();
		const [campus, building] = data.rooms[slot[0]];
		buildings.get(JSON.stringify([campus, building]))!.slots.push(slot);
	});
	const collator = new Intl.Collator("zh-CN", { numeric: true });
	const ordered = [...buildings.values()];
	ordered.forEach((building) =>
		building.roomIds.sort((a, b) =>
			collator.compare(data.rooms[a][2], data.rooms[b][2]),
		),
	);
	return { data, campuses: [...campuses], buildings: ordered };
}

export function queryEmptyClassrooms(
	index: ClassroomIndex,
	query: ClassroomQuery,
): ClassroomRoom[] {
	if (
		!integer(query.week, 1, index.data.semester.weeks) ||
		!integer(query.weekday, 1, 7) ||
		!integer(query.startPeriod, 1, 12) ||
		!integer(query.endPeriod, query.startPeriod, 12)
	)
		throw new RangeError("请选择有效的教学周和节次。");
	const building = index.buildings.find(
		(item) => item.campus === query.campus && item.name === query.building,
	);
	if (!building) throw new RangeError("请选择课表覆盖的校区和教学楼。");
	const weekMask = 2 ** (query.week - 1);
	const periodMask =
		((1 << (query.endPeriod - query.startPeriod + 1)) - 1) <<
		(query.startPeriod - 1);
	const occupied = new Set<number>();
	for (const [room, day, periods, weeks] of building.slots) {
		if (day === query.weekday && periods & periodMask && weeks & weekMask)
			occupied.add(room);
	}
	return building.roomIds
		.filter((room) => !occupied.has(room))
		.map((room) => index.data.rooms[room]);
}

export function teachingDayForDate(
	semester: ClassroomDataset["semester"],
	date: string,
): { week: number; weekday: number } | null {
	const day = dateNumber(date);
	if (!Number.isFinite(day) || !semester.firstWeekMonday) return null;
	const days = (day - dateNumber(semester.firstWeekMonday)) / 86_400_000;
	if (days < 0 || days >= semester.weeks * 7) return null;
	if (Object.hasOwn(semester.dateOverrides, date))
		return semester.dateOverrides[date];
	return {
		week: Math.floor(days / 7) + 1,
		weekday: new Date(day).getUTCDay() || 7,
	};
}

export const buildingKey = (campus: string, building: string) =>
	JSON.stringify([campus, building]);
