import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://northward.zone",
	adapter: node({ mode: "standalone" }),
	integrations: [
		tailwind(),
		react(),
		sitemap({
			filter: (page) =>
				!/^\/(content(?:\/|$)|api(?:\/|$)|posts?(?:\/|$)|healthz(?:\/|$)|download-(?:android|ios)(?:\/|$))/.test(
					new URL(page).pathname,
				),
		}),
	],
});
