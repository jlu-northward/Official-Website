import {
	motion,
	useReducedMotion,
	useScroll,
	useSpring,
	useTransform,
} from "framer-motion";
import { memo, useRef } from "react";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import {
	FiArrowRight,
	FiBookOpen,
	FiHeart,
	FiMessageCircle,
	FiStar,
	FiUsers,
} from "react-icons/fi";
import PartnerMarquee from "@components/sections/PartnerMarquee";
import CommentBarrage from "@components/ui/CommentBarrage";
import type { AppHeroProps, Feature, Partner } from "config";
import {
	revealFadeUp,
	springBouncy,
	springGentle,
	springSnappy,
	staggerDelay,
} from "config/motion";

interface LandingPageProps extends AppHeroProps {
	features: Feature[];
	partners: Partner[];
}

const productScenes = [
	{
		eyebrow: "校园广场",
		title: "听见吉大，也让吉大听见你。",
		description:
			"匿名表达、热点讨论、关注与私信，都在一个足够轻松的校园社区里发生。",
		image: "/screenshots/home.webp",
		imageWidth: 1170,
		imageHeight: 2532,
		accent: "from-sky-400/35 via-blue-500/10 to-transparent",
		meta: "此刻，校园正在发生",
	},
	{
		eyebrow: "实时热点",
		title: "校园正在发生什么，一眼就知道。",
		description:
			"从课程体验到食堂新品，从社团活动到校园日常，重要和有趣的事都不会错过。",
		image: "/screenshots/hot.webp",
		imageWidth: 1170,
		imageHeight: 2532,
		accent: "from-violet-400/30 via-indigo-500/10 to-transparent",
		meta: "热榜持续更新",
	},
	{
		eyebrow: "吉大课表",
		title: "课表放得下，生活才装得满。",
		description:
			"支持自由编辑、课表导入和 iOS 桌面小组件，纯净无广告，让课表随手可用、清爽好看。",
		image: "/screenshots/schedule.webp",
		imageWidth: 1080,
		imageHeight: 2275,
		accent: "from-cyan-300/35 via-sky-500/10 to-transparent",
		meta: "自由编辑 · 一键导入 · 纯净无广告",
	},
	{
		eyebrow: "向北评分榜",
		title: "真实体验，帮你更快做选择。",
		description:
			"课程、活动与校园体验来自同学们的真实分享，少一点试错，多一点确定。",
		image: "/screenshots/rate.webp",
		imageWidth: 1170,
		imageHeight: 2532,
		accent: "from-amber-300/35 via-orange-400/10 to-transparent",
		meta: "来自同学的真实评价",
	},
	{
		eyebrow: "工具箱",
		title: "常用入口，一处就能找到。",
		description: "把常用工具收进一个地方，需要时一眼就能找到。",
		image: "/screenshots/square.webp",
		imageWidth: 1170,
		imageHeight: 2532,
		accent: "from-fuchsia-300/30 via-purple-400/10 to-transparent",
		meta: "更多实用工具持续加入",
	},
];

const featureIcons = [FiMessageCircle, FiUsers, FiStar, FiBookOpen];

// 全站统一令牌见 src/config/motion.ts
const spring = springGentle;
const scrollSpring = { stiffness: 115, damping: 28, mass: 0.42 };

