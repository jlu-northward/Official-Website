import { siteConfig } from "config";
import { fadeTransition, popIn, springSnappy } from "config/motion";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useState } from "react";
import { createPortal } from "react-dom";
import { FiFileText, FiShield } from "react-icons/fi";
import ThemeToggle from "../ui/ThemeToggle";

const QR_SRC = "/qrcode/wechat-official.jpg";

const Footer = () => {
	const [enlarged, setEnlarged] = useState(false);

	return (
		<footer className="liquid-glass liquid-glass--thin rounded-t-[2.5rem] border-x-0 border-b-0 border-t border-black/[0.06] px-5 py-10 sm:rounded-t-[3.5rem] dark:border-white/[0.08]">
			<div className="mx-auto max-w-6xl">
				<div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
					<div>
						<a
							href="/"
							data-easter-egg-logo
							className="inline-flex items-center gap-3.5 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-sky-500/25"
						>
							<img
								src="/brand/favicon-512.svg"
								alt=""
								className="h-14 w-14 rounded-3xl shadow-sm"
							/>
							<span className="text-3xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
								{siteConfig.title}
							</span>
						</a>
						<p className="mt-3 max-w-lg text-sm leading-6 text-neutral-500 dark:text-neutral-400">
							吉大人自己的校园社区。
						</p>
					</div>

					<button
						type="button"
						onClick={() => setEnlarged(true)}
						className="liquid-glass liquid-glass--interactive card-lift flex cursor-pointer items-center gap-6 rounded-[2rem] border border-black/[0.06] p-5 pr-9 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/25 dark:border-white/[0.09]"
						aria-label="放大公众号二维码"
					>
						<img
							src={QR_SRC}
							alt="向北 App 微信公众号二维码"
							width={128}
							height={128}
							className="h-28 w-28 rounded-2xl bg-white p-1.5 sm:h-32 sm:w-32"
						/>
						<span>
							<span className="block text-xl font-semibold tracking-[-0.02em] text-neutral-900 sm:text-2xl dark:text-white">
								关注「大鹅」
							</span>
							<span className="mt-1.5 block text-base text-neutral-500 dark:text-neutral-400">
								获取向北最新动态
							</span>
						</span>
					</button>
				</div>

				<div className="mt-10 flex flex-col gap-5 border-t border-black/[0.06] pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.07] dark:text-neutral-400">
					<span>向北App © {new Date().getFullYear()} All rights reserved.</span>
					<div className="flex flex-wrap items-center gap-5">
						<a
							href="/privacy"
							className="inline-flex items-center gap-1.5 rounded-md outline-none transition-colors duration-300 hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-sky-500/30 dark:hover:text-neutral-200"
						>
							<FiShield className="h-3.5 w-3.5" />
							隐私政策
						</a>
						<a
							href="/terms"
							className="inline-flex items-center gap-1.5 rounded-md outline-none transition-colors duration-300 hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-sky-500/30 dark:hover:text-neutral-200"
						>
							<FiFileText className="h-3.5 w-3.5" />
							使用条款
						</a>
						<ThemeToggle />
					</div>
				</div>
			</div>

			{typeof document !== "undefined" &&
				createPortal(
					<AnimatePresence>
						{enlarged && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={fadeTransition}
								className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/55 p-6 backdrop-blur-xl"
								onClick={() => setEnlarged(false)}
								role="presentation"
							>
								<motion.div
									variants={popIn}
									initial="initial"
									animate="animate"
									exit="exit"
									transition={springSnappy}
									className="rounded-[2rem] bg-white p-5 shadow-2xl"
									role="dialog"
									aria-modal="true"
									aria-label="向北 App 微信公众号二维码"
									onClick={(event) => event.stopPropagation()}
								>
									<img
										src={QR_SRC}
										alt="向北 App 微信公众号二维码"
										className="w-[70vw] max-w-sm rounded-2xl"
									/>
									<button
										type="button"
										onClick={() => setEnlarged(false)}
										className="mt-3 w-full cursor-pointer rounded-full bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors duration-300 hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/25 active:scale-[0.98]"
									>
										关闭
									</button>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>,
					document.body,
				)}
		</footer>
	);
};

export default memo(Footer);
