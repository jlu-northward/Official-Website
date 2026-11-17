const targets: Record<string, string> = {
	hockey: "https://games.northward.zone/hockey/",
	"perfect-match": "https://games.northward.zone/perfect-match/",
};

type AppAuth = { accessToken?: string | null };
declare global {
	interface Window {
		northwardAuth?: AppAuth;
	}
}

function readAuth(): Promise<AppAuth> {
	if (window.northwardAuth) return Promise.resolve(window.northwardAuth);
	return new Promise((resolve) => {
		const timer = window.setTimeout(() => finish({}), 20000);
		function finish(auth: AppAuth) {
			clearTimeout(timer);
			window.removeEventListener("northwardAuthChanged", changed);
			resolve(auth);
		}
		function changed(event: Event) {
			finish((event as CustomEvent<AppAuth>).detail ?? {});
		}
		window.addEventListener("northwardAuthChanged", changed);
	});
}

export async function launchGame() {
	const params = new URLSearchParams(location.search);
	const game = params.get("game") ?? "",
		state = params.get("state") ?? "";
	const challenge = params.get("challenge") ?? "";
	const target = targets[game];
	if (
		!target ||
		!/^[A-Za-z0-9_-]{32,128}$/.test(state) ||
		!/^[A-Za-z0-9_-]{43}$/.test(challenge)
	) {
		throw new Error("无效游戏入口");
	}
	const callback = new URL(target);
	const result = new URLSearchParams({ nw_state: state, nw_guest: "1" });
	try {
		const { accessToken } = await readAuth();
		if (accessToken) {
			const response = await fetch("/games/session/code", {
				method: "POST",
				credentials: "omit",
				cache: "no-store",
				redirect: "error",
				signal: AbortSignal.timeout(10000),
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ game, state, codeChallenge: challenge }),
			});
			const body = await response.json();
			if (
				response.ok &&
				body.success === true &&
				/^[A-Za-z0-9_-]{43}$/.test(body.data?.code)
			) {
				result.delete("nw_guest");
				result.set("nw_code", body.data.code);
			}
		}
	} catch {
		/* 登录暂不可用时，以游客继续；游戏侧已清除旧账号。 */
	}
	callback.hash = result.toString();
	location.replace(callback.href);
}
