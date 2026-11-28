import type { Envelope, Params, Upload } from "./types";
interface NativePort {
	postMessage(message: string): void;
	onmessage: ((event: { data: string }) => void) | null;
}
declare global {
	interface Window {
		northwardRating?: NativePort;
	}
}
interface Pending {
	resolve(value: unknown): void;
	reject(reason: Error): void;
	timer: ReturnType<typeof setTimeout>;
}
const pending = new Map<string, Pending>();
let attached: NativePort | undefined;
let sequence = 0;
let routeRevision = 0;
export function routeChanged() {
	routeRevision++;
	if (window.northwardRating) void call("navigation").catch(() => {});
}
type Transport = (action: string, args: Params) => Promise<unknown>;
let preview: Transport | undefined;

export async function connect(): Promise<{ uid: number | null }> {
	// 预览数据仅存在于开发构建；线上必须由 App 提供真实登录会话。
	if (
		import.meta.env.DEV &&
		new URLSearchParams(location.search).get("preview") === "1"
	) {
		preview = (await import("./preview")).createPreviewTransport();
	}
	if (!preview) {
		const deadline = Date.now() + 8000;
		while (!window.northwardRating && Date.now() < deadline)
			await new Promise((resolve) => setTimeout(resolve, 100));
		if (!window.northwardRating)
			throw new Error("请在最新版向北 App 中打开评分榜");
	}
	return call("session") as Promise<{ uid: number | null }>;
}
export async function call<T = unknown>(
	action: string,
	args: Params = {},
): Promise<T> {
	if (preview) return preview(action, args) as Promise<T>;
	const port = window.northwardRating;
	if (!port) throw new Error("连接已断开，请重新打开评分榜");
	if (attached !== port) {
		attached = port;
		port.onmessage = (event) => {
			try {
				const response = JSON.parse(event.data);
				const item = pending.get(response.id);
				if (!item) return;
				clearTimeout(item.timer);
				pending.delete(response.id);
				if (response.error) {
					if (response.code === "SESSION_CHANGED")
						window.dispatchEvent(new Event("rating-session-changed"));
					item.reject(new Error(response.error));
				} else item.resolve(response.result);
			} catch {
				/* 忽略无效或已过期消息。 */
			}
		};
	}
	const id = `rating-${++sequence}`;
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(
			() => {
				pending.delete(id);
				reject(new Error("操作超时，请检查结果后重试"));
			},
			action === "upload" || action === "profile" ? 300000 : 45000,
		);
		pending.set(id, {
			resolve: resolve as (value: unknown) => void,
			reject,
			timer,
		});
		try {
			port.postMessage(
				JSON.stringify({
					id,
					action,
					...args,
					routeRevision,
					route: location.hash.slice(1),
				}),
			);
		} catch {
			clearTimeout(timer);
			pending.delete(id);
			reject(new Error("连接已断开，请重新打开评分榜"));
		}
	});
}
export async function request<T>(
	path: string,
	params: Params = {},
	method = "GET",
): Promise<T> {
	const response = await call<Envelope<T>>("request", {
		method,
		path: `api/${path}`,
		params,
	});
	if (!response || response.success !== true)
		throw new Error(response?.message || "加载失败，请稍后重试");
	return response.data;
}
export const upload = (count: number) => call<Upload[]>("upload", { count });
