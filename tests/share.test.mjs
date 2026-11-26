import assert from "node:assert/strict";
import test from "node:test";
import {
	buildDescription,
	extractMusicRefs,
	formatShareDate,
	plainText,
	renderInline,
	renderMarkdown,
	safeUrl,
} from "../src/features/share/content.ts";
import {
	createMusicLookup,
	parseNetease,
	parseQq,
} from "../src/features/share/music.ts";

test("renderMarkdown renders GFM, emojis, drops tokens, and escapes raw HTML", () => {
	const md = [
		"**加粗**[乐] ~~删除~~ <script>alert(1)</script>",
		"",
		"[netease_music:1824020871]",
		"",
		"[poll_tag][essence_tag:精华]",
		"",
		"[安全链接](https://northward.zone) [危险链接](javascript:alert(1))",
		"",
		"![安全图](https://cdn.example/a.jpg) ![危险图](data:image/png;base64,AAA)",
	].join("\n");

	const html = renderMarkdown(md);
	assert.match(html, /<strong>加粗<\/strong>/);
	assert.match(html, /<del>删除<\/del>/);
	assert.match(
		html,
		/<img class="share-emoji" src="\/emojis\/emoji_happy\.png" alt="\[乐\]">/,
	);
	assert.ok(!html.includes("<script>alert(1)</script>"));
	assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
	assert.ok(!html.includes("netease_music"));
	assert.ok(!html.includes("poll_tag"));
	assert.ok(!html.includes("essence_tag"));
	assert.ok(
		html.includes(
			'href="https://northward.zone" target="_blank" rel="nofollow ugc noopener noreferrer"',
		),
	);
	assert.ok(!html.includes("javascript:alert"));
	assert.ok(html.includes("危险链接"));
	assert.ok(html.includes('src="https://cdn.example/a.jpg"'));
	assert.ok(!html.includes("data:image/png"));
	assert.ok(html.includes("危险图"));
});

test("renderInline handles emojis, music labels, dropped tokens, and escaping", () => {
	const html = renderInline(
		"今天[乐] 听[netease_music:123]和[qq_music:abc][essence_tag:精华]<b>x</b>",
	);
	assert.equal(
		html,
		'今天<img class="share-emoji" src="/emojis/emoji_happy.png" alt="[乐]"> 听♪ 网易云音乐和♪ QQ 音乐&lt;b&gt;x&lt;/b&gt;',
	);
});

test("plainText and buildDescription strip markdown and truncate by code points", () => {
	const text = plainText(
		"**加粗**[乐]\n\n[netease_music:1824020871]\n\n> 引用\n\n`code`",
	);
	assert.equal(text, "加粗[乐] [音乐] 引用 code");

	const emojiLong = "😀".repeat(150);
	assert.equal(buildDescription(emojiLong, "标题"), "😀".repeat(100));
	assert.equal(buildDescription("", "兜底标题"), "兜底标题");
});

test("extractMusicRefs deduplicates in order and respects limit", () => {
	const refs = extractMusicRefs(
		"[netease_music:1] [qq_music:a1] [netease_music:1] [netease_music:2] [qq_music:b2]",
		3,
	);
	assert.deepEqual(refs, [
		{ platform: "netease_music", id: "1" },
		{ platform: "qq_music", id: "a1" },
		{ platform: "netease_music", id: "2" },
	]);
});

test("formatShareDate shows year only for non-current years in Asia/Shanghai", () => {
	const now2026 = new Date("2026-11-26T12:00:00Z");
	assert.equal(
		formatShareDate("2026-11-25T12:06:00", now2026),
		"11月25日 12:06",
	);
	assert.equal(
		formatShareDate("2025-12-31T23:59:00", now2026),
		"2025年12月31日 23:59",
	);
	assert.equal(
		formatShareDate("2024-03-05T09:08:00", now2026),
		"2024年3月5日 09:08",
	);
	assert.equal(formatShareDate(null, now2026), "");
});

test("safeUrl allows only http(s)", () => {
	assert.equal(
		safeUrl("https://northward.zone/a.jpg"),
		"https://northward.zone/a.jpg",
	);
	assert.equal(safeUrl("http://example.com/a.jpg"), "http://example.com/a.jpg");
	assert.equal(safeUrl("javascript:alert(1)"), null);
	assert.equal(safeUrl("data:image/png;base64,AAA"), null);
	assert.equal(safeUrl(""), null);
});

test("music lookup parses Netease & QQ responses and caches results", async () => {
	assert.deepEqual(
		parseNetease({
			songs: [
				{
					name: "One Last Kiss",
					artists: [{ name: "宇多田ヒカル" }],
					album: { picUrl: "http://p1.music.126.net/x.jpg" },
				},
			],
		}),
		{
			name: "One Last Kiss",
			artists: "宇多田ヒカル",
			coverUrl: "https://p1.music.126.net/x.jpg?param=200y200",
		},
	);

	assert.deepEqual(
		parseQq({
			req_1: {
				data: {
					track_info: {
						name: "晴天",
						singer: [{ name: "周杰伦" }],
						album: { mid: "000MkMni19ClKG" },
					},
				},
			},
		}),
		{
			name: "晴天",
			artists: "周杰伦",
			coverUrl:
				"https://y.gtimg.cn/music/photo_new/T002R300x300M000000MkMni19ClKG.jpg",
		},
	);

	let calls = 0;
	const lookup = createMusicLookup({
		fetchImpl: async (url) => {
			calls += 1;
			if (String(url).includes("music.163.com")) {
				return new Response(
					JSON.stringify({
						songs: [
							{
								name: "One Last Kiss",
								artists: [{ name: "宇多田ヒカル" }],
								album: { picUrl: "https://p1.music.126.net/x.jpg" },
							},
						],
					}),
					{ status: 200 },
				);
			}
			return new Response("", { status: 500 });
		},
	});

	const refs = [
		{ platform: "netease_music", id: "1824020871" },
		{ platform: "qq_music", id: "003aAYrm3GE0Ac" },
	];
	const first = await lookup(refs);
	assert.equal(first[0].track?.name, "One Last Kiss");
	assert.equal(first[1].track, null);
	assert.equal(calls, 2);

	// 第二次命中缓存，不再发起请求
	const second = await lookup(refs);
	assert.equal(second[0].track?.name, "One Last Kiss");
	assert.equal(second[1].track, null);
	assert.equal(calls, 2);
});
