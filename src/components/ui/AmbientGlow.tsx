import {
	motion,
	useMotionValue,
	useReducedMotion,
	useScroll,
	useSpring,
	useTransform,
} from "framer-motion";
import { memo, useEffect } from "react";

const pointerSpring = { stiffness: 42, damping: 24, mass: 0.9 };
const scrollSpring = { stiffness: 70, damping: 30, mass: 0.8 };

const AmbientGlow = () => {
	const reduceMotion = useReducedMotion();
	const pointerX = useMotionValue(0);
	const pointerY = useMotionValue(0);
	const smoothPointerX = useSpring(pointerX, pointerSpring);
	const smoothPointerY = useSpring(pointerY, pointerSpring);
	const { scrollYProgress } = useScroll();
	const smoothScroll = useSpring(scrollYProgress, scrollSpring);

	const driftX = useTransform(
		smoothPointerX,
		[-1, 1],
		reduceMotion ? [0, 0] : [-18, 18],
	);
	const driftY = useTransform(
		smoothPointerY,
		[-1, 1],
		reduceMotion ? [0, 0] : [-14, 14],
	);
	const reverseDriftX = useTransform(driftX, (value) => value * -0.7);
	const softDriftX = useTransform(driftX, (value) => value * 0.45);
	const hazeDriftX = useTransform(driftX, (value) => value * 0.25);
	const hazeDriftY = useTransform(driftY, (value) => value * 0.35);
	const upperY = useTransform(
		smoothScroll,
		[0, 1],
		reduceMotion ? [0, 0] : [0, -70],
	);
	const middleY = useTransform(
		smoothScroll,
		[0, 1],
		reduceMotion ? [0, 0] : [60, -60],
	);
	const lowerY = useTransform(
		smoothScroll,
		[0, 1],
		reduceMotion ? [0, 0] : [90, -20],
	);

	useEffect(() => {
		if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

		const handlePointerMove = (event: PointerEvent) => {
			pointerX.set((event.clientX / window.innerWidth - 0.5) * 2);
			pointerY.set((event.clientY / window.innerHeight - 0.5) * 2);
		};

		const handlePointerLeave = () => {
			pointerX.set(0);
			pointerY.set(0);
		};

		window.addEventListener("pointermove", handlePointerMove, {
			passive: true,
		});
		document.documentElement.addEventListener("mouseleave", handlePointerLeave);
		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			document.documentElement.removeEventListener(
				"mouseleave",
				handlePointerLeave,
			);
		};
	}, [pointerX, pointerY, reduceMotion]);

	return (
		<div
			className="ambient-glow pointer-events-none fixed inset-0 z-0 overflow-hidden"
			aria-hidden="true"
		>
			<motion.div
				style={{ x: driftX, y: upperY }}
				className="absolute inset-x-[-18vw] top-[-20rem] h-[54rem] transform-gpu will-change-transform"
			>
				<motion.div
					animate={
						reduceMotion
							? undefined
							: {
									x: ["-2%", "4%", "-2%"],
									y: ["0%", "3%", "0%"],
									scale: [1, 1.045, 1],
								}
					}
					transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
					className="dark:bg-sky-500/12 absolute left-[10%] top-[10%] h-[34rem] w-[52rem] rounded-[50%] bg-sky-300/25 blur-[105px] will-change-transform"
				/>
				<motion.div
					animate={
						reduceMotion
							? undefined
							: {
									x: ["3%", "-4%", "3%"],
									y: ["2%", "-3%", "2%"],
									scale: [1.035, 0.985, 1.035],
								}
					}
					transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
					className="absolute right-[2%] top-[4%] h-[32rem] w-[44rem] rounded-[50%] bg-indigo-300/20 blur-[115px] will-change-transform dark:bg-indigo-500/10"
				/>
			</motion.div>

			<motion.div
				style={{ x: reverseDriftX, y: middleY }}
				className="absolute inset-x-[-12vw] top-[34vh] h-[82rem] transform-gpu will-change-transform"
			>
				<motion.div
					animate={
						reduceMotion
							? undefined
							: {
									x: ["-5%", "5%", "-5%"],
									y: ["-2%", "4%", "-2%"],
									rotate: [0, 2, 0],
								}
					}
					transition={{ duration: 44, repeat: Infinity, ease: "easeInOut" }}
					className="bg-violet-300/14 absolute left-[-8%] top-[8%] h-[38rem] w-[48rem] rounded-[48%] blur-[120px] will-change-transform dark:bg-violet-500/[0.075]"
				/>
				<motion.div
					animate={
						reduceMotion
							? undefined
							: {
									x: ["4%", "-5%", "4%"],
									y: ["3%", "-3%", "3%"],
									scale: [0.98, 1.04, 0.98],
								}
					}
					transition={{ duration: 36, repeat: Infinity, ease: "easeInOut" }}
					className="absolute right-[-10%] top-[28%] h-[42rem] w-[54rem] rounded-[50%] bg-sky-200/20 blur-[125px] will-change-transform dark:bg-cyan-500/[0.065]"
				/>
			</motion.div>

			<motion.div
				style={{ x: softDriftX, y: lowerY }}
				className="absolute inset-x-[-18vw] bottom-[-28rem] h-[68rem] transform-gpu will-change-transform"
			>
				<motion.div
					animate={
						reduceMotion
							? undefined
							: {
									x: ["2%", "-3%", "2%"],
									y: ["0%", "-3%", "0%"],
									scale: [1.02, 0.98, 1.02],
								}
					}
					transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
					className="bg-blue-200/18 absolute left-[16%] top-[4%] h-[38rem] w-[58rem] rounded-[50%] blur-[130px] will-change-transform dark:bg-blue-500/[0.07]"
				/>
			</motion.div>

			<motion.div
				style={{ x: hazeDriftX, y: hazeDriftY }}
				className="absolute inset-0 transform-gpu bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.34),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(245,245,247,0.18))] will-change-transform dark:bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.035),transparent_34%),linear-gradient(to_bottom,rgba(9,9,11,0.16),rgba(9,9,11,0.44))]"
			/>
		</div>
	);
};

export default memo(AmbientGlow);
