import type { AndroidStore } from "../config/types";

/** 按配置顺序匹配已上架的商店；没有可靠设备信息时保留 APK 下载。 */
export function resolveAndroidDownload(
	userAgent: string,
	stores: readonly AndroidStore[],
	deviceModel = "",
) {
	const isWeChat = /MicroMessenger/i.test(userAgent);
	const device = `${userAgent} ${deviceModel}`;
	const store = /Android/i.test(userAgent)
		? stores.find((candidate) =>
				candidate.userAgentPatterns.some((pattern) => pattern.test(device)),
			)
		: undefined;

	return { store, isWeChat };
}
