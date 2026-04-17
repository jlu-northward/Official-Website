import { memo, useEffect, useState } from "react";

const WeChatGuide = memo(() => {
	const [visible, setVisible] = useState(false);
	// 同步检测，避免 useEffect 延迟
	const [isWeChat] = useState(() => {
		if (typeof window === "undefined") return false;
		return /micromessenger/i.test(window.navigator.userAgent);
	});

	useEffect(() => {
		if (isWeChat) setVisible(true);
		if (!isWeChat) return;

		// 拦截所有下载按钮的点击
		const handler = (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest("a[href]");
			if (!target) return;
			const href = target.getAttribute("href") || "";
			if (/\/download-(android|ios)|\/api\/android-download/.test(href) || target.hasAttribute("data-store-url")) {
				e.preventDefault();
				e.stopPropagation();
				setVisible(true);
			}
		};
		document.addEventListener("click", handler, true);
		return () => document.removeEventListener("click", handler, true);
	}, [isWeChat]);

	useEffect(() => {
		if (visible) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => { document.body.style.overflow = ""; };
	}, [visible]);

	if (!isWeChat) return null;

	return (
		<div
			className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
			style={{ background: "rgba(0,0,0,0.75)" }}
			onClick={() => setVisible(false)}
		>
			{/* Arrow pointing to top-right corner */}
			<div className="absolute top-6 right-6 sm:top-10 sm:right-10 animate-bounce">
				<div className="flex flex-col items-end">
					<svg width="40" height="40" viewBox="0 0 40 40" fill="none">
						<path
							d="M8 32L32 8M32 8L14 8M32 8L32 26"
							stroke="white"
							strokeWidth="3.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
				<div className="flex flex-col items-center mt-1">
					<span className="text-white/70 text-xs font-medium whitespace-nowrap">点击这里</span>
					<span className="text-white/70 text-xs font-medium whitespace-nowrap">选择「在浏览器中打开」</span>
				</div>
			</div>

			{/* Content card */}
			<div
				className="mx-6 max-w-xs rounded-2xl bg-white dark:bg-gray-900 p-6 text-center shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h3 className="mb-3 text-base font-bold text-gray-900 dark:text-white">
					请在浏览器中打开此页面
				</h3>
				<p className="mb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
					微信内置浏览器无法下载 App，请点击右上角
					<span className="mx-1 inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-gray-800 dark:bg-white/10 dark:text-white">
						···
					</span>
					选择「在浏览器中打开」。
				</p>

				<button
					onClick={() => setVisible(false)}
					className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.98] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
				>
					我知道了
				</button>
			</div>
		</div>
	);
});

WeChatGuide.displayName = "WeChatGuide";

export default WeChatGuide;
