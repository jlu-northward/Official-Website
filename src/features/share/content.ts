import { Marked, type Tokens } from "marked";
import { EMOJI_MAP } from "./emojis.ts";
import type { MusicPlatform, MusicRef } from "./types.ts";

export { EMOJI_MAP };

const MAX_CONTENT_LENGTH = 20_000;
const DESCRIPTION_LENGTH = 100;

const MUSIC_PATTERN =
	"\\[(netease_music):(\\d{1,20})\\]|\\[(qq_music):([A-Za-z0-9]{1,32})\\]";
const DROPPED_PATTERN = "\\[poll_tag\\]|\\[essence_tag(?::[^\\]\\n]{0,20})?\\]";
const MUSIC_TOKEN_RE = new RegExp(MUSIC_PATTERN, "g");
const DROPPED_TOKEN_RE = new RegExp(`^(?:${DROPPED_PATTERN})$`);
const DROPPED_TOKEN_GLOBAL_RE = new RegExp(DROPPED_PATTERN, "g");
const ANY_TOKEN_RE = new RegExp(
	`(\\[[^\\[\\]\\n]{1,8}\\])|${MUSIC_PATTERN}|${DROPPED_PATTERN}`,
	"g",
);

const SAFE_LINK_RE = /^(https?:\/\/|mailto:)/i;
const SAFE_IMAGE_RE = /^https?:\/\//i;

