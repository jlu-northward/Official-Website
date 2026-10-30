import { useEffect, useRef, useState, type ComponentType } from "react";
import {
	FiArrowLeft,
	FiArrowUpRight,
	FiBook,
	FiBookOpen,
	FiCheck,
	FiCheckCircle,
	FiCode,
	FiCompass,
	FiCopy,
	FiCreditCard,
	FiExternalLink,
	FiFileText,
	FiGlobe,
	FiGrid,
	FiHeart,
	FiHome,
	FiMapPin,
	FiMoon,
	FiSearch,
	FiShield,
	FiSmartphone,
	FiSun,
	FiTool,
	FiUsers,
	FiWifi,
	FiX,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { appInfo } from "@/config/appInfo";
import {
	toolCategories,
	toolsContent,
	type CampusLink,
	type ToolCategoryId,
} from "./content/tools";

const icons: Record<string, IconType> = {
	campus: FiHome,
	northward: FiCompass,
	compass: FiCompass,
	academic: FiBookOpen,
	file: FiFileText,
	book: FiBook,
	news: FiFileText,
	check: FiCheckCircle,
	services: FiGrid,
	card: FiCreditCard,
	network: FiGlobe,
	wifi: FiWifi,
	users: FiUsers,
	heart: FiHeart,
	globe: FiShield,
	library: FiBookOpen,
	seat: FiMapPin,
	utilities: FiTool,
	phone: FiSmartphone,
	code: FiCode,
};

const totalLinks = toolCategories.reduce(
	(total, category) => total + category.links.length,
	0,
);

function ThemeButton() {
	const [dark, setDark] = useState(false);
	const [embedded, setEmbedded] = useState(false);
	useEffect(() => {
		const sync = () => {
			setDark(document.documentElement.classList.contains("dark"));
			setEmbedded(window.northwardWebsiteTheme?.isEmbedded() ?? false);
		};
		sync();
		window.addEventListener("websiteThemeChanged", sync);
		return () => window.removeEventListener("websiteThemeChanged", sync);
	}, []);
	if (embedded) return null;
	return (
		<Button
			variant="ghost"
			size="icon"
			className="h-10 w-10 rounded-full text-muted-foreground"
			aria-label={dark ? "切换为浅色主题" : "切换为深色主题"}
			onClick={() => {
				window.northwardWebsiteTheme?.setPreference(dark ? "light" : "dark");
			}}
		>
			{dark ? (
				<FiSun className="h-[18px] w-[18px]" />
			) : (
				<FiMoon className="h-[18px] w-[18px]" />
			)}
		</Button>
	);
}

function LinkCard({ link }: { link: CampusLink }) {
	const Icon = icons[link.icon] ?? FiGlobe;
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
		"idle",
	);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	useEffect(() => () => clearTimeout(timer.current), []);
	return (
		<div className="group relative flex min-w-0 items-start bg-card transition-[border-color,box-shadow] sm:rounded-2xl sm:border sm:border-border/80 sm:hover:border-primary/35 sm:hover:shadow-[0_4px_18px_-8px_hsl(var(--primary)/0.15)]">
			<a
				href={link.href}
				target="_blank"
				rel="noopener noreferrer"
				className="flex min-h-[76px] min-w-0 flex-1 items-center gap-3 py-3 pl-3.5 pr-12 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:items-start sm:rounded-2xl sm:p-5 sm:pb-11"
			>
				<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-primary transition-colors group-hover:bg-secondary sm:mt-0.5 sm:h-10 sm:w-10 sm:border sm:border-border/50 sm:bg-background">
					<Icon className="h-[18px] w-[18px]" aria-hidden="true" />
				</span>
				<span className="min-w-0 flex-1 sm:pt-0.5">
					<span className="flex items-start justify-between gap-2 text-[14px] font-semibold leading-6">
						{link.name}
						<FiArrowUpRight className="mt-1 hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary sm:block" />
					</span>
					<span className="mt-0.5 block truncate text-[11px] leading-5 text-muted-foreground sm:mt-1 sm:whitespace-normal sm:text-xs">
						{link.description}
					</span>
					<span className="sr-only">（在新窗口打开）</span>
				</span>
			</a>
			<span className="pointer-events-none absolute bottom-3.5 left-5 hidden max-w-[calc(100%-4rem)] truncate font-mono text-[10px] tracking-[-0.02em] text-muted-foreground/80 sm:block">
				{new URL(link.href).hostname}
			</span>
			<Button
				variant="ghost"
				size="icon"
				className="absolute right-1 top-1/2 h-11 w-11 -translate-y-1/2 rounded-lg text-muted-foreground/60 hover:text-primary sm:bottom-1.5 sm:right-2 sm:top-auto sm:h-8 sm:w-8 sm:translate-y-0"
				aria-label={`复制${link.name}链接`}
				title="复制链接"
				onClick={async () => {
					try {
						await navigator.clipboard.writeText(link.href);
						setCopyStatus("copied");
					} catch {
						setCopyStatus("failed");
					}
					clearTimeout(timer.current);
					timer.current = setTimeout(() => setCopyStatus("idle"), 2500);
				}}
			>
				{copyStatus === "copied" ? (
					<FiCheck className="h-3.5 w-3.5 text-primary" />
				) : (
					<FiCopy className="h-3.5 w-3.5" />
				)}
			</Button>
			<span
				role="status"
				className={cn(
					"absolute bottom-1 left-[62px] bg-card text-[10px] text-primary sm:bottom-3.5 sm:left-5",
					copyStatus === "idle" && "sr-only",
				)}
			>
				{copyStatus === "copied"
					? "链接已复制"
					: copyStatus === "failed"
						? "复制未成功，可长按链接复制"
						: ""}
			</span>
		</div>
	);
}

