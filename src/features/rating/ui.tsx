import {
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
} from "react";
import { FiArrowLeft, FiImage, FiMapPin, FiX } from "react-icons/fi";
import {
	navigateBack,
	safeImage,
	scoreText,
	locationText,
	type Subject,
	type Upload,
} from "./types";
import { upload } from "./api";

export function ErrorMessage({
	error,
	retry,
}: {
	error: string;
	retry?: () => void;
}) {
	return (
		<div className="rate-error" role="alert">
			<p>{error}</p>
			{retry && (
				<button type="button" onClick={retry}>
					重新加载
				</button>
			)}
		</div>
	);
}
export function Loading() {
	return (
		<div className="rate-loading" role="status">
			正在加载…
		</div>
	);
}
export function PageHeader({
	title,
	back = "/",
	children,
}: {
	title: string;
	back?: string;
	children?: ReactNode;
}) {
	return (
		<header className="rate-header">
			<button
				className="rate-icon"
				aria-label="返回"
				onClick={() => navigateBack(back)}
			>
				<FiArrowLeft />
			</button>
			<h1>{title}</h1>
			{children}
		</header>
	);
}
export function Cover({
	src,
	title,
	className = "",
}: {
	src?: string | null;
	title: string;
	className?: string;
}) {
	const [failed, setFailed] = useState(false);
	useEffect(() => setFailed(false), [src]);
	return safeImage(src) && !failed ? (
		<img
			className={`rate-cover ${className}`}
			src={safeImage(src)}
			alt={title}
			loading="lazy"
			onError={() => setFailed(true)}
		/>
	) : (
		<span
			className={`rate-cover rate-cover-empty ${className}`}
			aria-label={title}
		>
			<span aria-hidden="true">{title.replace(/\s/g, "").slice(0, 2)}</span>
		</span>
	);
}
export function SubjectRow({
	subject,
	campuses,
	index,
	preview = false,
}: {
	subject: Subject;
	campuses: string[];
	index?: number;
	preview?: boolean;
}) {
	return (
		<a
			href={`#/subjects/${subject.id}`}
			className={`rate-subject-row ${preview ? "is-preview" : ""}`}
		>
			<span className="rate-subject-thumb">
				<Cover src={subject.coverUrl} title={subject.title} />
			</span>
			<span className="rate-subject-copy">
				<strong>
					{!preview && index != null && (
						<em className="rate-position">{index + 1}</em>
					)}
					{subject.title}
				</strong>
				{locationText(subject, campuses) && (
					<span className="rate-muted rate-small">
						{locationText(subject, campuses)}
					</span>
				)}
				{preview && (
					<span className="rate-summary">
						{subject.description || "来写下你的体验"}
					</span>
				)}
			</span>
			<span className="rate-score">
				{!preview && (
					<Stars score={subject.totalCount > 0 ? subject.avgScore : 0} />
				)}
				<b>{subject.totalCount > 0 ? scoreText(subject.avgScore) : "—"}</b>
				<small>
					{subject.totalCount > 0 ? `${subject.totalCount}人评分` : "暂无评分"}
				</small>
			</span>
			{!preview && subject.description && (
				<span className="rate-summary">{subject.description}</span>
			)}
		</a>
	);
}
export function LocationLine({
	subject,
	campuses,
}: {
	subject: Subject;
	campuses: string[];
}) {
	const value = locationText(subject, campuses);
	return value ? (
		<p className="rate-location">
			<FiMapPin />
			{value}
		</p>
	) : null;
}
export function Modal({
	title,
	children,
	onClose,
	busy = false,
}: {
	title: string;
	children: ReactNode;
	onClose(): void;
	busy?: boolean;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		ref.current?.showModal();
		const old = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = old;
		};
	}, []);
	return (
		<dialog
			ref={ref}
			className="rate-dialog"
			onCancel={(event) => {
				event.preventDefault();
				if (!busy) onClose();
			}}
		>
			<header>
				<h2>{title}</h2>
				<button
					className="rate-icon"
					aria-label="关闭"
					disabled={busy}
					onClick={onClose}
				>
					<FiX />
				</button>
			</header>
			{children}
		</dialog>
	);
}
export function ImagesInput({
	images,
	onChange,
	max = 9,
	disabled = false,
	onBusy,
}: {
	images: Upload[];
	onChange(images: Upload[]): void;
	max?: number;
	disabled?: boolean;
	onBusy?(value: boolean): void;
}) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const active = useRef(true);
	useEffect(() => {
		active.current = true;
		return () => {
			active.current = false;
		};
	}, []);
	async function pick() {
		if (busy || disabled || images.length >= max) return;
		setBusy(true);
		onBusy?.(true);
		setError("");
		try {
			const next = await upload(max - images.length);
			if (active.current) onChange([...images, ...next].slice(0, max));
		} catch (error) {
			setError((error as Error).message);
		} finally {
			setBusy(false);
			onBusy?.(false);
		}
	}
	return (
		<div>
			<div className="rate-image-input">
				{images.map((item, index) => (
					<div key={`${item.objectKey}-${index}`}>
						<Cover src={item.url} title={`图片 ${index + 1}`} />
						<button
							type="button"
							aria-label={`删除图片 ${index + 1}`}
							disabled={disabled || busy}
							onClick={() => onChange(images.filter((_, i) => i !== index))}
						>
							<FiX />
						</button>
					</div>
				))}
				{images.length < max && (
					<button
						type="button"
						className="rate-image-add"
						disabled={busy || disabled}
						onClick={pick}
					>
						<FiImage />
						{busy ? "上传中…" : "添加图片"}
					</button>
				)}
			</div>
			{error && <ErrorMessage error={error} />}
		</div>
	);
}
export function useInfiniteLoad(load: () => void, enabled: boolean) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const node = ref.current;
		if (!node || !enabled) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) load();
			},
			{ rootMargin: "160px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [load, enabled]);
	return ref;
}
export function Stars({ score }: { score: number }) {
	const percent = Math.max(0, Math.min(100, (Number(score) || 0) * 10));
	return (
		<span className="rate-stars" aria-hidden="true">
			<span>★★★★★</span>
			<span style={{ width: `${percent}%` }}>★★★★★</span>
		</span>
	);
}

export function rankStyle(id: number): CSSProperties {
	return {
		"--rank-hue": [200, 258, 318, 22, 70, 155][Math.abs(id) % 6],
	} as CSSProperties;
}
