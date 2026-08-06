import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useState } from "react";
import { FiChevronUp } from "react-icons/fi";
import { springBouncy, springSnappy } from "config/motion";

const BackToTop = () => {
	const [isVisible, setIsVisible] = useState(false);

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	useEffect(() => {
		let timeoutId: number;

		const handleScroll = () => {
			if (timeoutId) return;

			timeoutId = window.setTimeout(() => {
				setIsVisible(window.scrollY > 300);
				timeoutId = 0;
			}, 100);
		};

		window.addEventListener("scroll", handleScroll);
		handleScroll();

		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (timeoutId) window.clearTimeout(timeoutId);
		};
	}, []);

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.button
					initial={{ opacity: 0, scale: 0.72, y: 12 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.8, y: 8 }}
					transition={springBouncy}
					whileHover={{ y: -3, transition: springSnappy }}
					whileTap={{ scale: 0.92, transition: springSnappy }}
					onClick={scrollToTop}
					className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl dark:border-white/10 dark:bg-black/80 dark:text-white"
					aria-label="Back to top"
				>
					<FiChevronUp size={24} />
				</motion.button>
			)}
		</AnimatePresence>
	);
};

export default memo(BackToTop);
