type WebsiteThemePreference = "light" | "dark" | "system";

interface Window {
	northwardTheme?: { readonly mode: "light" | "dark" };
	northwardWebsiteTheme?: {
		getPreference(): WebsiteThemePreference;
		isEmbedded(): boolean;
		setPreference(value: WebsiteThemePreference): void;
	};
}