function CampusNavigation() {
	const [query, setQuery] = useState("");
	const [categoryId, setCategoryId] = useState<ToolCategoryId | "all">("all");
	const normalized = query.trim().toLocaleLowerCase();
	const categories = toolCategories
		.filter((category) => categoryId === "all" || category.id === categoryId)
		.map((category) => ({
			...category,
			links: category.links.filter((link) =>
				`${category.name} ${link.name} ${link.description} ${link.href} ${link.keywords ?? ""}`
					.toLocaleLowerCase()
					.includes(normalized),
			),
		}))
		.filter((category) => category.links.length > 0);
	const resultCount = categories.reduce(
		(count, category) => count + category.links.length,
		0,
	);
	return (
		<div>
			<div className="mb-4 flex flex-col justify-between gap-4 sm:mb-7 sm:flex-row sm:items-center lg:mb-9">
				<div className="hidden sm:block">
					<h2 className="text-xl font-semibold tracking-tight">
						常用入口，触手可及
					</h2>
					<p className="mt-1.5 text-sm text-muted-foreground">
						沿用 App 工具箱里的熟悉入口，在浏览器也能轻松访问。
					</p>
				</div>
				<div role="search" className="relative w-full shrink-0 sm:w-72">
					<FiSearch
						className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						aria-label="搜索校园网站"
						placeholder="搜索网站、服务或关键词"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						className="h-11 rounded-xl border-border bg-card pl-10 pr-10 text-base sm:text-sm"
					/>
					{query && (
						<Button
							size="icon"
							variant="ghost"
							className="absolute right-1 top-1 h-9 w-9 rounded-lg"
							aria-label="清空搜索"
							onClick={() => setQuery("")}
						>
							<FiX className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
			<div className="flex min-w-0 flex-col gap-5 sm:gap-7 lg:flex-row lg:gap-9">
				<aside className="min-w-0 lg:w-40 lg:shrink-0">
					<nav
						aria-label="网站分类"
						className="tools-category-scroll grid grid-cols-3 gap-1.5 sm:-mx-7 sm:flex sm:gap-2 sm:overflow-x-auto sm:px-7 sm:pb-1 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
					>
						{[
							{
								id: "all",
								name: "全部网站",
								icon: "services",
								count: totalLinks,
							},
							...toolCategories.map((category) => ({
								...category,
								count: category.links.length,
							})),
						].map((category) => {
							const Icon = icons[category.icon];
							return (
								<button
									key={category.id}
									type="button"
									aria-pressed={categoryId === category.id}
									onClick={() =>
										setCategoryId(category.id as ToolCategoryId | "all")
									}
									className={cn(
										"flex min-h-11 shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl border border-transparent px-2 py-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:justify-start sm:px-3.5 sm:py-2.5 sm:text-[13px] lg:w-full",
										categoryId === category.id
											? "border-primary/10 bg-secondary text-primary"
											: "text-muted-foreground hover:bg-muted hover:text-foreground",
									)}
								>
									<Icon className="hidden h-4 w-4 sm:block" />
									<span>{category.name}</span>
									<span className="ml-auto hidden pl-2 text-[11px] font-normal opacity-70 sm:block">
										{category.count}
									</span>
								</button>
							);
						})}
						<div className="mt-6 hidden border-t px-3 pt-5 text-xs leading-6 text-muted-foreground lg:block">
							<FiShield className="mb-2 h-4 w-4 text-primary/70" />
							部分校内服务需要
							<br />
							校园网或 WebVPN。
						</div>
					</nav>
				</aside>
				<div className="min-w-0 flex-1 space-y-6 sm:space-y-8 lg:space-y-10">
					{(query || categoryId !== "all") && (
						<p
							role="status"
							className="sr-only text-xs text-muted-foreground sm:not-sr-only"
						>
							找到 {resultCount} 个入口{query && ` · “${query}”`}
						</p>
					)}
					{categories.map((category) => (
						<section
							key={category.id}
							aria-labelledby={`category-${category.id}`}
						>
							<div className="mb-2.5 flex items-end justify-between gap-3 px-1 sm:mb-3.5 sm:px-0">
								<div>
									<h3
										id={`category-${category.id}`}
										className="flex items-center gap-2 text-sm font-semibold"
									>
										{category.name}
										<span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-normal text-muted-foreground">
											{String(category.links.length).padStart(2, "0")}
										</span>
									</h3>
									<p className="mt-1 hidden text-xs text-muted-foreground sm:block">
										{category.description}
									</p>
								</div>
							</div>
							<div className="grid divide-y overflow-hidden rounded-2xl border bg-card sm:grid-cols-2 sm:gap-3 sm:divide-y-0 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent xl:grid-cols-3">
								{category.links.map((link) => (
									<LinkCard key={link.href} link={link} />
								))}
							</div>
						</section>
					))}
					{resultCount === 0 && (
						<div className="rounded-2xl border border-dashed px-5 py-16 text-center">
							<FiSearch className="mx-auto mb-4 h-7 w-7 text-muted-foreground/50" />
							<h3 className="font-medium">暂时没有找到相关入口</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								试试“教务”“图书馆”或网站域名。
							</p>
							<Button
								variant="outline"
								className="mt-5 bg-card"
								onClick={() => {
									setQuery("");
									setCategoryId("all");
								}}
							>
								查看全部网站
							</Button>
						</div>
					)}
					<p className="flex items-start gap-2 pt-1 text-xs leading-5 text-muted-foreground lg:hidden">
						<FiShield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
						部分校内服务需要校园网或 WebVPN。
					</p>
				</div>
			</div>
		</div>
	);
}

export default function ToolsPage() {
	const [tab, setTab] = useState("navigation");
	const [gpaRequested, setGpaRequested] = useState(false);
	const [calculatorModule, setCalculatorModule] = useState<{
		default: ComponentType<{ active: boolean }>;
	} | null>(null);
	const [gpaLoadFailed, setGpaLoadFailed] = useState(false);
	const [gpaLoadAttempt, setGpaLoadAttempt] = useState(0);
	const [classroomRequested, setClassroomRequested] = useState(false);
	const [classroomModule, setClassroomModule] = useState<{
		default: ComponentType<{ active: boolean }>;
	} | null>(null);
	const [classroomLoadFailed, setClassroomLoadFailed] = useState(false);
	const [classroomLoadAttempt, setClassroomLoadAttempt] = useState(0);
	const workspace = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!gpaRequested) return;
		let cancelled = false;
		setGpaLoadFailed(false);
		import("./GpaCalculator")
			.then((module) => {
				if (!cancelled) setCalculatorModule(module);
			})
			.catch(() => {
				if (!cancelled) setGpaLoadFailed(true);
			});
		return () => {
			cancelled = true;
		};
	}, [gpaRequested, gpaLoadAttempt]);
	useEffect(() => {
		if (!classroomRequested) return;
		let cancelled = false;
		setClassroomLoadFailed(false);
		import("./ClassroomTools")
			.then((module) => {
				if (!cancelled) setClassroomModule(module);
			})
			.catch(() => {
				if (!cancelled) setClassroomLoadFailed(true);
			});
		return () => {
			cancelled = true;
		};
	}, [classroomRequested, classroomLoadAttempt]);
	useEffect(() => {
		const sync = () => {
			const hash = window.location.hash;
			const selected =
				hash === "#gpa"
					? "gpa"
					: hash === "#classrooms"
						? "classrooms"
						: "navigation";
			setTab(selected);
			if (selected === "gpa") setGpaRequested(true);
			if (selected === "classrooms") setClassroomRequested(true);
			if (selected !== "navigation")
				requestAnimationFrame(() =>
					workspace.current?.scrollIntoView({ block: "start" }),
				);
		};
		sync();
		window.addEventListener("hashchange", sync);
		return () => window.removeEventListener("hashchange", sync);
	}, []);
	const selectTab = (value: string, scroll = false) => {
		setTab(value);
		if (value === "gpa") setGpaRequested(true);
		if (value === "classrooms") setClassroomRequested(true);
		window.history.replaceState(
			null,
			"",
			`${window.location.pathname}${window.location.search}${value === "navigation" ? "" : `#${value}`}`,
		);
		if (scroll) {
			workspace.current?.scrollIntoView({
				behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
					? "instant"
					: "smooth",
				block: "start",
			});
			requestAnimationFrame(() =>
				document
					.getElementById(`tools-tab-${value}`)
					?.focus({ preventScroll: true }),
			);
		}
	};
	const Calculator = calculatorModule?.default;
	const ClassroomFinder = classroomModule?.default;
	return (
		<div
			className={cn(
				"min-h-svh",
				tab === "gpa" && "pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0",
			)}
		>
			<a
				href="#tools-workspace"
				className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only"
			>
				跳到工具内容
			</a>
			<header className="border-b border-border/65 bg-background/90">
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
						<h1 className="text-base font-semibold sm:hidden">校园工具箱</h1>
						<span className="hidden text-[13px] text-muted-foreground sm:block">
							校园工具箱
						</span>
					</a>
					<div className="flex items-center gap-2 sm:gap-5">
						<a
							href="/"
							className="hidden items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
						>
							<FiArrowLeft />
							返回官网
						</a>
						<ThemeButton />
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-[1248px] px-4 sm:px-7 lg:px-10">
				<section
					className="hidden items-center gap-10 py-12 sm:grid lg:grid-cols-[1fr_0.85fr] lg:gap-20 lg:py-16"
					aria-labelledby="tools-title"
				>
					<div>
						<p className="mb-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-primary sm:mb-4 sm:text-[11px]">
							<span className="h-1.5 w-1.5 rounded-full bg-primary" />
							NORTHWARD · CAMPUS ESSENTIALS
						</p>
						<h1
							id="tools-title"
							className="text-[28px] font-semibold leading-[1.3] tracking-[-0.05em] sm:text-5xl lg:text-[54px]"
						>
							{toolsContent.heroTitle}
							<br className="hidden sm:block" />
							<span className="text-primary">{toolsContent.heroAccent}</span>
						</h1>
						<p className="mt-5 hidden whitespace-pre-line text-sm leading-7 text-muted-foreground sm:block">
							{toolsContent.heroDescription}
						</p>
						<div className="mt-6 hidden items-center gap-5 text-[11px] text-muted-foreground sm:flex">
							<span>
								<strong className="mr-1.5 font-mono text-sm font-medium text-foreground">
									{totalLinks}
								</strong>
								校园入口
							</span>
							<span className="h-3 w-px bg-border" />
							<span>
								<strong className="mr-1.5 font-mono text-sm font-medium text-foreground">
									{toolCategories.length}
								</strong>
								实用分类
							</span>
							<span className="h-3 w-px bg-border" />
							<span>为吉大同学准备</span>
						</div>
					</div>
					<button
						type="button"
						onClick={() => selectTab("gpa", true)}
						className="group relative isolate overflow-hidden rounded-[20px] bg-[#244e43] p-4 text-left text-white outline-none transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:rounded-[24px] sm:p-7 lg:min-h-[255px] lg:p-8"
						aria-label="打开吉大绩点计算工具"
					>
						<div className="tools-dot-grid pointer-events-none absolute inset-0 -z-10 text-white/10" />
						<div className="pointer-events-none absolute -right-9 -top-14 -z-10 h-64 w-64 rounded-full border border-white/[0.07]" />
						<div className="pointer-events-none absolute -right-1 -top-6 -z-10 h-48 w-48 rounded-full border border-white/[0.08]" />
						<span className="hidden sm:block">
							<span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] tracking-wide text-[#d5e8d9]">
								<FiGrid className="h-3 w-3" />
								吉大绩点计算
							</span>
							<span className="mt-4 block text-[23px] font-medium leading-relaxed tracking-tight sm:text-2xl">
								每一分努力，
								<br />
								都值得认真计算。
							</span>
							<span
								className="absolute right-7 top-[64px] -rotate-12 text-right sm:right-9 lg:top-[88px]"
								aria-hidden="true"
							>
								<span className="font-mono text-[46px] font-light leading-none tracking-[-0.06em] text-[#d7ebc2] sm:text-[58px]">
									4.0
								</span>
								<span className="mt-2 block text-[10px] tracking-[0.15em] text-white/50">
									满绩目标
								</span>
							</span>
							<span className="mt-5 flex items-center justify-between text-[11px] text-white/65 sm:mt-6">
								<span>学分加权 · 实时计算 · 本地保存</span>
								<span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white transition-colors group-hover:bg-white/10">
									<FiArrowUpRight className="h-4 w-4" />
								</span>
							</span>
						</span>
					</button>
				</section>
				<div
					ref={workspace}
					id="tools-workspace"
					tabIndex={-1}
					className="scroll-mt-0 pb-10 outline-none sm:scroll-mt-6 sm:pb-20"
				>
					<Tabs value={tab} onValueChange={(value) => selectTab(value)}>
						<div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between gap-3 bg-background px-4 py-3 sm:static sm:mx-0 sm:mb-9 sm:border-b sm:bg-transparent sm:px-0 sm:pb-5 sm:pt-0">
							<TabsList
								className="grid h-12 w-full grid-cols-3 gap-1 rounded-xl border border-border/60 bg-muted/70 p-1 sm:inline-flex sm:w-auto"
								aria-label="工具类型"
							>
								<TabsTrigger
									id="tools-tab-navigation"
									value="navigation"
									className="h-10 gap-1.5 rounded-lg px-2 text-xs data-[state=active]:bg-card data-[state=active]:text-foreground sm:gap-2 sm:px-5 sm:text-[13px]"
								>
									<FiCompass className="h-4 w-4" />
									校园导航
									<span className="ml-1 hidden rounded bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
										{totalLinks}
									</span>
								</TabsTrigger>
								<TabsTrigger
									id="tools-tab-gpa"
									value="gpa"
									className="h-10 gap-1.5 rounded-lg px-2 text-xs data-[state=active]:bg-card data-[state=active]:text-foreground sm:gap-2 sm:px-5 sm:text-[13px]"
								>
									<FiGrid className="h-4 w-4" />
									绩点计算
								</TabsTrigger>
								<TabsTrigger
									id="tools-tab-classrooms"
									value="classrooms"
									className="h-10 gap-1.5 rounded-lg px-2 text-xs data-[state=active]:bg-card data-[state=active]:text-foreground sm:gap-2 sm:px-5 sm:text-[13px]"
								>
									<FiMapPin className="h-4 w-4" />
									教室查询
								</TabsTrigger>
							</TabsList>
							<span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
								<FiExternalLink className="h-3 w-3" />
								导航链接在新窗口打开
							</span>
						</div>
						<TabsContent
							value="navigation"
							aria-labelledby="tools-tab-navigation"
							forceMount
							className="mt-0 outline-none data-[state=inactive]:hidden"
						>
							<CampusNavigation />
						</TabsContent>
						<TabsContent
							value="gpa"
							aria-labelledby="tools-tab-gpa"
							forceMount
							className="mt-0 outline-none data-[state=inactive]:hidden"
						>
							{Calculator ? (
								<Calculator active={tab === "gpa"} />
							) : gpaRequested ? (
								<div
									role="status"
									className="rounded-2xl border bg-card px-5 py-12 text-center text-sm text-muted-foreground"
								>
									{gpaLoadFailed ? (
										<>
											<p>{toolsContent.calculatorLoadError}</p>
											<Button
												variant="outline"
												className="mt-4"
												onClick={() =>
													setGpaLoadAttempt((attempt) => attempt + 1)
												}
											>
												重新加载
											</Button>
										</>
									) : (
										toolsContent.calculatorLoading
									)}
								</div>
							) : null}
						</TabsContent>
						<TabsContent
							value="classrooms"
							aria-labelledby="tools-tab-classrooms"
							forceMount
							className="mt-0 outline-none data-[state=inactive]:hidden"
						>
							{ClassroomFinder ? (
								<ClassroomFinder active={tab === "classrooms"} />
							) : classroomRequested ? (
								<div
									role="status"
									className="rounded-2xl border bg-card px-5 py-12 text-center text-sm text-muted-foreground"
								>
									{classroomLoadFailed ? (
										<>
											<p>{toolsContent.classroomLoadError}</p>
											<Button
												variant="outline"
												className="mt-4"
												onClick={() =>
													setClassroomLoadAttempt((attempt) => attempt + 1)
												}
											>
												重新加载
											</Button>
										</>
									) : (
										toolsContent.classroomLoading
									)}
								</div>
							) : null}
						</TabsContent>
					</Tabs>
				</div>
			</main>
			<footer className="border-t border-border/70">
				<div className="mx-auto flex max-w-[1248px] flex-col gap-4 px-4 py-7 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-10">
					<div className="flex items-center gap-2">
						<FiCompass className="h-3.5 w-3.5 text-primary" />
						<span>向北 · 让校园生活更顺手</span>
					</div>
					<div className="flex flex-wrap items-center gap-x-5 gap-y-3">
						<a href="/" className="hover:text-foreground">
							关于向北
						</a>
						<a href="/privacy" className="hover:text-foreground">
							隐私政策
						</a>
						<a
							href={appInfo.icp.url}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-foreground"
						>
							{appInfo.icp.number}
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
