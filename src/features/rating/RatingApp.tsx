import { useEffect, useState } from "react";
import { connect, request, routeChanged } from "./api";
import { readRoute, type Rank } from "./types";
import { Overview, RankView } from "./RankViews";
import { SubjectView } from "./SubjectView";
import { CreateSubject } from "./CreateSubject";
import { ErrorMessage, Loading, PageHeader } from "./ui";
import "./rating.css";

export default function RatingApp() {
	const [route, setRoute] = useState(readRoute);
	const [ready, setReady] = useState(false);
	const [error, setError] = useState("");
	const [sessionChanged, setSessionChanged] = useState(false);
	const [retry, setRetry] = useState(0);
	const [ranks, setRanks] = useState<Rank[]>([]);
	const [campuses, setCampuses] = useState<string[]>([]);
	useEffect(() => {
		let depth = Number(window.history.state?.ratingDepth) || 0;
		window.history.replaceState(
			{ ...window.history.state, ratingDepth: depth },
			"",
		);
		const change = () => {
			routeChanged();
			// 哈希链接新建的历史项没有 state；原生返回则恢复已有的深度。
			depth = window.history.state?.ratingDepth ?? depth + 1;
			window.history.replaceState(
				{ ...window.history.state, ratingDepth: depth },
				"",
			);
			setRoute(readRoute());
			window.scrollTo({ top: 0, behavior: "instant" });
		};
		window.addEventListener("hashchange", change);
		return () => window.removeEventListener("hashchange", change);
	}, []);
	useEffect(() => {
		const changed = () => setSessionChanged(true);
		window.addEventListener("rating-session-changed", changed);
		return () => window.removeEventListener("rating-session-changed", changed);
	}, []);
	useEffect(() => {
		let active = true;
		setReady(false);
		setError("");
		connect()
			.then(async (session) => {
				if (!session.uid) throw new Error("请先登录向北，再打开评分榜");
				const [ranks, campuses] = await Promise.all([
					request<Rank[]>("rate/ranks"),
					request<string[]>("users/campus"),
				]);
				if (active) {
					setRanks(ranks);
					setCampuses(campuses);
					setReady(true);
				}
			})
			.catch((e) => {
				if (active) setError(e.message);
			});
		return () => {
			active = false;
		};
	}, [retry]);
	const [path, query = ""] = route.split("?");
	const parts = path.split("/").filter(Boolean);
	const id = Number(parts[1]);
	let view;
	if (sessionChanged)
		view = (
			<>
				<PageHeader title="向北评分榜" />
				<ErrorMessage
					error="登录状态已变化，请刷新后继续"
					retry={() => window.location.reload()}
				/>
			</>
		);
	else if (!ready)
		view = (
			<>
				<PageHeader title="向北评分榜" />
				{error ? (
					<>
						<ErrorMessage
							error={error}
							retry={() => setRetry((value) => value + 1)}
						/>
						<a
							className="rate-open-app"
							href="https://northward.zone/download/"
						>
							获取向北 App
						</a>
					</>
				) : (
					<Loading />
				)}
			</>
		);
	else if (!parts.length) view = <Overview ranks={ranks} campuses={campuses} />;
	else if (parts[0] === "ranks") {
		const rank = ranks.find((rank) => rank.id === id);
		view = rank ? (
			<RankView key={id} rank={rank} campuses={campuses} query={query} />
		) : (
			<>
				<PageHeader title="评分榜" />
				<ErrorMessage error="榜单不存在或暂不可见" />
			</>
		);
	} else if (parts[0] === "subjects" && Number.isSafeInteger(id) && id > 0)
		view = (
			<SubjectView
				key={path}
				id={id}
				ranks={ranks}
				campuses={campuses}
				replyRoot={
					parts[2] === "replies" && Number(parts[3]) > 0
						? Number(parts[3])
						: undefined
				}
			/>
		);
	else if (parts[0] === "create")
		view = (
			<CreateSubject
				ranks={ranks}
				campuses={campuses}
				initialRankId={Number(new URLSearchParams(query).get("rankId"))}
			/>
		);
	else
		view = (
			<>
				<PageHeader title="评分榜" />
				<ErrorMessage error="页面不存在，请返回评分榜首页" />
			</>
		);
	return (
		<main className="rating-app">
			{import.meta.env.DEV &&
				typeof window !== "undefined" &&
				new URLSearchParams(window.location.search).get("preview") === "1" && (
					<div className="rate-preview-notice">
						开发预览 · 演示数据{" "}
						<button
							onClick={() => document.documentElement.classList.toggle("dark")}
						>
							切换明暗
						</button>
					</div>
				)}
			{view}
		</main>
	);
}