export function escapeHtml(value: string | null | undefined): string {
	if (!value) return "";
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export function safeUrl(url: string | null | undefined): string | null {
	if (!url || !url.trim()) return null;
	const trimmed = url.trim();
	return SAFE_IMAGE_RE.test(trimmed) ? trimmed : null;
}

export function musicWebUrl(ref: MusicRef): string {
	return ref.platform === "netease_music"
		? `https://music.163.com/song?id=${ref.id}`
		: `https://y.qq.com/n/ryqq/songDetail/${ref.id}`;
}

export function musicPlatformName(platform: MusicPlatform): string {
	return platform === "netease_music" ? "网易云音乐" : "QQ 音乐";
}

/** 按出现顺序去重，最多取 max 首。 */
export function extractMusicRefs(
	content: string | null | undefined,
	max = 3,
): MusicRef[] {
	if (!content) return [];
	const refs: MusicRef[] = [];
	const seen = new Set<string>();
	const regex = new RegExp(MUSIC_TOKEN_RE.source, "g");
	for (const match of content.matchAll(regex)) {
		if (refs.length >= max) break;
		const platform: MusicPlatform = match[1] ? "netease_music" : "qq_music";
		const id = match[1] ? match[2] : match[4];
		const key = `${platform}:${id}`;
		if (!seen.has(key)) {
			seen.add(key);
			refs.push({ platform, id });
		}
	}
	return refs;
}

function emojiHtml(code: string): string {
	const name = EMOJI_MAP[code];
	return `<img class="share-emoji" src="/emojis/${name}.png" alt="${escapeHtml(code)}">`;
}

function renderTextTokens(text: string, mode: "markdown" | "inline"): string {
	if (!text) return "";
	let out = "";
	let last = 0;
	const regex = new RegExp(ANY_TOKEN_RE.source, "g");
	for (const match of text.matchAll(regex)) {
		const index = match.index ?? 0;
		out += escapeHtml(text.slice(last, index));
		const token = match[0];
		if (Object.prototype.hasOwnProperty.call(EMOJI_MAP, token)) {
			out += emojiHtml(token);
		} else if (match[2] || match[4]) {
			if (mode === "inline") {
				out += match[2] ? "♪ 网易云音乐" : "♪ QQ 音乐";
			}
		} else if (!DROPPED_TOKEN_RE.test(token)) {
			out += escapeHtml(token);
		}
		last = index + token.length;
	}
	out += escapeHtml(text.slice(last));
	return out;
}

function truncateCodePoints(text: string, max: number): string {
	const chars = Array.from(text);
	return chars.length <= max ? text : chars.slice(0, max).join("");
}

function createMarkdownParser(): Marked {
	const instance = new Marked({
		gfm: true,
		breaks: true,
	});
	instance.use({
		renderer: {
			html(token: Tokens.HTML | Tokens.Tag) {
				return escapeHtml(token.raw);
			},
			text(token: Tokens.Text | Tokens.Escape) {
				if ("tokens" in token && token.tokens && token.tokens.length > 0) {
					return this.parser.parseInline(token.tokens);
				}
				return renderTextTokens(token.text, "markdown");
			},
			link(token: Tokens.Link) {
				const inner = this.parser.parseInline(token.tokens);
				const href = (token.href || "").trim();
				if (!SAFE_LINK_RE.test(href)) {
					return inner;
				}
				const titleAttr = token.title
					? ` title="${escapeHtml(token.title)}"`
					: "";
				return `<a href="${escapeHtml(href)}"${titleAttr} target="_blank" rel="nofollow ugc noopener noreferrer">${inner}</a>`;
			},
			image(token: Tokens.Image) {
				const href = (token.href || "").trim();
				const alt = token.text || "";
				if (!SAFE_IMAGE_RE.test(href)) {
					return escapeHtml(alt);
				}
				const titleAttr = token.title
					? ` title="${escapeHtml(token.title)}"`
					: "";
				return `<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}"${titleAttr} loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
			},
			codespan(token: Tokens.Codespan) {
				return `<code>${escapeHtml(token.text)}</code>`;
			},
			code(token: Tokens.Code) {
				const lang = (token.lang || "").trim().split(/\s+/)[0];
				const safeLang = /^[A-Za-z0-9_+-]+$/.test(lang)
					? ` class="language-${lang}"`
					: "";
				return `<pre><code${safeLang}>${escapeHtml(token.text)}</code></pre>\n`;
			},
			paragraph(token: Tokens.Paragraph) {
				const inner = this.parser.parseInline(token.tokens);
				// 如果整段仅包含被移除的音乐/投票/精华标记，去掉空段落。
				const stripped = inner.replace(/<br\s*\/?>/g, "").trim();
				if (!stripped) {
					return "";
				}
				return `<p>${inner}</p>\n`;
			},
		},
	});
	return instance;
}

const markdownParser = createMarkdownParser();

/** 正文 Markdown → 安全 HTML。 */
export function renderMarkdown(content: string | null | undefined): string {
	if (!content || !content.trim()) return "";
	const chars = Array.from(content);
	const limited =
		chars.length <= MAX_CONTENT_LENGTH
			? content
			: `${chars.slice(0, MAX_CONTENT_LENGTH).join("")}…`;
	const html = markdownParser.parse(limited, { async: false });
	return typeof html === "string" ? html.trim() : "";
}

/** 标题、评论、投票选项等纯文本：转义后只替换表情，音乐标记换成「♪ 平台」文字，其余标记去掉。 */
export function renderInline(text: string | null | undefined): string {
	if (!text) return "";
	return renderTextTokens(text, "inline");
}

function extractPlainTextFromTokens(
	tokens: Tokens.Generic[] | undefined,
): string {
	if (!tokens || tokens.length === 0) return "";
	let out = "";
	for (const token of tokens) {
		switch (token.type) {
			case "text":
				if (Array.isArray(token.tokens) && token.tokens.length > 0) {
					out += extractPlainTextFromTokens(token.tokens);
				} else if (typeof token.text === "string") {
					out += token.text;
				}
				break;
			case "escape":
			case "codespan":
				if (typeof token.text === "string") {
					out += token.text;
				}
				break;
			case "code":
			case "html":
				if (typeof token.text === "string") {
					out += `${token.text} `;
				}
				break;
			case "strong":
			case "em":
			case "del":
			case "link":
				if (Array.isArray(token.tokens)) {
					out += extractPlainTextFromTokens(token.tokens);
				}
				break;
			case "br":
			case "space":
				out += " ";
				break;
			case "image":
				if (typeof token.text === "string" && token.text) {
					out += token.text;
				}
				break;
			case "list":
				if (Array.isArray(token.items)) {
					for (const item of token.items) {
						out += `${extractPlainTextFromTokens(item.tokens)} `;
					}
				}
				break;
			case "table":
				if (Array.isArray(token.header)) {
					for (const cell of token.header) {
						out += `${extractPlainTextFromTokens(cell.tokens)} `;
					}
				}
				if (Array.isArray(token.rows)) {
					for (const row of token.rows) {
						for (const cell of row) {
							out += `${extractPlainTextFromTokens(cell.tokens)} `;
						}
					}
				}
				break;
			default:
				if (Array.isArray(token.tokens)) {
					out += `${extractPlainTextFromTokens(token.tokens)} `;
				}
				break;
		}
	}
	return out;
}

/** og:description 用的纯文本：去掉 Markdown 语法和 App 标记，保留表情短代码。 */
export function plainText(content: string | null | undefined): string {
	if (!content || !content.trim()) return "";
	const chars = Array.from(content);
	const limited =
		chars.length <= MAX_CONTENT_LENGTH
			? content
			: `${chars.slice(0, MAX_CONTENT_LENGTH).join("")}…`;
	const tokens = markdownParser.lexer(limited);
	let text = extractPlainTextFromTokens(tokens as Tokens.Generic[]);
	text = text.replace(new RegExp(MUSIC_TOKEN_RE.source, "g"), "[音乐]");
	text = text.replace(new RegExp(DROPPED_TOKEN_GLOBAL_RE.source, "g"), "");
	return text.replace(/\s+/g, " ").trim();
}

export function buildDescription(
	content: string | null | undefined,
	title: string,
): string {
	const plain = plainText(content);
	const collapsed = (plain || title).replace(/\s+/g, " ").trim();
	return truncateCodePoints(collapsed, DESCRIPTION_LENGTH);
}

const SHANGHAI_YEAR_FORMAT = new Intl.DateTimeFormat("en-US", {
	timeZone: "Asia/Shanghai",
	year: "numeric",
});

const LOCAL_ISO_RE =
	/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;

/**
 * 格式化帖子/评论发布时间（Asia/Shanghai）。
 * 今年显示「M月d日 HH:mm」，非今年（如去年）显示「yyyy年M月d日 HH:mm」。
 */
export function formatShareDate(
	value: string | null | undefined,
	now: Date = new Date(),
): string {
	if (!value || !value.trim()) return "";
	const trimmed = value.trim();
	const currentYear = Number(SHANGHAI_YEAR_FORMAT.format(now));

	const localMatch = LOCAL_ISO_RE.exec(trimmed);
	if (localMatch) {
		const year = Number(localMatch[1]);
		const month = Number(localMatch[2]);
		const day = Number(localMatch[3]);
		const hour = localMatch[4];
		const minute = localMatch[5];
		return year === currentYear
			? `${month}月${day}日 ${hour}:${minute}`
			: `${year}年${month}月${day}日 ${hour}:${minute}`;
	}

	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) return "";
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(parsed);
	const part = (type: string) =>
		parts.find((p) => p.type === type)?.value ?? "";
	const year = Number(part("year"));
	const month = Number(part("month"));
	const day = Number(part("day"));
	const hour = part("hour") === "24" ? "00" : part("hour");
	const minute = part("minute");
	return year === currentYear
		? `${month}月${day}日 ${hour}:${minute}`
		: `${year}年${month}月${day}日 ${hour}:${minute}`;
}
