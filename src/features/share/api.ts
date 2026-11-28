import type { PublicPostSharePage } from "./types.ts";

const DEFAULT_BACKEND_BASE = "http://127.0.0.1:1006";
const FETCH_TIMEOUT_MS = 4000;

export type SharePostFetchResult =
	| { status: "ok"; page: PublicPostSharePage }
	| { status: "not_found" }
	| { status: "error" };

export async function fetchSharedPost(
	postId: string,
	fetchImpl: typeof fetch = fetch,
): Promise<SharePostFetchResult> {
	const baseUrl = (
		process.env.SHARE_API_BASE_URL || DEFAULT_BACKEND_BASE
	).replace(/\/$/, "");
	const token = (process.env.SHARE_INTERNAL_TOKEN || "").trim();

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		const headers: Record<string, string> = {
			Accept: "application/json",
		};
		if (token) {
			headers["X-Share-Internal-Token"] = token;
		}
		const response = await fetchImpl(`${baseUrl}/share/posts/${postId}`, {
			method: "GET",
			headers,
			signal: controller.signal,
		});
		if (response.status === 404) {
			return { status: "not_found" };
		}
		if (!response.ok) {
			return { status: "error" };
		}
		const page = (await response.json()) as PublicPostSharePage;
		return { status: "ok", page };
	} catch {
		return { status: "error" };
	} finally {
		clearTimeout(timer);
	}
}
