import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const root = process.env.GAMES_TEST_ROOT || path.resolve("..");
const dist = path.resolve("dist/client");
const screenshots = path.resolve("docs/screenshots/seamless-games");
const gamesEnabled = process.env.SQUARE_GAMES_ENABLED === "true";
await fs.mkdir(screenshots, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
let account = { uid: "42", nickname: "甲同学" },
	current = null,
	pending = null,
	codeRequests = 0,
	exchanges = 0;
let failStatus = false;
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
			if (request.method() === "GET" && failStatus)
				return reply({ message: "模拟弱网" }, 503);
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
					data.toString().replace(
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
// 无法确认旧会话时阻止进入；重试必须重新握手，不能只刷新后沿用旧账号。
current = { uid: "41", nickname: "旧账号" };
account = { uid: "44", nickname: "重试同学" };
failStatus = true;
await page.goto("https://games.northward.zone/hockey/?northward=1");
await page.getByRole("alert").waitFor();
assert.equal(await page.getAttribute("body", "data-ready"), null);
assert.equal(codeRequests, 2);
failStatus = false;
await page.getByRole("button", { name: "重新加载" }).click();
await page.waitForFunction(() => document.body.dataset.ready === "true");
assert.equal(await page.getAttribute("body", "data-user"), "44");
assert.equal(codeRequests, 3);
assert.equal(exchanges, 3);
console.log(
	"PASS 浏览器：账号自动进入、换号、游客清理、弱网重试、PKCE/state、片段清除、游戏不获取主 token",
);
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto("https://northward.zone/square/");
await page.waitForTimeout(600);
assert.equal(
	await page.locator('a[href*="games.northward.zone"]').count(),
	gamesEnabled ? 2 : 0,
);
await page
	.getByRole("heading", {
		name: gamesEnabled ? "课间，来点好玩的。" : "广场正在搭建",
	})
	.waitFor();
assert.equal(await page.locator('a[href="/tools/"]').count(), 1);
await page.screenshot({
	path: path.join(
		screenshots,
		gamesEnabled ? "square-desktop.png" : "square-disabled-desktop.png",
	),
	fullPage: true,
});
await page.setViewportSize({ width: 320, height: 850 });
await page.waitForTimeout(100);
assert.equal(
	await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
	false,
);
await page.screenshot({
	path: path.join(
		screenshots,
		gamesEnabled ? "square-mobile.png" : "square-disabled-mobile.png",
	),
	fullPage: true,
});
assert.deepEqual(errors, []);
console.log(
	`PASS 广场：${gamesEnabled ? "公开两个入口" : "默认隐藏游戏入口且保留工具箱"}、桌面与 320px 布局、无脚本错误；截图已保存`,
);
await browser.close();
