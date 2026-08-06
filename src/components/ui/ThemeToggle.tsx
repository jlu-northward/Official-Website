import { motion } from "framer-motion";
import { memo, useCallback, useEffect, useState } from "react";
import { FiMonitor, FiMoon, FiSun } from "react-icons/fi";

type Theme = "light" | "dark" | "system";

const themes: { key: Theme; icon: typeof FiSun; label: string }[] = [
	{ key: "light", icon: FiSun, label: "浅色" },
	{ key: "dark", icon: FiMoon, label: "深色" },
	{ key: "system", icon: FiMonitor, label: "跟随系统" },
];

const ThemeToggle = () => {
	const [theme, setTheme] = useState<Theme>("system");
	const [mounted, setMounted] = useState(false);

	const applyTheme = useCallback((newTheme: Theme) => {
		const root = document.documentElement;

		// Temporarily disable transitions to prevent flash
		root.style.transition = "none";

		root.classList.remove("light", "dark");

		if (newTheme === "system") {
			const prefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;
			root.classList.add(prefersDark ? "dark" : "light");
		} else {
			root.classList.add(newTheme);
		}

		// Re-enable transitions after a small delay
		setTimeout(() => {
			root.style.transition = "";
		}, 50);
	}, []);

	useEffect(() => {
		setMounted(true);
		const savedTheme = (localStorage.getItem("theme") as Theme) || "system";
		setTheme(savedTheme);
		applyTheme(savedTheme);
	}, [applyTheme]);

	useEffect(() => {
		if (!mounted || theme !== "system") return;
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => theme === "system" && applyTheme("system");
		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [theme, applyTheme, mounted]);

	if (!mounted)
		return (
			<div className="liquid-glass liquid-glass--thin bg-white/42 flex items-center rounded-full border border-black/[0.06] p-1 dark:border-white/10 dark:bg-white/[0.035]">
				<div className="h-7 w-7" />
			</div>
		);

	return (
		<div className="liquid-glass liquid-glass--thin bg-white/42 flex items-center rounded-full border border-black/[0.06] p-1 dark:border-white/10 dark:bg-white/[0.035]">
			{themes.map(({ key, icon: Icon, label }) => (
				<motion.button
					key={key}
					onClick={() => {
						setTheme(key);
						localStorage.setItem("theme", key);
						applyTheme(key);
					}}
					className={`relative cursor-pointer rounded-full p-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-500/40 ${
						theme === key
							? "text-neutral-950 dark:text-white"
							: "text-neutral-500 dark:text-white/55"
					}`}
					whileTap={{ scale: 0.96 }}
					title={label}
					aria-label={`切换为${label}主题`}
				>
					{theme === key && (
						<motion.div
							layoutId="activeTheme"
							className="absolute inset-0 rounded-full border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/10"
							transition={{ type: "spring", bounce: 0, duration: 0.35 }}
						/>
					)}
					<Icon className="relative z-10 h-4 w-4" />
				</motion.button>
			))}
		</div>
	);
};

export default memo(ThemeToggle);
