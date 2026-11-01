import { FiArrowLeft, FiCompass } from "react-icons/fi";
import ThemeButton from "@/components/ui/ThemeButton";
import { squareContent } from "./content/square";

export default function SquarePage() {
	return (
		<div className="flex min-h-svh flex-col">
			{/* The App tab supplies its own chrome, so the web header stays out of it. */}
			<header className="border-b border-border/65 bg-background/90 [html[data-embedded]_&]:hidden">
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
			<main className="flex flex-1 items-center justify-center px-6 py-20">
				<section
					className="max-w-md text-center"
					aria-labelledby="square-title"
				>
					<span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-card text-primary">
						<FiCompass className="h-6 w-6" aria-hidden="true" />
					</span>
					<p className="mt-6 font-mono text-[10px] tracking-[0.18em] text-primary sm:text-[11px]">
						{squareContent.eyebrow}
					</p>
					<h1
						id="square-title"
						className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl"
					>
						{squareContent.heading}
					</h1>
					<span className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
						<span className="h-1.5 w-1.5 rounded-full bg-primary" />
						{squareContent.status}
					</span>
					<p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">
						{squareContent.body}
					</p>
				</section>
			</main>
		</div>
	);
}
