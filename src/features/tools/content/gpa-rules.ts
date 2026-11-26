import { JLU_GRADE_SCALE } from "../gpa.ts";

export const gpaRules = {
	legacy: {
		name: "分段绩点",
		cohort: "2025 级及以前本科生",
		conversion:
			"按原始百分制成绩所在的区间换算。例如 85.9 分位于 84 至 87 分之间，计 3.30。",
		rows: JLU_GRADE_SCALE.map(({ minimum, points }, index) => [
			index === 0
				? "90 ≤ 成绩 ≤ 100"
				: `${minimum} ≤ 成绩 < ${JLU_GRADE_SCALE[index - 1].minimum}`,
			points.toFixed(2),
		]),
	},
	"2026": {
		name: "连续绩点",
		cohort: "2026 级及以后本科生",
		conversion:
			"小数成绩先向下取整。60 分起，每高 1 分增加 0.10 绩点，90 分封顶。例如 85.9 分按 85 分计，绩点为 3.50。",
		rows: [
			["90–100", "4.00"],
			["60–89", "1.00 +（成绩 − 60）× 0.10"],
			["0–59", "0.00"],
		],
	},
};

export const gpaRuleCopy = {
	title: "换算规则",
	choices: { auto: "自动匹配", legacy: "旧版", "2026": "2026 版" },
	noYear: "尚未识别到学年，暂用旧版。2026 级起可选用 2026 版。",
	matched: (year: number, name: string) =>
		`最早记录为 ${year}–${year + 1} 学年，已匹配${name}。`,
};
