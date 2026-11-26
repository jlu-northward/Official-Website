/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/pages/posts/**/*.astro",
		"./src/features/share/**/*.{astro,ts}",
	],
	theme: {
		extend: {
			colors: {
				border: "hsl(var(--border))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				brand: {
					start: "hsl(var(--brand-start))",
					end: "hsl(var(--brand-end))",
					foreground: "hsl(var(--brand-foreground))",
				},
			},
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
		},
	},
	plugins: [],
};
