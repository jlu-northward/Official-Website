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
	// 原生在文档启动时注入主题标记；普通浏览器没有 App 登录态，直接走游客。
	if (!("northwardTheme" in window) && !("flutter_inappwebview" in window)) {
		return Promise.resolve({});
	}
	return new Promise((resolve, reject) => {
		// 包含原生请求、刷新凭据及重试的时间；超时不能静默改成游客记分。
		const timer = window.setTimeout(() => {
			window.removeEventListener("northwardAuthChanged", changed);
			reject(new Error("登录信息加载超时，请重试"));
		}, 45000);
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
		} else {
			throw new Error("账号交接暂不可用，请重试");
		}
	}
	callback.hash = result.toString();
	location.replace(callback.href);
}
