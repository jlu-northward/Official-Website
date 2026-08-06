import { motion, useAnimationFrame, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Partner } from "config";

interface PartnerMarqueeProps {
	items: Partner[];
}

const PartnerItem = ({ name, src, href }: Partner) => {
	const content = (
		<>
			<img
				src={src}
				alt=""
				loading="lazy"
				decoding="async"
				className="h-6 w-6 shrink-0 object-contain opacity-55 transition-opacity duration-300 group-hover:opacity-90"
				aria-hidden="true"
			/>
			<span className="whitespace-nowrap text-[13px] font-medium text-neutral-400 transition-colors duration-300 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300">
				{name}
			</span>
		</>
	);

	// mr-8 on every item (including the last) keeps the duplicated layout
	// symmetric, so halfWidth aligns exactly with the start of the next copy.
	const className =
		"group mr-8 inline-flex shrink-0 items-center gap-2.5 rounded-full px-2 py-1 outline-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-neutral-400/30 motion-reduce:transform-none motion-reduce:transition-none";

	if (href) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={className}
			>
				{content}
			</a>
		);
	}

	return <span className={className}>{content}</span>;
};

const PartnerMarquee = ({ items }: PartnerMarqueeProps) => {
	const reduceMotion = useReducedMotion();
	const [isPaused, setIsPaused] = useState(false);
	const trackRef = useRef<HTMLDivElement>(null);
	const sectionRef = useRef<HTMLElement>(null);
	const xRef = useRef(0);
	const lastTimeRef = useRef<number | null>(null);
	// px / second — comfortable reading speed
	const SPEED = 40;

	// Start with 4 copies as a safe default. After mount we measure the real
	// single-set width and viewport width, then bump copies up so the loop
	// point (halfWidth) always sits off-screen — no visible jump even with
	// very few items. Must stay even so the track splits into two equal halves.
	const [copies, setCopies] = useState(4);

	useEffect(() => {
		const section = sectionRef.current;
		const track = trackRef.current;
		if (!section || !track) return;

		const recompute = () => {
			const scrollW = track.scrollWidth;
			if (scrollW === 0 || copies === 0) return;
			const singleWidth = scrollW / copies;
			if (singleWidth === 0) return;
			const viewport = section.clientWidth;
			// Half the track must extend past the viewport (plus buffer) so the
			// wrap point is never visible.
			const minHalfWidth = viewport + 300;
			const setsNeeded = Math.ceil(minHalfWidth / singleWidth);
			const evenSets = setsNeeded % 2 === 0 ? setsNeeded : setsNeeded + 1;
			const next = Math.max(2, evenSets);
			if (next !== copies) {
				xRef.current = 0;
				if (track) track.style.transform = "translate3d(0,0,0)";
				setCopies(next);
			}
		};

		recompute();
		const ro = new ResizeObserver(recompute);
		ro.observe(section);
		return () => ro.disconnect();
		// Recompute when item count changes (new logos added/removed).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items, copies]);

	useAnimationFrame((time) => {
		if (reduceMotion || isPaused) {
			lastTimeRef.current = time;
			return;
		}
		const track = trackRef.current;
		if (!track) return;
		if (lastTimeRef.current === null) {
			lastTimeRef.current = time;
			return;
		}
		const delta = (time - lastTimeRef.current) / 1000; // seconds
		lastTimeRef.current = time;

		// Half the track width = one full visual loop (content is duplicated).
		const halfWidth = track.scrollWidth / 2;
		if (halfWidth === 0) return;

		xRef.current -= SPEED * delta;
		if (-xRef.current >= halfWidth) {
			xRef.current += halfWidth;
		}
		track.style.transform = `translate3d(${xRef.current}px, 0, 0)`;
	});

	if (!items.length) return null;

	const looped = Array.from({ length: copies }, () => items).flat();

	return (
		<section
			ref={sectionRef}
			aria-label="向北合作校园组织"
			className="relative w-full overflow-hidden bg-[#FAFAFC] py-5 dark:bg-[#131420]"
		>
			<div
				className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#FAFAFC] via-[#FAFAFC]/80 to-transparent dark:from-[#131420] dark:via-[#131420]/80"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#FAFAFC] via-[#FAFAFC]/80 to-transparent dark:from-[#131420] dark:via-[#131420]/80"
				aria-hidden="true"
			/>

			<motion.div
				role="list"
				aria-label="合作校园组织列表"
				ref={trackRef}
				onMouseEnter={() => setIsPaused(true)}
				onMouseLeave={() => setIsPaused(false)}
				onFocusCapture={() => setIsPaused(true)}
				onBlurCapture={() => setIsPaused(false)}
				className="flex w-max items-center will-change-transform motion-reduce:transform-none"
			>
				{looped.map((item, index) => (
					<div
						key={`${item.name}-${index}`}
						role="listitem"
						aria-hidden={index >= items.length ? true : undefined}
					>
						<PartnerItem {...item} />
					</div>
				))}
			</motion.div>
		</section>
	);
};

export default PartnerMarquee;
