import classroomData from "../data/classroom-data.json";

export const classroomContent = {
	dataUrl: classroomData.url,
	storageKey: "northward.tools.classrooms.favorites.v1",
	title: "教室查询",
	roomMode: "找空教室",
	courseMode: "蹭课",
	courseModeLoading: "正在打开蹭课查询…",
	courseModeLoadError: "暂时无法打开蹭课查询，请检查网络后重试。",
	dataSource: (updatedAt: string) => `数据来自教务系统，更新于 ${updatedAt}`,
	loading: "正在加载课程表…",
	loadError: "课程表暂时无法加载，请检查网络后重试。",
	coverage: "覆盖课表中可定位的教室。临时借用、考试及开放情况请以现场为准。",
	weekdays: [
		"星期一",
		"星期二",
		"星期三",
		"星期四",
		"星期五",
		"星期六",
		"星期日",
	],
	buildingPriority: {
		前卫: [
			"敬信教学楼",
			"逸夫楼",
			"李四光楼",
			"第三教学楼",
			"法学楼",
			"外语楼",
			"萃文楼",
		],
		南岭: ["第一教学楼", "第二教学楼", "逸夫楼", "能源动力大楼"],
		和平: ["科学讲堂"],
		新民: ["第一教学楼", "第二教学楼"],
		朝阳: ["地质宫", "鸽子楼"],
	} as Record<string, string[]>,
};
