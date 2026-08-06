/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	darkMode: ["selector", '[class~="dark"]'],
	theme: {
		extend: {
			fontFamily: {
				sans: [
					"-apple-system",
					"BlinkMacSystemFont",
					'"SF Pro Text"',
					'"SF Pro Display"',
					'"PingFang SC"',
					'"Hiragino Sans GB"',
					'"Microsoft YaHei"',
					'"Helvetica Neue"',
					"Arial",
					"sans-serif",
				],
			},
			screens: {
				light: { raw: "(prefers-color-scheme: light)" },
			},
		},
	},
	plugins: [
		require("@tailwindcss/typography"),
		require("tailwind-scrollbar-hide"),
		({ addVariant }) => {
			addVariant("light", ".light &");
		},
	],
};
