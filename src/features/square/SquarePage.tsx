import {
	FiArrowLeft,
	FiArrowUpRight,
	FiCompass,
	FiGrid,
	FiMapPin,
	FiTool,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import ThemeButton from "@/components/ui/ThemeButton";
import { cn } from "@/lib/utils";
import { squareContent } from "./content/square";

const featureIcons: Record<string, IconType> = {
	compass: FiCompass,
	grid: FiGrid,
	pin: FiMapPin,
};

const enter =
	"animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-backwards duration-500";

export default function SquarePage() {
	return (
		<div className="flex min-h-svh flex-col">
			<header className="border-b border-border/65 bg-background/90 embedded:hidden">
				<div className="mx-auto flex h-16 max-w-[1248px] items-center justify-between gap-3 px-4 sm:h-[76px] sm:px-7 lg:px-10">
					<a
						href="/"
						className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
						aria-label="向北官网首页"
					>
						<img
							src="/brand/logo.png"
							alt=""
							width="34"
							height="34"
							className="h-8 w-8 rounded-[10px] sm:h-[34px] sm:w-[34px]"
						/>
						<span className="hidden text-lg font-semibold tracking-tight sm:block">
							向北
						</span>
						<span
							className="mx-1 hidden text-border sm:block"
							aria-hidden="true"
						>
							/
						</span>
						<span className="text-base font-semibold sm:text-[13px] sm:font-normal sm:text-muted-foreground">
							{squareContent.name}
						</span>
					</a>
					<div className="flex items-center gap-2 sm:gap-5">
						<a
							href="/"
							className="hidden items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
						>
							<FiArrowLeft />
							{squareContent.backHome}
						</a>
						<ThemeButton />
					</div>
				</div>
			</header>
			<main className="mx-auto w-full max-w-xl flex-1 px-5 pb-16 pt-8 sm:pt-16">
				<section
					className={cn("relative isolate", enter)}
					aria-labelledby="square-title"
				>
					<div
						className="pointer-events-none absolute -top-28 left-1/2 -z-10 hidden h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.12),transparent)] dark:block"
						aria-hidden="true"
					/>
					<div className="flex items-center justify-between gap-3">
						<p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-primary sm:text-[11px]">
							<span className="h-1.5 w-1.5 rounded-full bg-primary" />
							{squareContent.eyebrow}
						</p>
						<span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-secondary/70 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
							<span className="relative flex h-1.5 w-1.5">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50 motion-reduce:hidden" />
								<span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
							</span>
							{squareContent.status}
						</span>
					</div>
					<h1
						id="square-title"
						className="mt-5 text-[28px] font-semibold leading-tight tracking-[-0.04em] sm:text-4xl"
					>
						{squareContent.heading}
					</h1>
					<p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
						{squareContent.body}
					</p>
				</section>

				<a
					href={squareContent.toolbox.href}
					className={cn(
						"group relative isolate mt-8 block overflow-hidden rounded-[24px] bg-[#244e43] p-6 text-white outline-none transition-[box-shadow,transform] [animation-delay:100ms] hover:shadow-[0_18px_40px_-20px_rgba(36,78,67,0.75)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background active:scale-[0.99] sm:p-7",
						enter,
					)}
				>
					<div className="tools-dot-grid pointer-events-none absolute inset-0 -z-10 text-white/10" />
					<div className="pointer-events-none absolute -right-14 -top-20 -z-10 h-64 w-64 rounded-full border border-white/[0.07]" />
					<div className="pointer-events-none absolute -right-3 -top-8 -z-10 h-44 w-44 rounded-full border border-white/[0.08]" />
					<div className="pointer-events-none absolute -bottom-24 -left-16 -z-10 h-56 w-56 rounded-full bg-[#3b7a68]/40 blur-3xl" />
					<span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] tracking-wide text-[#d5e8d9]">
						<FiTool className="h-3 w-3" aria-hidden="true" />
						{squareContent.toolbox.name}
					</span>
					<span className="mt-4 block whitespace-pre-line text-[24px] font-medium leading-snug tracking-tight sm:text-[28px]">
						{squareContent.toolbox.tagline}
					</span>
					<span className="mt-7 flex items-end justify-between gap-4">
						<span className="flex flex-wrap gap-1.5">
							{squareContent.toolbox.features.map((feature) => {
								const Icon = featureIcons[feature.icon] ?? FiGrid;
								return (
									<span
										key={feature.name}
										className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/85"
									>
										<Icon
											className="h-3 w-3 text-[#d7ebc2]"
											aria-hidden="true"
										/>
										{feature.name}
									</span>
								);
							})}
						</span>
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 transition-colors group-hover:bg-white/10">
							<FiArrowUpRight className="h-4 w-4" aria-hidden="true" />
						</span>
					</span>
				</a>

				{/* Faded placeholder rows hint at what the square will hold later. */}
				<div
					className={cn(
						"mt-4 space-y-3 [animation-delay:200ms] [mask-image:linear-gradient(to_bottom,black,transparent)]",
						enter,
					)}
					aria-hidden="true"
				>
					{[0, 1].map((row) => (
						<div
							key={row}
							className="flex items-center gap-3.5 rounded-2xl border border-dashed border-border bg-card/50 p-4"
						>
							<span className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
							<span className="flex-1 space-y-2">
								<span className="block h-2.5 w-24 rounded-full bg-muted" />
								<span className="block h-2 w-40 max-w-full rounded-full bg-muted/70" />
							</span>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
