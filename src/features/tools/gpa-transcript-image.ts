import { gpaTranscriptContent as copy } from "./content/gpa-transcript.ts";
import type { GpaTranscript, TranscriptCourse } from "./gpa-transcript.ts";

const WIDTH = 960;
const MARGIN = 56;
const RIGHT = WIDTH - MARGIN;
const FONT =
	'-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const color = {
	paper: "#f6f4ed",
	white: "#ffffff",
	ink: "#233b33",
	green: "#285c4b",
	muted: "#78847b",
	line: "#e7e9e1",
	tint: "#edf2e9",
	lime: "#deedc9",
	red: "#ae5c4b",
};

function font(
	ctx: CanvasRenderingContext2D,
	size: number,
	weight = 400,
	mono = false,
) {
	ctx.font = `${weight} ${size}px ${mono ? MONO : FONT}`;
}

/** Break at measured character boundaries, including unspaced Chinese/long names. */
function wrap(
	ctx: CanvasRenderingContext2D,
	value: string,
	width: number,
): string[] {
	const lines: string[] = [];
	for (const paragraph of value.split(/\r?\n/)) {
		let line = "";
		for (const character of Array.from(paragraph)) {
			if (line && ctx.measureText(line + character).width > width) {
				lines.push(line);
				line = character;
			} else line += character;
		}
		lines.push(line || " ");
	}
	return lines;
}

function rounded(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
	fill: string,
) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + width, y, x + width, y + height, radius);
	ctx.arcTo(x + width, y + height, x, y + height, radius);
	ctx.arcTo(x, y + height, x, y, radius);
	ctx.arcTo(x, y, x + width, y, radius);
	ctx.closePath();
	ctx.fillStyle = fill;
	ctx.fill();
}

function line(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	end: number,
) {
	ctx.strokeStyle = color.line;
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(end, y);
	ctx.stroke();
}

interface RowLayout {
	course: TranscriptCourse;
	name: string[];
	metadata: string[];
	score: string[];
	credits: string[];
	height: number;
}

function measureRow(
	ctx: CanvasRenderingContext2D,
	course: TranscriptCourse,
): RowLayout {
	font(ctx, 23, 500);
	const name = wrap(ctx, course.name, 448);
	font(ctx, 17);
	const metadata = wrap(ctx, `${course.nature} · ${course.note}`, 448);
	font(ctx, 27, 600);
	const score = wrap(ctx, course.score, 108);
	font(ctx, 20, 400, true);
	const credits = wrap(ctx, course.credits, 90);
	return {
		course,
		name,
		metadata,
		score,
		credits,
		height: Math.max(
			90,
			name.length * 32 + metadata.length * 24 + 30,
			score.length * 32 + 36,
			credits.length * 26 + 36,
		),
	};
}

const numberLabel = (value: number) => Number(value.toFixed(3)).toString();
const gpaLabel = (result: GpaTranscript["result"]) =>
	result.gpa === null ? "—" : result.gpa.toFixed(5);

