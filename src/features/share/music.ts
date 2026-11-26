import type { MusicCard, MusicRef, MusicTrack } from "./types.ts";

const TOTAL_BUDGET_MS = 2500;
const REQUEST_TIMEOUT_MS = 2000;
const MAX_RESPONSE_BYTES = 256 * 1024;
const MAX_TEXT = 80;
const MAX_CACHE_SIZE = 2000;
const FOUND_TTL_MS = 12 * 60 * 60 * 1000;
const MISSING_TTL_MS = 5 * 60 * 1000;
const USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

class TtlCache<T> {
	private readonly store = new Map<string, CacheEntry<T>>();

	get(key: string, now: number): T | undefined {
		const entry = this.store.get(key);
		if (!entry) return undefined;
		if (entry.expiresAt <= now) {
			this.store.delete(key);
			return undefined;
		}
		return entry.value;
	}

	set(key: string, value: T, ttlMs: number, now: number): void {
		if (this.store.size >= MAX_CACHE_SIZE) {
			const oldest = this.store.keys().next().value;
			if (oldest !== undefined) this.store.delete(oldest);
		}
		this.store.set(key, { value, expiresAt: now + ttlMs });
	}
}

export interface MusicLookupOptions {
	fetchImpl?: typeof fetch;
	neteaseBase?: string;
	qqBase?: string;
	now?: () => number;
	totalBudgetMs?: number;
	requestTimeoutMs?: number;
}

function refKey(ref: MusicRef): string {
	return `${ref.platform}:${ref.id}`;
}

function trimText(value: unknown): string {
	if (typeof value !== "string") return "";
	const trimmed = value.trim();
	return trimmed.length > MAX_TEXT ? trimmed.slice(0, MAX_TEXT) : trimmed;
}

function joinNames(list: unknown): string {
	if (!Array.isArray(list)) return "";
	const names: string[] = [];
	for (const item of list) {
		const name = trimText((item as { name?: unknown } | null)?.name);
		if (name) names.push(name);
	}
	const joined = names.join(" / ");
	return joined.length > MAX_TEXT ? joined.slice(0, MAX_TEXT) : joined;
}

function httpsCover(raw: unknown, suffix: string): string {
	if (typeof raw !== "string") return "";
	let url = raw.trim();
	if (url.startsWith("http://")) {
		url = `https://${url.slice("http://".length)}`;
	}
	if (!url.startsWith("https://") || url.includes('"')) return "";
	return url.includes("?") ? url : `${url}${suffix}`;
}

export function parseNetease(json: unknown): MusicTrack | null {
	const song = (json as { songs?: Array<Record<string, unknown>> } | null)
		?.songs?.[0];
	if (!song) return null;
	const name = trimText(song.name);
	if (!name) return null;
	const album = song.album as { picUrl?: unknown } | undefined;
	return {
		name,
		artists: joinNames(song.artists),
		coverUrl: httpsCover(album?.picUrl, "?param=200y200"),
	};
}

export function parseQq(json: unknown): MusicTrack | null {
	const track = (
		json as {
			req_1?: { data?: { track_info?: Record<string, unknown> } };
		} | null
	)?.req_1?.data?.track_info;
	if (!track) return null;
	const name = trimText(track.name) || trimText(track.title);
	if (!name) return null;
	const albumMid = trimText(
		(track.album as { mid?: unknown } | undefined)?.mid,
	);
	const coverUrl = /^[A-Za-z0-9]{1,32}$/.test(albumMid)
		? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albumMid}.jpg`
		: "";
	return {
		name,
		artists: joinNames(track.singer),
		coverUrl,
	};
}

async function readLimitedJson(response: Response): Promise<unknown> {
	if (!response.body) {
		const text = await response.text();
		if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) {
			throw new Error("Music response too large");
		}
		return JSON.parse(text);
	}
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) {
			total += value.byteLength;
			if (total > MAX_RESPONSE_BYTES) {
				await reader.cancel();
				throw new Error("Music response too large");
			}
			chunks.push(value);
		}
	}
	const combined = Buffer.concat(chunks);
	return JSON.parse(combined.toString("utf8"));
}

export function createMusicLookup(options: MusicLookupOptions = {}) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const neteaseBase = (options.neteaseBase ?? "https://music.163.com").replace(
		/\/$/,
		"",
	);
	const qqBase = (options.qqBase ?? "https://u.y.qq.com").replace(/\/$/, "");
	const nowFn = options.now ?? (() => Date.now());
	const totalBudgetMs = options.totalBudgetMs ?? TOTAL_BUDGET_MS;
	const requestTimeoutMs = options.requestTimeoutMs ?? REQUEST_TIMEOUT_MS;

	const foundCache = new TtlCache<MusicTrack>();
	const missingCache = new TtlCache<boolean>();

	async function fetchTrack(ref: MusicRef): Promise<MusicTrack | null> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
		try {
			const response =
				ref.platform === "netease_music"
					? await fetchImpl(
							`${neteaseBase}/api/song/detail/?ids=${encodeURIComponent(`[${ref.id}]`)}`,
							{
								method: "GET",
								redirect: "error",
								signal: controller.signal,
								headers: {
									Referer: "https://music.163.com/",
									"User-Agent": USER_AGENT,
								},
							},
						)
					: await fetchImpl(`${qqBase}/cgi-bin/musicu.fcg`, {
							method: "POST",
							redirect: "error",
							signal: controller.signal,
							headers: {
								Referer: "https://y.qq.com/",
								"User-Agent": USER_AGENT,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								req_1: {
									module: "music.pf_song_detail_svr",
									method: "get_song_detail_yqq",
									param: { song_mid: ref.id },
								},
							}),
						});
			if (!response.ok) return null;
			const json = await readLimitedJson(response);
			return ref.platform === "netease_music"
				? parseNetease(json)
				: parseQq(json);
		} catch {
			return null;
		} finally {
			clearTimeout(timer);
		}
	}

	return async function lookupMusicCards(
		refs: MusicRef[],
	): Promise<MusicCard[]> {
		if (refs.length === 0) return [];
		const now = nowFn();
		const resolved = new Map<string, MusicTrack>();
		const pending: Array<{ ref: MusicRef; promise: Promise<void> }> = [];

		for (const ref of refs) {
			const key = refKey(ref);
			const cached = foundCache.get(key, now);
			if (cached) {
				resolved.set(key, cached);
				continue;
			}
			if (missingCache.get(key, now)) {
				continue;
			}
			const promise = fetchTrack(ref).then((track) => {
				const finishedAt = nowFn();
				if (track) {
					foundCache.set(key, track, FOUND_TTL_MS, finishedAt);
					resolved.set(key, track);
				} else {
					missingCache.set(key, true, MISSING_TTL_MS, finishedAt);
				}
			});
			pending.push({ ref, promise });
		}

		if (pending.length > 0) {
			let budgetTimer: ReturnType<typeof setTimeout> | undefined;
			const budget = new Promise<void>((resolve) => {
				budgetTimer = setTimeout(resolve, totalBudgetMs);
			});
			await Promise.race([
				Promise.allSettled(pending.map((item) => item.promise)),
				budget,
			]);
			if (budgetTimer) clearTimeout(budgetTimer);
		}

		return refs.map((ref) => ({
			ref,
			track: resolved.get(refKey(ref)) ?? null,
		}));
	};
}

export const lookupMusicCards = createMusicLookup();
