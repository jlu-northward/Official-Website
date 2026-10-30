import classroomData from "../data/classroom-data.json";

export const courseAuditingContent = {
	dataUrl: classroomData.coursesUrl,
	title: "蹭课查询",
	description: "搜一门感兴趣的课程，或看看某位老师的上课安排。",
	loading: "正在加载课程安排…",
	loadError: "课程安排暂时无法加载，请检查网络后重试。",
	searchHint: "课程名、教师名至少填写一项，同时填写可组合筛选。",
	coverage: "安排来自全校课程表，临时调课请以教务和任课老师通知为准。",
	pageSize: 10,
};