/** Render only when sharing; no external images, fonts, uploads, or DOM screenshots. */
export async function renderGpaTranscriptImage(
	transcript: GpaTranscript,
): Promise<Blob> {
	await document.fonts?.ready;
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error(copy.generateError);
	const groups = transcript.groups.map((group) => {
		font(ctx, 27, 600);
		const title = wrap(ctx, group.term, WIDTH - MARGIN * 2);
		const rows = group.courses.map((course) => measureRow(ctx, course));
		return {
			...group,
			title,
			rows,
			headerHeight: 62 + title.length * 38,
			bodyHeight: 50 + rows.reduce((sum, row) => sum + row.height, 0),
		};
	});
	font(ctx, 17);
	const footnotes = [copy.footnote, copy.calculationNote].flatMap((value) =>
		wrap(ctx, value, WIDTH - MARGIN * 2),
	);
	const height = Math.ceil(
		392 +
			groups.reduce(
				(sum, group) => sum + group.headerHeight + group.bodyHeight + 30,
				0,
			) +
			100 +
			footnotes.length * 27 +
			108,
	);
	// Stay below conservative mobile canvas limits while retaining every row.
	const scale = Math.min(
		1.5,
		16_000 / height,
		Math.sqrt(12_000_000 / (WIDTH * height)),
	);
	if (scale < 0.5 || height > 32_000) throw new Error(copy.tooLarge);
	canvas.width = Math.floor(WIDTH * scale);
	canvas.height = Math.floor(height * scale);
	ctx.scale(scale, scale);
	ctx.fillStyle = color.paper;
	ctx.fillRect(0, 0, WIDTH, height);
	ctx.textBaseline = "top";

	ctx.fillStyle = color.green;
	rounded(ctx, MARGIN, 48, 8, 22, 4, color.green);
	font(ctx, 15, 500, true);
	ctx.fillText(copy.brandEnglish, MARGIN + 20, 52);
	font(ctx, 48, 600);
	ctx.fillStyle = color.ink;
	ctx.fillText(copy.title, MARGIN, 98);
	font(ctx, 19);
	ctx.fillStyle = color.muted;
	ctx.fillText(copy.transcriptSubtitle, MARGIN, 162);
	// A quiet circular mark gives the sheet a recognisable printed identity.
	ctx.strokeStyle = "#dbe2d4";
	ctx.lineWidth = 1;
	for (const radius of [33, 47, 61]) {
		ctx.beginPath();
		ctx.arc(RIGHT - 64, 133, radius, 0, Math.PI * 2);
		ctx.stroke();
	}
	font(ctx, 22, 500);
	ctx.fillStyle = color.green;
	ctx.textAlign = "center";
	ctx.fillText(copy.brandName, RIGHT - 64, 120);
	ctx.textAlign = "left";

	rounded(ctx, MARGIN, 218, WIDTH - MARGIN * 2, 142, 18, color.green);
	font(ctx, 15);
	ctx.fillStyle = "#d2e0d4";
	ctx.fillText(
		`${copy.gpaLabel} · ${copy.scopeLabels[transcript.scope]}`,
		MARGIN + 28,
		240,
	);
	font(ctx, 54, 400, true);
	ctx.fillStyle = color.lime;
	ctx.fillText(gpaLabel(transcript.result), MARGIN + 24, 276);
	if (transcript.result.gpa === null) {
		font(ctx, 16);
		ctx.fillStyle = "#d2e0d4";
		ctx.fillText(copy.notReady, MARGIN + 80, 299);
	}
	ctx.strokeStyle = "#507665";
	ctx.beginPath();
	ctx.moveTo(450, 249);
	ctx.lineTo(450, 330);
	ctx.stroke();
	const stats = [
		{ label: copy.courseCountLabel, value: String(transcript.count) },
		{ label: copy.termCountLabel, value: String(groups.length) },
		{
			label: copy.creditsLabel,
			value: ["ready", "zero-credits"].includes(transcript.result.status)
				? numberLabel(transcript.result.totalCredits)
				: "—",
		},
	];
	for (const [index, stat] of stats.entries()) {
		const x = 490 + index * 132;
		font(ctx, 15);
		ctx.fillStyle = "#d2e0d4";
		ctx.fillText(stat.label, x, 250);
		font(ctx, 30, 400, true);
		ctx.fillStyle = color.white;
		const statText = wrap(ctx, stat.value, 112);
		// GPA credit input is editable; fit unusually large totals rather than clip.
		let size = 30;
		while (
			statText.length > 1 &&
			ctx.measureText(stat.value).width > 112 &&
			size > 10
		) {
			font(ctx, --size, 400, true);
		}
		ctx.fillText(stat.value, x, 286, 112);
	}

	let y = 392;
	let courseIndex = 0;
	for (const [index, group] of groups.entries()) {
		font(ctx, 13, 500, true);
		ctx.fillStyle = color.muted;
		ctx.fillText(
			`${copy.semester} ${String(index + 1).padStart(2, "0")}`,
			MARGIN,
			y,
		);
		font(ctx, 27, 600);
		ctx.fillStyle = color.ink;
		group.title.forEach((title, titleIndex) =>
			ctx.fillText(title, MARGIN, y + 24 + titleIndex * 38),
		);
		font(ctx, 15);
		ctx.fillStyle = color.muted;
		ctx.fillText(
			`${group.courses.length} ${copy.coursesUnit} · ${copy.semesterGpa} ${gpaLabel(group.result)} · ${copy.scopeLabels[transcript.scope]}`,
			MARGIN,
			y + 30 + group.title.length * 38,
		);
		y += group.headerHeight;
		rounded(
			ctx,
			MARGIN,
			y,
			WIDTH - MARGIN * 2,
			group.bodyHeight,
			16,
			color.white,
		);
		font(ctx, 15);
		ctx.fillStyle = color.muted;
		ctx.fillText(copy.columns.course, MARGIN + 22, y + 17);
		ctx.textAlign = "center";
		ctx.fillText(copy.columns.credits, 634, y + 17);
		ctx.fillText(copy.columns.points, 739, y + 17);
		ctx.fillText(copy.columns.score, 838, y + 17);
		ctx.textAlign = "left";
		y += 50;
		for (const row of group.rows) {
			line(ctx, MARGIN + 20, y, RIGHT - 20);
			font(ctx, 12, 400, true);
			ctx.fillStyle = "#a6afa5";
			ctx.fillText(String(++courseIndex).padStart(2, "0"), MARGIN + 20, y + 23);
			font(ctx, 23, 500);
			ctx.fillStyle = color.ink;
			row.name.forEach((value, lineIndex) =>
				ctx.fillText(value, MARGIN + 59, y + 18 + lineIndex * 32),
			);
			font(ctx, 17);
			ctx.fillStyle = row.course.included ? color.green : color.muted;
			row.metadata.forEach((value, lineIndex) =>
				ctx.fillText(
					value,
					MARGIN + 59,
					y + 21 + row.name.length * 32 + lineIndex * 24,
				),
			);
			const middle = y + row.height / 2;
			ctx.textAlign = "center";
			font(ctx, 20, 400, true);
			ctx.fillStyle = color.muted;
			row.credits.forEach((value, lineIndex) =>
				ctx.fillText(
					value,
					634,
					middle - row.credits.length * 13 + lineIndex * 26,
				),
			);
			ctx.fillText(row.course.points?.toFixed(1) ?? "—", 739, middle - 13);
			font(ctx, 27, 600);
			ctx.fillStyle = row.course.points === 0 ? color.red : color.green;
			row.score.forEach((value, lineIndex) =>
				ctx.fillText(
					value,
					838,
					middle - row.score.length * 16 + lineIndex * 32,
				),
			);
			ctx.textAlign = "left";
			y += row.height;
		}
		y += 30;
	}
	y += 22;
	line(ctx, MARGIN, y, RIGHT);
	y += 24;
	font(ctx, 17);
	ctx.fillStyle = color.muted;
	for (const note of footnotes) {
		ctx.fillText(note, MARGIN, y);
		y += 27;
	}
	y += 40;
	font(ctx, 21, 600);
	ctx.fillStyle = color.green;
	ctx.fillText(copy.brand, MARGIN, y);
	font(ctx, 15);
	ctx.fillStyle = color.muted;
	ctx.textAlign = "right";
	ctx.fillText(copy.footer, RIGHT, y + 4);
	ctx.textAlign = "left";

	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob?.size) resolve(blob);
			else reject(new Error(copy.generateError));
		}, "image/png");
	});
}
