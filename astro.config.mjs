import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://northward.zone",
	adapter: vercel(),
	integrations: [
		tailwind(),
		react(),
		sitemap({
			filter: (page) =>
				!/^\/(games(?:\/|$)|content(?:\/|$)|api(?:\/|$)|post(?:\/|$)|download-(?:android|ios)(?:\/|$))/.test(
					new URL(page).pathname,
				),
		}),
	],
});
