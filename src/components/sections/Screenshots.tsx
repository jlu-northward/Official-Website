import type { ScreenshotsProps } from "config";
import { areImagesEqual } from "config";
import {
	appleEase,
	springGentle,
	springSnappy,
	staggerDelay,
} from "config/motion";
import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";

const Screenshots = ({ images }: ScreenshotsProps) => {
	const activeDevice: "iphone" = "iphone";
	const currentImages = images[activeDevice];
	const isIphone = true;

	const handleAnimationEvent = (action: "add" | "remove") => {
		const container = document.querySelector(".screenshots-container");
		container?.classList[action]("overflow-x-auto");
	};

	return (
		<div className="mb-16">
			<div
				className={`relative overflow-hidden min-h-[${isIphone ? "600px" : "300px"}]`}
			>
				<AnimatePresence mode="wait">
					<motion.div
						key={activeDevice}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.35, ease: appleEase }}
						className="screenshots-container scrollbar-thin scrollbar-track-gray-200 dark:scrollbar-track-white/5 scrollbar-thumb-gray-400 dark:scrollbar-thumb-white/10"
						onAnimationComplete={() => handleAnimationEvent("add")}
						onAnimationStart={() => handleAnimationEvent("remove")}
					>
						<div className="flex gap-6 pb-4">
							{currentImages.map((image, index) => (
								<motion.button
									key={image}
									initial={{ opacity: 0, y: 20 }}
									animate={{
										opacity: 1,
										y: 0,
										transition: {
											...springGentle,
											delay: staggerDelay(index, 0.08, 0.4),
										},
									}}
									exit={{ opacity: 0, y: 20 }}
									whileHover={{ y: -6, scale: 1.02, transition: springSnappy }}
									whileTap={{ scale: 0.97, transition: springSnappy }}
									onClick={() => window.openLightbox?.(index, activeDevice)}
									className="relative flex-shrink-0 overflow-hidden rounded-xl focus:outline-none"
								>
									<img
										src={image}
										alt={`Screenshot ${index + 1}`}
										width={1080}
										height={2285}
										className="block h-auto w-[240px] rounded-xl border border-gray-300 object-contain shadow-lg md:w-[260px] dark:border-white/10"
										loading="eager"
									/>
								</motion.button>
							))}
						</div>
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
};

export default memo(Screenshots, areImagesEqual);
