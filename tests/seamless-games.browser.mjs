import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const root = process.env.GAMES_TEST_ROOT || path.resolve("..");
const dist = path.resolve("dist/client");
const screenshots = path.resolve("docs/screenshots/seamless-games");
await fs.mkdir(screenshots, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
let account = { uid: "42", nickname: "甲同学" },
	current = null,
	pending = null,
	codeRequests = 0,
	exchanges = 0;
const mime = (p) =>
	p.endsWith(".js") || p.endsWith(".mjs")
		? "application/javascript"
		: p.endsWith(".css")
			? "text/css"
			: p.endsWith(".svg")
				? "image/svg+xml"
				: p.endsWith(".png")
					? "image/png"
					: p.endsWith(".woff2")
						? "font/woff2"
						: "text/html";
await context.route("**/*", async (route) => {
	const request = route.request(),
		url = new URL(request.url());
	const reply = (body, status = 200, headers = {}) =>
		route.fulfill({
			status,
			contentType: "application/json",
			headers,
			body: JSON.stringify(body),
		});
	if (url.host === "games.northward.zone") {
		assert.equal(
			request.headers().authorization,
			undefined,
			"主 token 不得交给游戏",
		);
		if (url.pathname === "/hockey/northward/session") {
			if (request.method() === "GET")
				return reply({ enabled: true, user: current });
			if (request.method() === "DELETE") {
				current = null;
				return reply({ user: null }, 200, {
					"Set-Cookie":
						"nw_hockey=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0",
				});
			}
			const body = request.postDataJSON();
			assert.equal(body.state, pending.state);
			assert.equal(body.code, "c".repeat(43));
			assert.equal(
				createHash("sha256").update(body.codeVerifier).digest("base64url"),
				pending.challenge,
			);
			exchanges++;
			current = account;
			return reply({ user: current }, 200, {
				"Set-Cookie":
					"nw_hockey=" +
					"f".repeat(64) +
						"; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=28800",
			});
		}
		if (url.pathname === "/hockey/northward-login.mjs")
			return route.fulfill({
				contentType: "application/javascript",
				body: await fs.readFile(
					path.join(root, "sling-hockey/client/northward-login.mjs"),
					"utf8",
				),
			});
		return route.fulfill({
			contentType: "text/html",
			body: `<!doctype html><html><body><script type="module">import {prepareNorthward} from './northward-login.mjs';const user=await prepareNorthward('hockey','/hockey/northward/session');document.body.dataset.user=user?.uid||'guest';document.body.dataset.ready='true';document.body.textContent=user?.nickname||'游客';</script></body></html>`,
		});
	}
	if (url.host === "northward.zone") {
		if (url.pathname === "/games/session/code") {
			assert.equal(request.headers().authorization, "Bearer fixture-access");
			const body = request.postDataJSON();
			assert.equal(body.game, "hockey");
			pending = { state: body.state, challenge: body.codeChallenge };
			codeRequests++;
			return reply({
				success: true,
				data: { code: "c".repeat(43), expiresIn: 60 },
			});
		}
		let relative = url.pathname.replace(/^\//, "");
		let file = path.join(dist, relative);
		if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
		try {
			let data = await fs.readFile(file);
			if (url.pathname === "/games/launch/")
				data = Buffer.from(
					data
						.toString()
						.replace(
							"<head>",
							"<head><script>window.northwardAuth=" +
								JSON.stringify({
									accessToken: account ? "fixture-access" : null,
								}) +
								"</script>",
						),
				);
			return route.fulfill({ contentType: mime(file), body: data });
		} catch {
			return route.fulfill({ status: 404, body: "not found" });
		}
	}
	return route.fulfill({ status: 404, body: "blocked external resource" });
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
for (const expected of [
	{ uid: "42", nickname: "甲同学" },
	{ uid: "43", nickname: "乙同学" },
	null,
]) {
	account = expected;
	await page.goto("https://games.northward.zone/hockey/?northward=1");
	await page.waitForFunction(() => document.body.dataset.ready === "true");
	assert.equal(
		await page.getAttribute("body", "data-user"),
		expected?.uid || "guest",
	);
	assert.equal(await page.evaluate(() => location.hash), "");
	assert.equal(
		await page.evaluate(() => sessionStorage.getItem("northward-login:hockey")),
		null,
	);
	assert.equal(await page.evaluate(() => window.northwardAuth), undefined);
}
assert.equal(codeRequests, 2);
assert.equal(exchanges, 2);
assert.equal(current, null);
console.log(
	"PASS 浏览器：账号自动进入、换号、游客清理、PKCE/state、片段清除、游戏不获取主 token",
);
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto("https://northward.zone/square/");
await page.waitForTimeout(600);
assert.equal(await page.locator('a[href*="games.northward.zone"]').count(), 2);
await page.screenshot({
	path: path.join(screenshots, "square-desktop.png"),
	fullPage: true,
});
await page.setViewportSize({ width: 320, height: 850 });
await page.waitForTimeout(100);
assert.equal(
	await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
	false,
);
await page.screenshot({
	path: path.join(screenshots, "square-mobile.png"),
	fullPage: true,
});
assert.deepEqual(errors, []);
console.log("PASS 广场：两个入口、桌面与 320px 布局、无脚本错误；截图已保存");
await browser.close();
