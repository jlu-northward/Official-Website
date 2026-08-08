import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useState } from "react";
import { fadeTransition, popIn, springSnappy } from "config/motion";

interface WeChatGuideProps {
	openOnLoad?: boolean;
}

const WeChatGuide = memo(({ openOnLoad = true }: WeChatGuideProps) => {
	const [isWeChat] = useState(() => {
		if (typeof window === "undefined") return false;
		return /micromessenger/i.test(window.navigator.userAgent);
	});
	// 直接用 isWeChat 初始化，省去 useEffect 延迟一帧
	const [visible, setVisible] = useState(isWeChat && openOnLoad);

	useEffect(() => {
		if (!isWeChat) return;

		// 拦截所有下载按钮的点击
		const handler = (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest("a[href]");
			if (!target) return;
			const href = target.getAttribute("href") || "";
			if (
				/\/download-(android|ios)|\/api\/android-download/.test(href) ||
				target.hasAttribute("data-store-url")
			) {
				e.preventDefault();
				e.stopPropagation();
				setVisible(true);
			}
		};
		document.addEventListener("click", handler, true);
		return () => document.removeEventListener("click", handler, true);
	}, [isWeChat]);

	useEffect(() => {
		document.body.style.overflow = visible ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [visible]);

	if (!isWeChat) return null;

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={fadeTransition}
					className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
					style={{ background: "rgba(0,0,0,0.75)" }}
					onClick={() => setVisible(false)}
				>
					{/* Arrow pointing to top-right corner */}
					<div className="absolute right-6 top-6 animate-bounce sm:right-10 sm:top-10">
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
						<div className="mt-1 flex flex-col items-center">
							<span className="whitespace-nowrap text-xs font-medium text-white/70">
								点击这里
							</span>
							<span className="whitespace-nowrap text-xs font-medium text-white/70">
								选择「在浏览器中打开」
							</span>
						</div>
					</div>

					{/* Content card */}
					<motion.div
						variants={popIn}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={springSnappy}
						className="mx-6 max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-gray-900"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="mb-3 text-base font-bold text-gray-900 dark:text-white">
							请在浏览器中打开此页面
						</h3>
						<p className="mb-5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
							微信内置浏览器无法下载 App，请点击右上角
							<span className="mx-1 inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-gray-800 dark:bg-white/10 dark:text-white">
								···
							</span>
							选择「在浏览器中打开」。
						</p>

						<button
							onClick={() => setVisible(false)}
							className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-transform duration-100 active:scale-[0.98] dark:bg-white dark:text-gray-900"
						>
							我知道了
						</button>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
});

WeChatGuide.displayName = "WeChatGuide";

export default WeChatGuide;
