import type { AndroidStore } from "./types";

/**
 * 只配置已经上架的商店，按顺序匹配。新增商店只需补充名称、官方链接和 UA 规则。
 * 使用不带 g/y 标志的正则；不要用跨品牌共用的 CPH、Pxxx 机型前缀猜测厂商。
 */
export const androidStores: readonly AndroidStore[] = [
	{
		id: "oppo",
		name: "OPPO 软件商店",
		// OPPO 专属协议，按上架包名打开详情（appId: 37088073）。
		url: "oppomarket://details?packagename=zone.northward.app",
		userAgentPatterns: [/OPPO|HeyTapBrowser/i],
	},
	{
		id: "vivo",
		name: "vivo 应用商店",
		url: "https://h5.appstore.vivo.com.cn/#/details?appId=4642701&frompage=homeApp",
		userAgentPatterns: [/vivo|iqoo/i, /\bV\d{4}[A-Z]?(?=[\s;)/]|$)/i],
	},
];

export const androidDownloadCopy = {
	title: "Android 下载",
	heading: "下载 Android 版向北",
	description: "正在为你选择下载方式。如果没有自动跳转，请选择下方入口。",
	opening: "正在前往",
	download: "立即下载 Android 版",
	stores: "应用商店",
	apk: "直接下载 APK",
	backup: "备用下载",
	home: "返回首页",
	wechat: "请点击右上角，选择“在浏览器中打开”后下载。",
};