const DownloadButton = ({
	href,
	platform,
	label,
	icon: Icon,
	primary = false,
}: {
	href: string;
	platform: string;
	label: string;
	icon: typeof FaApple;
	primary?: boolean;
}) => {
	const reduceMotion = useReducedMotion();
	const hasMotion = !reduceMotion;

	return (
		<motion.a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			data-umami-event={`download-${platform.toLowerCase()}`}
			initial={false}
			animate="rest"
			whileHover={hasMotion ? "hover" : undefined}
			variants={
				hasMotion ? { rest: { scale: 1 }, hover: { scale: 1.025 } } : undefined
			}
			transition={springSnappy}
			className={`group relative inline-flex min-h-14 items-center gap-3 rounded-full px-5 py-2.5 text-left outline-none transition-[box-shadow,background-color] duration-300 will-change-transform focus-visible:ring-4 focus-visible:ring-sky-500/25 active:scale-[0.97] ${
				primary
					? "bg-neutral-950 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_6px_18px_rgba(15,23,42,0.18)] hover:bg-neutral-900 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_22px_50px_-10px_rgba(15,23,42,0.45)] dark:bg-white dark:text-neutral-950 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_6px_18px_rgba(15,23,42,0.18)] dark:hover:bg-neutral-100 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_22px_50px_-10px_rgba(15,23,42,0.35)]"
					: "liquid-glass liquid-glass--thin bg-white/56 hover:bg-white/72 border border-black/[0.07] text-neutral-950 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_22px_50px_-15px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/[0.09]"
			}`}
		>
			<motion.span
				className="shrink-0 will-change-transform"
				variants={
					hasMotion
						? {
								rest: { scale: 1, rotate: 0 },
								hover: { scale: 1.08, rotate: -8 },
							}
						: undefined
				}
				transition={springBouncy}
			>
				<Icon className="h-5 w-5" aria-hidden="true" />
			</motion.span>
			<span>
				<span className="block text-[10px] font-medium uppercase leading-none tracking-[0.12em] opacity-55">
					{label}
				</span>
				<span className="mt-1 block text-[15px] font-semibold leading-none tracking-[-0.01em]">
					{platform}
				</span>
			</span>
			<motion.span
				className="ml-1 inline-flex h-4 w-4 items-center justify-center opacity-45 will-change-transform"
				aria-hidden="true"
				variants={
					hasMotion
						? {
								rest: { x: 0 },
								hover: { x: 4 },
							}
						: undefined
				}
				transition={springSnappy}
			>
				<FiArrowRight className="h-4 w-4" />
			</motion.span>
		</motion.a>
	);
};

const Phone = ({
	src,
	alt,
	width,
	height,
	className = "",
	priority = false,
	eager = false,
}: {
	src: string;
	alt: string;
	width: number;
	height: number;
	className?: string;
	priority?: boolean;
	eager?: boolean;
}) => (
	<div className={className}>
		<div className="relative overflow-hidden rounded-[2.1rem] border border-neutral-800 bg-gradient-to-b from-neutral-700 via-neutral-950 to-black p-[1.2%] shadow-[0_24px_60px_rgba(15,23,42,0.16)] dark:border-neutral-700">
			<img
				src={src}
				alt={alt}
				width={width}
				height={height}
				loading={priority || eager ? "eager" : "lazy"}
				fetchPriority={priority ? "high" : eager ? "low" : "auto"}
				decoding="async"
				className="block h-auto w-full rounded-[1.9rem]"
			/>
		</div>
	</div>
);

const ProductGallery = ({ reduceMotion }: { reduceMotion: boolean | null }) => (
	<div className="relative -mx-5 overflow-hidden sm:mx-0">
		<div
			className="flex snap-x snap-proximity gap-5 overflow-x-auto overscroll-x-contain px-5 pb-8 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-0 [&::-webkit-scrollbar]:hidden"
			aria-label="向北 App 功能截图，可横向滚动查看更多"
		>
			{productScenes.map((scene, index) => (
				<motion.article
					key={scene.image}
					initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.2 }}
					transition={{
						...spring,
						delay: reduceMotion ? 0 : staggerDelay(index, 0.04, 0.16),
					}}
					whileHover={
						reduceMotion ? undefined : { y: -6, transition: springSnappy }
					}
					className="liquid-glass relative flex w-[min(84vw,340px)] shrink-0 snap-center flex-col overflow-hidden rounded-[2.25rem] border border-black/[0.045] px-6 pb-7 pt-8 sm:w-[340px] dark:border-white/[0.08]"
				>
					<div
						className={`pointer-events-none absolute inset-x-[-15%] top-[-8%] h-[58%] rounded-full bg-gradient-to-b ${scene.accent} blur-[58px]`}
						aria-hidden="true"
					/>
					<div className="relative mx-auto w-[88%] max-w-[270px]">
						<Phone
							src={scene.image}
							alt={`向北 App ${scene.eyebrow}界面`}
							width={scene.imageWidth}
							height={scene.imageHeight}
						/>
					</div>
					<div className="relative mt-8 border-t border-black/[0.08] pt-6 dark:border-white/[0.1]">
						<div className="flex items-center justify-between gap-4">
							<p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
								{scene.eyebrow}
							</p>
							<span className="text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">
								{String(index + 1).padStart(2, "0")}
							</span>
						</div>
						<h3 className="mt-3 text-2xl font-semibold leading-[1.08] tracking-[-0.04em] text-neutral-950 dark:text-white">
							{scene.title}
						</h3>
						<p className="mt-4 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
							{scene.description}
						</p>
						<div className="mt-6 flex items-center gap-2 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
							<span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
							{scene.meta}
						</div>
					</div>
				</motion.article>
			))}
			<div className="w-px shrink-0 sm:hidden" aria-hidden="true" />
		</div>
		<div
			className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#f5f5f7] to-transparent sm:w-16 dark:from-[#09090b]"
			aria-hidden="true"
		/>
	</div>
);

