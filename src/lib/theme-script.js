// Runs inline in <head>, before the first paint. No polling or DOM observers.
(() => {
	if (window.northwardWebsiteTheme) return;
	const media = window.matchMedia("(prefers-color-scheme: dark)");
	let preference = "system";
	try {
		const saved = localStorage.getItem("theme");
		if (saved === "light" || saved === "dark") preference = saved;
	} catch {}

	const appMode = () => {
		const mode = window.northwardTheme?.mode;
		return mode === "light" || mode === "dark" ? mode : null;
	};
	const apply = () => {
		const mode =
			appMode() ||
			(preference === "system"
				? media.matches
					? "dark"
					: "light"
				: preference);
		const root = document.documentElement;
		root.classList.toggle("dark", mode === "dark");
		root.classList.toggle("light", mode === "light");
		root.style.colorScheme = mode;
		window.dispatchEvent(new Event("websiteThemeChanged"));
	};

	window.northwardWebsiteTheme = {
		getPreference: () => appMode() || preference,
		isEmbedded: () => appMode() !== null,
		setPreference: (value) => {
			if (appMode() || !["light", "dark", "system"].includes(value)) return;
			preference = value;
			try {
				localStorage.setItem("theme", value);
			} catch {}
			apply();
		},
	};
	window.addEventListener("northwardThemeChanged", apply);
	media.addEventListener("change", () => {
		if (!appMode() && preference === "system") apply();
	});
	apply();
})();
