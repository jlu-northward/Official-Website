import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(
	new URL("../src/lib/theme-script.js", import.meta.url),
	"utf8",
);

function page({ saved = null, app, dark = false, blocked = false } = {}) {
	const window = new EventTarget();
	const media = new EventTarget();
	media.matches = dark;
	const classes = new Set(["react-page-root"]);
	const root = {
		classList: {
			toggle: (name, enabled) =>
				enabled ? classes.add(name) : classes.delete(name),
		},
		style: {},
	};
	window.matchMedia = () => media;
	if (app) window.northwardTheme = { mode: app };
	const storage = new Map(saved ? [["theme", saved]] : []);
	runInNewContext(source, {
		window,
		document: { documentElement: root },
		Event,
		localStorage: {
			getItem: (key) => {
				if (blocked) throw new Error("blocked");
				return storage.get(key);
			},
			setItem: (key, value) => {
				if (blocked) throw new Error("blocked");
				storage.set(key, value);
			},
		},
	});
	return {
		window,
		media,
		root,
		classes,
		storage,
		controller: window.northwardWebsiteTheme,
		appTheme(mode) {
			window.northwardTheme = { mode };
			window.dispatchEvent(new Event("northwardThemeChanged"));
		},
	};
}

test("App overrides saved and system themes on startup and live changes", () => {
	const p = page({ saved: "light", app: "dark" });
	assert(p.classes.has("dark"));
	assert(!p.classes.has("light"));
	assert(p.classes.has("react-page-root"));
	assert.equal(p.root.style.colorScheme, "dark");
	assert.equal(p.controller.isEmbedded(), true);
	p.controller.setPreference("light");
	assert(p.classes.has("dark"));
	let updates = 0;
	p.window.addEventListener("websiteThemeChanged", () => updates++);
	p.appTheme("light");
	assert(p.classes.has("light"));
	assert(!p.classes.has("dark"));
	assert.equal(p.root.style.colorScheme, "light");
	assert.equal(updates, 1);
	assert.equal(p.storage.get("theme"), "light");
	p.media.matches = true;
	p.media.dispatchEvent(new Event("change"));
	assert(p.classes.has("light"));
});

test("App arriving after website startup takes control without overwriting browser preference", () => {
	const p = page({ saved: "dark" });
	p.appTheme("light");
	assert(p.classes.has("light"));
	assert.equal(p.controller.getPreference(), "light");
	assert.equal(p.storage.get("theme"), "dark");
});

test("Browser preference and system changes still work independently", () => {
	const p = page();
	assert.equal(p.controller.isEmbedded(), false);
	p.media.matches = true;
	p.media.dispatchEvent(new Event("change"));
	assert(p.classes.has("dark"));
	p.controller.setPreference("light");
	assert(p.classes.has("light"));
	assert.equal(p.storage.get("theme"), "light");
	p.media.dispatchEvent(new Event("change"));
	assert(p.classes.has("light"));
	p.controller.setPreference("system");
	assert(p.classes.has("dark"));
});

test("Unavailable storage does not break theme startup or switching", () => {
	const p = page({ blocked: true, dark: true });
	assert(p.classes.has("dark"));
	p.controller.setPreference("light");
	assert(p.classes.has("light"));
	assert(page({ blocked: true, app: "dark" }).classes.has("dark"));
});
