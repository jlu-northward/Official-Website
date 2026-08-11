import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";

const REQUIRED_CLICKS = 5;
const CLICK_TIMEOUT = 900;
const TOAST_DURATION = 2600;

const EasterEggToast = () => {
	const [visible, setVisible] = useState(false);
	const clickCount = useRef(0);
	const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const handleClick = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			const logo = target.closest<HTMLAnchorElement>("[data-easter-egg-logo]");

			if (!logo) return;

			// Avoid reloading the homepage so consecutive footer clicks can be counted.
			if (
				logo.getAttribute("href") === "/" &&
				window.location.pathname === "/"
			) {
				event.preventDefault();
				window.scrollTo({ top: 0, behavior: "smooth" });
			}

			clickCount.current += 1;
			if (resetTimer.current) clearTimeout(resetTimer.current);

			if (clickCount.current < REQUIRED_CLICKS) {
				resetTimer.current = setTimeout(() => {
					clickCount.current = 0;
				}, CLICK_TIMEOUT);
				return;
			}

			clickCount.current = 0;
			setVisible(true);
			if (toastTimer.current) clearTimeout(toastTimer.current);
			toastTimer.current = setTimeout(() => setVisible(false), TOAST_DURATION);
		};

		document.addEventListener("click", handleClick);
		return () => {
			document.removeEventListener("click", handleClick);
			if (resetTimer.current) clearTimeout(resetTimer.current);
			if (toastTimer.current) clearTimeout(toastTimer.current);
		};
	}, []);

	return (
		<div
			className="pointer-events-none fixed inset-x-4 bottom-6 z-[10000] flex justify-center sm:bottom-8"
			aria-live="polite"
			aria-atomic="true"
		>
			<AnimatePresence>
				{visible && (
					<motion.div
						initial={{ opacity: 0, y: 12, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.98 }}
						transition={{ type: "spring", bounce: 0, duration: 0.35 }}
						role="status"
						className="liquid-glass liquid-glass--deep rounded-full border border-black/[0.08] px-5 py-3 text-sm font-semibold tracking-[-0.01em] text-neutral-900 shadow-[0_18px_50px_-12px_rgba(15,23,42,0.32)] dark:border-white/10 dark:text-white"
					>
						不过是又一个chlx小巧思
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default memo(EasterEggToast);
