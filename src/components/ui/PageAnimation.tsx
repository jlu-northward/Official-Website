import { AnimatePresence, motion } from "framer-motion";
import { memo, type PropsWithChildren } from "react";
import { appleEase } from "config/motion";

const variants = {
	pageInitial: { opacity: 0, y: 12 },
	pageAnimate: { opacity: 1, y: 0 },
	pageExit: { opacity: 0, y: -8 },
};

const PageAnimation = ({ children }: PropsWithChildren) => (
	<AnimatePresence mode="wait">
		<motion.div
			initial="pageInitial"
			animate="pageAnimate"
			exit="pageExit"
			transition={{ duration: 0.35, ease: appleEase }}
			className="px-5"
			variants={variants}
		>
			{children}
		</motion.div>
	</AnimatePresence>
);

export default memo(PageAnimation);
