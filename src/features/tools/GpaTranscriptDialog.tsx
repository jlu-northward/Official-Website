import { useEffect, useMemo, useState } from "react";
import {
	FiDownload,
	FiImage,
	FiLoader,
	FiRefreshCw,
	FiShield,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { gpaTranscriptContent as copy } from "./content/gpa-transcript";
import type { CourseDraft, GpaScope } from "./gpa";
import type { SkippedGrade } from "./gpa-import";
import { buildGpaTranscript } from "./gpa-transcript";

interface GpaTranscriptDialogProps {
	courses: CourseDraft[];
	skipped: SkippedGrade[];
	scope: GpaScope;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCloseAutoFocus?: (event: Event) => void;
}

export default function GpaTranscriptDialog({
	courses,
	skipped,
	scope,
	open,
	onOpenChange,
	onCloseAutoFocus,
}: GpaTranscriptDialogProps) {
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [attempt, setAttempt] = useState(0);
	const transcript = useMemo(
		() => (open ? buildGpaTranscript(courses, skipped, scope) : null),
		[open, courses, skipped, scope],
	);

	useEffect(() => {
		if (!transcript) {
			setImageUrl(null);
			return;
		}
		const currentTranscript = transcript;
		let cancelled = false;
		let objectUrl: string | undefined;
		setImageUrl(null);
		setError("");
		async function generate() {
			try {
				const { renderGpaTranscriptImage } =
					await import("./gpa-transcript-image");
				if (cancelled) return;
				const blob = await renderGpaTranscriptImage(currentTranscript);
				if (cancelled) return;
				objectUrl = URL.createObjectURL(blob);
				setImageUrl(objectUrl);
			} catch (cause) {
				if (!cancelled)
					setError(
						cause instanceof Error && cause.message === copy.tooLarge
							? copy.tooLarge
							: copy.generateError,
					);
			}
		}
		void generate();
		return () => {
			cancelled = true;
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [transcript, attempt]);

	const saveImage = () => {
		if (!imageUrl) return;
		try {
			setError("");
			const link = document.createElement("a");
			link.href = imageUrl;
			link.download = copy.downloadName;
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch {
			setError(copy.saveError);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				onCloseAutoFocus={onCloseAutoFocus}
				className="flex max-h-[90svh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[92svh]"
			>
				<DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 text-left sm:px-7 sm:py-6">
					<DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg">
						<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
							<FiImage className="h-4 w-4" />
						</span>
						{copy.title}
					</DialogTitle>
					<DialogDescription className="pt-1 text-xs leading-5">
						{copy.description}
					</DialogDescription>
				</DialogHeader>
				<div
					tabIndex={0}
					role="region"
					aria-label={copy.imageAlt}
					className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/60 px-3 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-7 sm:py-6"
				>
					{imageUrl ? (
						<img
							src={imageUrl}
							alt={copy.imageAlt}
							className="mx-auto block h-auto w-full rounded-sm shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]"
						/>
					) : (
						<div className="flex min-h-64 flex-col items-center justify-center gap-4 px-5 py-12 text-center">
							{error ? (
								<>
									<FiImage className="h-8 w-8 text-muted-foreground/50" />
									<p
										role="alert"
										className="text-xs leading-6 text-muted-foreground"
									>
										{error}
									</p>
									<Button
										variant="outline"
										className="h-10 rounded-xl text-xs"
										onClick={() => setAttempt((current) => current + 1)}
									>
										<FiRefreshCw />
										{copy.retry}
									</Button>
								</>
							) : (
								<>
									<FiLoader className="h-7 w-7 animate-spin text-primary motion-reduce:animate-none" />
									<p role="status" className="text-xs text-muted-foreground">
										{copy.loading}
									</p>
								</>
							)}
						</div>
					)}
					{transcript && imageUrl && (
						<details className="mx-auto mt-4 rounded-xl border bg-card px-4 py-3 text-xs">
							<summary className="cursor-pointer font-medium text-primary">
								{copy.accessibleDetails}
							</summary>
							<p className="mt-4 text-muted-foreground">
								{copy.gpaLabel} · {copy.scopeLabels[scope]}：
								{transcript.result.gpa?.toFixed(5) ?? copy.notReady}
							</p>
							{transcript.groups.map((group) => (
								<table
									key={group.term}
									className="mt-4 w-full table-fixed text-left text-[10px] leading-5"
								>
									<caption className="pb-2 text-left text-xs font-medium">
										{group.term}
									</caption>
									<thead className="border-y text-muted-foreground">
										<tr>
											<th scope="col" className="w-[52%] py-2 pr-2 font-normal">
												{copy.columns.course}
											</th>
											<th scope="col" className="py-2 text-right font-normal">
												{copy.columns.credits}
											</th>
											<th scope="col" className="py-2 text-right font-normal">
												{copy.columns.points}
											</th>
											<th scope="col" className="py-2 text-right font-normal">
												{copy.columns.score}
											</th>
										</tr>
									</thead>
									<tbody>
										{group.courses.map((course) => (
											<tr key={course.id} className="border-b last:border-0">
												<th
													scope="row"
													className="break-words py-2 pr-2 font-normal"
												>
													{course.name}
													<span className="block text-muted-foreground">
														{course.nature} · {course.note}
													</span>
												</th>
												<td className="break-words py-2 text-right align-top">
													{course.credits}
												</td>
												<td className="break-words py-2 text-right align-top">
													{course.points?.toFixed(1) ?? "—"}
												</td>
												<td className="break-words py-2 text-right align-top">
													{course.score}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							))}
						</details>
					)}
				</div>
				<div className="shrink-0 border-t bg-card px-5 py-4 sm:px-7">
					{imageUrl && error && (
						<p role="alert" className="mb-3 text-xs leading-5 text-destructive">
							{error}
						</p>
					)}
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
						<div className="min-w-0 text-[10px] leading-5 text-muted-foreground">
							<p className="flex items-center gap-1.5 text-primary/80">
								<FiShield className="h-3 w-3 shrink-0" />
								{copy.localHint}
							</p>
							<p>{copy.previewHint}</p>
						</div>
						<Button
							type="button"
							disabled={!imageUrl}
							onClick={saveImage}
							className="h-11 shrink-0 rounded-xl px-6 text-xs"
						>
							<FiDownload />
							{copy.save}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
