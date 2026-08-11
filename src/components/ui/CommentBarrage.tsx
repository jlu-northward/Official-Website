import { memo, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { barrageRows } from "config/barrage";

const usernameStyles = [
	"text-sky-700 dark:text-sky-300",
	"text-emerald-700 dark:text-emerald-300",
	"text-amber-700 dark:text-amber-300",
	"text-rose-700 dark:text-rose-300",
] as const;

const rowMotion = [
	{ top: "10%", duration: 62 },
	{ top: "24%", duration: 74 },
	{ top: "39%", duration: 68 },
	{ top: "55%", duration: 80 },
	{ top: "71%", duration: 70 },
	{ top: "87%", duration: 76 },
] as const;

const CommentBarrage = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isActive, setIsActive] = useState(false);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let isVisible = false;
		const updatePlayback = () => setIsActive(isVisible && !document.hidden);
		const observer = new IntersectionObserver(
			([entry]) => {
				isVisible = entry.isIntersecting;
				updatePlayback();
			},
			{ rootMargin: "120px" },
		);

		observer.observe(container);
		document.addEventListener("visibilitychange", updatePlayback);
		return () => {
			observer.disconnect();
			document.removeEventListener("visibilitychange", updatePlayback);
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[100svh] overflow-hidden sm:inset-0 sm:h-auto"
			aria-hidden="true"
		>
			<div className="absolute inset-0 opacity-[0.34] [mask-image:linear-gradient(to_bottom,transparent_2%,black_10%,black_92%,transparent_100%)] sm:opacity-[0.38] dark:opacity-30">
				<div className="absolute inset-0 [mask-image:radial-gradient(ellipse_58%_27%_at_50%_31%,transparent_0%,transparent_66%,black_100%)] sm:[mask-image:radial-gradient(ellipse_65%_30%_at_50%_27%,transparent_0%,transparent_70%,black_100%)] lg:[mask-image:radial-gradient(ellipse_30%_40%_at_27%_53%,transparent_0%,transparent_70%,black_100%)]">
					{barrageRows.map((comments, rowIndex) => (
						<div
							key={rowMotion[rowIndex].top}
							className="absolute inset-x-0 overflow-visible"
							style={{ top: rowMotion[rowIndex].top }}
						>
							<div
								style={
									{
										"--barrage-duration": `${rowMotion[rowIndex].duration}s`,
										animationPlayState: isActive ? "running" : "paused",
									} as CSSProperties
								}
								className="barrage-track flex w-max min-w-max transform-gpu will-change-transform"
							>
								{[0, 1].map((copy) => (
									<div
										key={copy}
										className="flex min-w-[100vw] shrink-0 justify-around gap-3 pr-3 sm:gap-4 sm:pr-4"
									>
										{comments.map(([username, content], commentIndex) => (
											<div
												key={`${copy}-${username}-${content}`}
												className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-black/[0.055] bg-white/80 px-3 py-1.5 text-[10px] font-medium text-neutral-600 shadow-[0_8px_28px_rgba(15,23,42,0.055)] sm:h-11 sm:gap-2.5 sm:bg-white/90 sm:px-4 sm:text-xs dark:border-white/[0.08] dark:bg-neutral-900/75 dark:text-neutral-300 dark:shadow-[0_8px_28px_rgba(0,0,0,0.12)] sm:dark:bg-neutral-900/85"
											>
												<span
													className={`shrink-0 text-[10px] font-semibold sm:text-[11px] ${
														usernameStyles[
															(commentIndex + rowIndex) % usernameStyles.length
														]
													}`}
												>
													@{username}
												</span>
												<span>{content}</span>
											</div>
										))}
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default memo(CommentBarrage);
