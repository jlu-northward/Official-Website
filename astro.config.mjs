import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://northward.zone",
	adapter: vercel(),
	integrations: [tailwind(), react()],
});
