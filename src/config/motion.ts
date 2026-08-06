import type { Transition, Variants } from "framer-motion";

/**
 * 全站统一的 Apple 风格动效令牌。
 *
 * 设计原则（参考 WWDC《Designing Fluid Interfaces》）：
 * - 默认临界阻尼（bounce: 0），优雅、不喧宾夺主；
 * - 仅在带"动量"的交互（点按、弹层、图标）上使用轻微回弹；
 * - 常规动画时长控制在 0.3–0.6s；
 * - 全站共享同一组缓动曲线，保证运动语言一致。
 */

/** Apple 标准缓动（对称，适合可逆过渡） */
export const appleEase: [number, number, number, number] = [0.32, 0.72, 0, 1];
/** Apple 减速缓动（入场：快速响应、柔和落定） */
export const appleEaseOut: [number, number, number, number] = [
	0.22, 1, 0.36, 1,
];
/** Apple 加速缓动（出场：先加速让位） */
export const appleEaseIn: [number, number, number, number] = [0.64, 0, 0.78, 0];

/** 临界阻尼弹簧：滚动揭示、卡片、页面级位移（无回弹） */
export const springGentle: Transition = {
	type: "spring",
	bounce: 0,
	duration: 0.55,
};

/** 轻快弹簧：按钮、悬停浮起等微交互（轻微回弹） */
export const springSnappy: Transition = {
	type: "spring",
	bounce: 0.25,
	duration: 0.4,
};

/** 弹性弹簧：图标、弹层、点按反馈（明显回弹，用于带"动量"的交互） */
export const springBouncy: Transition = {
	type: "spring",
	bounce: 0.4,
	duration: 0.5,
};

/** 遮罩/淡入淡出过渡（纯透明度，用减速缓动） */
export const fadeTransition: Transition = {
	duration: 0.3,
	ease: appleEaseOut,
};

/** 滚动揭示：柔和淡入 + 位移（对象字面量类型，可直接展开到 initial/whileInView） */
export const revealFadeUp = {
	initial: { opacity: 0, y: 28 },
	animate: { opacity: 1, y: 0 },
};

/** 弹层/卡片入场：淡入 + 轻微上移 + 缩放（配合 springSnappy/springBouncy） */
export const popIn: Variants = {
	initial: { opacity: 0, scale: 0.94, y: 16 },
	animate: { opacity: 1, scale: 1, y: 0 },
	exit: { opacity: 0, scale: 0.96, y: 8 },
};

/** 交错延迟：列表项依次入场，封顶避免拖沓 */
export const staggerDelay = (index: number, step = 0.05, max = 0.2): number =>
	Math.min(index * step, max);
