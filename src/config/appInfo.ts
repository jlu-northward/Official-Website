import type { StoreLinks } from "./types";

export const appInfo = {
	title: "向北",
	description:
		"你的吉大校园日记",
	logo: {
		src: "logo.png",
	},
	storeLinks: {
		apple: "https://apps.apple.com/cn/app/%E5%90%91%E5%8C%97app/id6753915149",
		google: () => {
			const baseUrl = "https://northward.nohup.life/northward-release.apk";
			const timestamp = new Date().getTime();
			return `${baseUrl}?t=${timestamp}`;
		},
		google2: "https://pan.baidu.com/s/1sVCGZSVdDA9h0xQz2YxpiQ?pwd=e4hm", // 提取码: e4hm
	} as StoreLinks,
};
