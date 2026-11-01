import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { Button } from "@/components/ui/button";

export default function ThemeButton() {
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