const LandingPage = ({
	title,
	description,
	storeLinks,
	logo,
	features,
	partners,
}: LandingPageProps) => {
	const reduceMotion = useReducedMotion();
	const heroRef = useRef<HTMLElement>(null);
	const storyRef = useRef<HTMLElement>(null);
	const { scrollY, scrollYProgress: pageProgress } = useScroll();
	const { scrollYProgress: heroProgress } = useScroll({
		target: heroRef,
		offset: ["start start", "end start"],
	});
	const { scrollYProgress: storyProgress } = useScroll({
		target: storyRef,
		offset: ["start end", "end start"],
	});
	const smoothScrollY = useSpring(scrollY, scrollSpring);
	const smoothPageProgress = useSpring(pageProgress, scrollSpring);
	const smoothHeroProgress = useSpring(heroProgress, scrollSpring);
	const smoothStoryProgress = useSpring(storyProgress, scrollSpring);
	const navScale = useTransform(
		smoothScrollY,
		[0, 140],
		reduceMotion ? [1, 1] : [1, 0.975],
	);
	const navY = useTransform(
		smoothScrollY,
		[0, 140],
		reduceMotion ? [0, 0] : [0, -2],
	);
	const navSurfaceOpacity = useTransform(smoothScrollY, [0, 180], [0, 0.28]);
	const heroCopyY = useTransform(
		smoothHeroProgress,
		[0, 1],
		reduceMotion ? [0, 0] : [0, 92],
	);
	const heroCopyOpacity = useTransform(
		smoothHeroProgress,
		[0, 0.72, 1],
		reduceMotion ? [1, 1, 1] : [1, 0.82, 0.22],
	);
	const heroVisualY = useTransform(
		smoothHeroProgress,
		[0, 1],
		reduceMotion ? [0, 0] : [0, 150],
	);
	const heroVisualScale = useTransform(
		smoothHeroProgress,
		[0, 1],
		reduceMotion ? [1, 1] : [1, 0.92],
	);
	const heroVisualRotate = useTransform(
		smoothHeroProgress,
		[0, 1],
		reduceMotion ? [0, 0] : [0, 2.2],
	);
	const heroGlowY = useTransform(
		smoothHeroProgress,
		[0, 1],
		reduceMotion ? [0, 0] : [0, 130],
	);
	const heroSheenX = useTransform(
		smoothHeroProgress,
		[0, 1],
		reduceMotion ? [-180, -180] : [-180, 560],
	);
	const storyGlowY = useTransform(
		smoothStoryProgress,
		[0, 1],
		reduceMotion ? [0, 0] : [80, -90],
	);
	const storyContentY = useTransform(
		smoothStoryProgress,
		[0, 0.5, 1],
		reduceMotion ? [0, 0, 0] : [36, 0, -24],
	);
	const reveal = reduceMotion
		? { initial: { opacity: 1 }, whileInView: { opacity: 1 } }
		: {
				initial: revealFadeUp.initial,
				whileInView: revealFadeUp.animate,
			};

	return (
		<>
			<a
				href="#main-content"
				className="sr-only z-[100] rounded-full bg-white px-4 py-2 text-sm font-semibold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
			>
				跳到主要内容
			</a>

			<motion.div
				style={{ scaleX: smoothPageProgress }}
				className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left transform-gpu bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 will-change-transform"
				aria-hidden="true"
			/>
			<header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-5">
				<motion.nav
					style={{ scale: navScale, y: navY }}
					aria-label="主导航"
					className="liquid-glass liquid-glass--deep liquid-glass--interactive mx-auto flex h-14 max-w-6xl origin-top transform-gpu items-center justify-between overflow-hidden rounded-full border border-black/[0.06] px-3 will-change-transform dark:border-white/10"
				>
					<motion.div
						style={{ opacity: navSurfaceOpacity }}
						className="pointer-events-none absolute inset-0 -z-10 bg-white dark:bg-neutral-950"
						aria-hidden="true"
					/>
					<a
						href="#top"
						className="flex items-center gap-2 rounded-full px-2 py-1.5 outline-none focus-visible:ring-4 focus-visible:ring-sky-500/25"
						aria-label="向北首页"
					>
						<img
							src={`/${logo.src}`}
							alt=""
							className="h-8 w-8 rounded-[0.65rem] shadow-sm"
						/>
						<span className="text-[15px] font-semibold tracking-[-0.025em]">
							向北
						</span>
					</a>
					<div className="hidden items-center gap-1 text-[13px] font-medium text-neutral-600 md:flex dark:text-neutral-300">
						<a
							href="#product"
							className="rounded-full px-4 py-2 outline-none transition-colors duration-300 hover:bg-black/[0.05] hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-sky-500/30 dark:hover:bg-white/[0.07] dark:hover:text-white"
						>
							产品
						</a>
						<a
							href="#features"
							className="rounded-full px-4 py-2 outline-none transition-colors duration-300 hover:bg-black/[0.05] hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-sky-500/30 dark:hover:bg-white/[0.07] dark:hover:text-white"
						>
							功能
						</a>
						<a
							href="#story"
							className="rounded-full px-4 py-2 outline-none transition-colors duration-300 hover:bg-black/[0.05] hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-sky-500/30 dark:hover:bg-white/[0.07] dark:hover:text-white"
						>
							关于我们
						</a>
					</div>
					<a
						href="#download"
						className="rounded-full bg-neutral-950 px-4 py-2 text-[13px] font-semibold text-white outline-none transition-transform duration-100 focus-visible:ring-4 focus-visible:ring-sky-500/25 active:scale-[0.97] dark:bg-white dark:text-neutral-950"
					>
						下载 App
					</a>
				</motion.nav>
			</header>

			<main id="main-content" className="overflow-hidden" tabIndex={-1}>
				<section
					ref={heroRef}
					id="top"
					className="relative isolate min-h-[100svh] px-5 pb-20 pt-28 sm:pt-36 lg:min-h-[820px] lg:pb-20 lg:pt-40"
				>
					<div
						className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[780px] overflow-hidden"
						aria-hidden="true"
					>
						<motion.div
							style={{ y: heroGlowY }}
							className="absolute left-1/2 top-[-22rem] h-[52rem] w-[72rem] -translate-x-1/2 transform-gpu rounded-[50%] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.28),rgba(99,102,241,0.12)_42%,transparent_70%)] blur-2xl will-change-transform dark:opacity-70"
						/>
						<div className="north-grid absolute inset-0 opacity-[0.28] dark:opacity-[0.16]" />
					</div>
					<CommentBarrage />

					<div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
						<motion.div
							style={{ y: heroCopyY, opacity: heroCopyOpacity }}
							className="relative z-10 transform-gpu text-center will-change-transform lg:text-left"
						>
							<motion.h1
								initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...springGentle, delay: reduceMotion ? 0 : 0.05 }}
								className="inline-block text-balance text-left text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-neutral-950 sm:leading-[0.94] sm:tracking-[-0.055em] lg:block dark:text-white"
							>
								吉大这么大，
								<br />
								来向北看看
							</motion.h1>
							<motion.p
								initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...springGentle, delay: reduceMotion ? 0 : 0.14 }}
								className="mx-auto mt-5 max-w-xl text-balance text-base leading-7 text-neutral-600 sm:mt-7 sm:text-lg sm:leading-8 lg:mx-0 dark:text-neutral-300"
							>
								认识校园，表达自己，找到同路的人。有问题来求助，有生活来分享，有体验来点评，汇聚万千吉大声音
							</motion.p>
							<motion.div
								initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...springGentle, delay: reduceMotion ? 0 : 0.23 }}
								className="mt-7 flex flex-col items-stretch justify-center gap-2.5 sm:mt-9 sm:flex-row sm:items-center sm:gap-3 lg:justify-start"
							>
								<DownloadButton
									href="/download-ios"
									platform="iOS"
									label="下载适用于"
									icon={FaApple}
									primary
								/>
								<DownloadButton
									href="/download-android"
									platform="Android"
									label="下载适用于"
									icon={FaGooglePlay}
								/>
							</motion.div>
							<motion.a
								href={storeLinks.google2}
								target="_blank"
								rel="noopener noreferrer"
								initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ ...springGentle, delay: reduceMotion ? 0 : 0.32 }}
								className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 underline decoration-black/15 underline-offset-4 outline-none transition-colors hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-sky-500/30 sm:mt-4 dark:decoration-white/20 dark:hover:text-neutral-200"
							>
								Android 下载遇到问题？使用备用地址
								<FiArrowRight className="h-3 w-3" aria-hidden="true" />
							</motion.a>
						</motion.div>

						<motion.figure
							style={{
								y: heroVisualY,
								scale: heroVisualScale,
								rotate: heroVisualRotate,
							}}
							initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ ...springGentle, delay: reduceMotion ? 0 : 0.18 }}
							className="relative mx-auto w-full max-w-[530px] origin-center transform-gpu will-change-transform"
						>
							<div className="relative h-[360px] sm:h-[610px]">
								<div className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_center,rgba(125,211,252,0.34),rgba(191,219,254,0.14)_42%,transparent_72%)] blur-2xl dark:opacity-60" />
								<motion.div
									style={{ x: heroSheenX }}
									className="pointer-events-none absolute -inset-y-16 left-0 z-[2] w-[30%] skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-45 will-change-transform dark:via-white/[0.05]"
									aria-hidden="true"
								/>
								<Phone
									src="/screenshots/home.webp"
									alt="向北 App 左侧校园广场界面"
									width={1170}
									height={2532}
									eager
									className="absolute left-[4%] top-[15%] z-10 w-[38%] rotate-[-9deg]"
								/>
								<Phone
									src="/screenshots/hot.webp"
									alt="向北 App 中间实时热点界面"
									width={1170}
									height={2532}
									priority
									className="absolute left-1/2 top-[2%] z-30 w-[44%] -translate-x-1/2"
								/>
								<Phone
									src="/screenshots/square.webp"
									alt="向北 App 右侧工具箱界面"
									width={1170}
									height={2532}
									eager
									className="absolute right-[2%] top-[14%] z-20 w-[38%] rotate-[9deg]"
								/>
							</div>
							<figcaption className="relative mx-auto mt-4 flex max-w-md items-center justify-center gap-3 border-t border-black/[0.08] pt-5 lg:justify-start dark:border-white/[0.1]">
								<span className="h-8 w-0.5 shrink-0 rounded-full bg-sky-500" />
								<span>
									<span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300">
										Northward
									</span>
									<span className="mt-1 block text-sm font-semibold tracking-[-0.02em]">
										吉大人都在用的校园论坛App
									</span>
								</span>
							</figcaption>
						</motion.figure>
					</div>
				</section>

				<PartnerMarquee items={partners} />

				<section id="product" className="scroll-mt-24 px-5 py-16 sm:py-24">
					<div className="mx-auto max-w-6xl">
						<motion.div
							{...reveal}
							viewport={{ once: true, amount: 0.35 }}
							transition={spring}
							className="mx-auto mb-12 max-w-3xl text-center sm:mb-16 sm:mb-24"
						>
							<p className="text-sm font-semibold text-sky-600 dark:text-sky-300">
								打开一次，
							</p>
							<h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-neutral-950 sm:text-6xl sm:leading-[1.04] sm:tracking-[-0.05em] dark:text-white">
								就更懂吉大一点。
							</h2>
						</motion.div>

						<ProductGallery reduceMotion={reduceMotion} />
					</div>
				</section>

				<section id="features" className="scroll-mt-24 px-5 py-16 sm:py-24">
					<div className="mx-auto max-w-6xl">
						<motion.div
							{...reveal}
							viewport={{ once: true, amount: 0.35 }}
							transition={spring}
							className="max-w-3xl"
						>
							<p className="text-sm font-semibold text-sky-600 dark:text-sky-300">
								一个 App，装下校园生活
							</p>
							<h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.1] tracking-[-0.04em] text-neutral-950 sm:text-6xl sm:leading-[1.05] sm:tracking-[-0.05em] dark:text-white">
								功能很多，使用很轻。
							</h2>
						</motion.div>
						<div className="mt-12 grid border-y border-black/[0.08] sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 dark:border-white/[0.1]">
							{features.map((feature, index) => {
								const Icon = featureIcons[index] ?? FiHeart;
								return (
									<motion.article
										key={feature.title}
										{...reveal}
										viewport={{ once: true, amount: 0.25 }}
										transition={{
											...spring,
											delay: reduceMotion ? 0 : staggerDelay(index, 0.04),
										}}
										className="group border-b border-black/[0.08] px-1 py-9 transition-colors duration-300 hover:bg-black/[0.02] sm:px-7 sm:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0 dark:border-white/[0.1] dark:hover:bg-white/[0.03]"
									>
										<div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 dark:bg-sky-400/10 dark:text-sky-300">
											<Icon className="h-4.5 w-4.5" aria-hidden="true" />
										</div>
										<h3 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
											{feature.title}
										</h3>
										<p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
											{feature.description}
										</p>
									</motion.article>
								);
							})}
						</div>
					</div>
				</section>

				<section
					ref={storyRef}
					id="story"
					className="scroll-mt-24 py-16 sm:py-24"
				>
					<motion.div
						style={{ y: storyContentY }}
						className="relative mx-auto max-w-none transform-gpu overflow-hidden bg-neutral-950 px-5 py-16 text-white will-change-transform sm:py-24 sm:py-28"
					>
						<motion.div
							style={{ y: storyGlowY }}
							className="pointer-events-none absolute right-[-12rem] top-[-12rem] h-[32rem] w-[32rem] transform-gpu rounded-full bg-sky-500/25 blur-[100px] will-change-transform"
							aria-hidden="true"
						/>
						<div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:gap-14">
							<div>
								<p className="text-sm font-semibold text-sky-300">
									名字来自《先生向北》
								</p>
								<h2 className="mt-5 max-w-3xl text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl sm:leading-[1.03] sm:tracking-[-0.055em]">
									所谓向北，是一群吉大人对校园的认真想象。
								</h2>
								<p className="mt-6 max-w-2xl text-base leading-7 text-neutral-300 sm:mt-7 sm:text-lg sm:leading-8">
									「向北」由吉林大学开放原子开源社团推出。我们来自不同年级与专业，因为热爱技术、开源与校园生活走到一起。
								</p>
								<a
									href="mailto:admin@northward.zone"
									className="group mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition-shadow duration-300 hover:shadow-[0_18px_45px_-12px_rgba(125,211,252,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/30 active:scale-[0.97] sm:mt-8"
								>
									加入我们{" "}
									<FiArrowRight
										className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
										aria-hidden="true"
									/>
								</a>
							</div>
							<dl className="grid grid-cols-2 border-y border-white/15">
								{[
									["40+", "团队成员"],
									["13", "不同专业"],
									["7", "覆盖年级"],
									["1", "共同方向"],
								].map(([value, label]) => (
									<div
										key={label}
										className="border-b border-white/15 py-4 odd:border-r odd:pr-4 even:pl-4 sm:py-6 sm:odd:pr-5 sm:even:pl-5 [&:nth-last-child(-n+2)]:border-b-0"
									>
										<dd className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl sm:tracking-[-0.05em]">
											{value}
										</dd>
										<dt className="mt-1 text-xs text-neutral-400">{label}</dt>
									</div>
								))}
							</dl>
						</div>
					</motion.div>
				</section>

				<section
					id="download"
					className="scroll-mt-24 px-5 pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pb-36 lg:pt-28"
				>
					<motion.div
						{...reveal}
						viewport={{ once: true, amount: 0.3 }}
						transition={spring}
						className="mx-auto max-w-4xl border-t border-black/[0.08] px-6 py-12 text-center sm:px-10 sm:py-16 lg:py-24 dark:border-white/[0.1]"
					>
						<img
							src={`/${logo.src}`}
							alt="向北 App 图标"
							className="mx-auto h-20 w-20 rounded-[1.45rem] shadow-[0_20px_50px_rgba(15,23,42,0.16)] sm:h-24 sm:w-24 sm:rounded-[1.8rem]"
						/>
						<h2 className="mt-7 text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.045em] text-neutral-950 sm:mt-8 sm:text-6xl sm:leading-[1.04] sm:tracking-[-0.055em] dark:text-white">
							现在，出发向北。
						</h2>
						<p className="mx-auto mt-4 max-w-xl text-base leading-7 text-neutral-600 sm:mt-5 sm:text-lg sm:leading-8 dark:text-neutral-300">
							下载向北，和吉大校园重新认识一次。
						</p>
						<div className="mt-7 flex flex-col items-stretch justify-center gap-2.5 sm:mt-9 sm:flex-row sm:items-center sm:gap-3">
							<DownloadButton
								href="/download-ios"
								platform="iOS"
								label="下载适用于"
								icon={FaApple}
								primary
							/>
							<DownloadButton
								href="/download-android"
								platform="Android"
								label="下载适用于"
								icon={FaGooglePlay}
							/>
						</div>
					</motion.div>
				</section>
			</main>
		</>
	);
};

export default memo(LandingPage);
