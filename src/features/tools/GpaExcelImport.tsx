import { useEffect, useRef, useState } from "react";
import {
	FiCheck,
	FiExternalLink,
	FiFileText,
	FiInfo,
	FiLoader,
	FiUploadCloud,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { gpaImportContent as copy } from "./content/gpa-import";
import { cn } from "@/lib/utils";
import type { GradeImport } from "./gpa-import";

export default function GpaExcelImport({
	fileName,
	onImport,
}: {
	fileName?: string;
	onImport: (value: GradeImport, fileName: string) => void;
}) {
	const input = useRef<HTMLInputElement>(null);
	const busy = useRef(false);
	const onImportRef = useRef(onImport);
	useEffect(() => {
		onImportRef.current = onImport;
	}, [onImport]);
	const dragDepth = useRef(0);
	const [dragging, setDragging] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const readFile = async (file: File) => {
		if (busy.current) return;
		setError("");
		if (!/\.xlsx$/i.test(file.name)) {
			setError(copy.typeError);
			return;
		}
		if (!file.size || file.size > copy.maxBytes) {
			setError(file.size ? copy.sizeError : copy.emptyError);
			return;
		}
		busy.current = true;
		setLoading(true);
		try {
			const { readGradeExcel } = await import("./gpa-excel");
			const value = await readGradeExcel(file);
			onImportRef.current(value, file.name);
		} catch (cause) {
			setError(
				cause instanceof Error && cause.name === "GradeImportError"
					? cause.message
					: copy.readError,
			);
		} finally {
			busy.current = false;
			setLoading(false);
		}
	};
	return (
		<div className="mb-5 sm:mb-6">
			<div
				className={cn(
					"relative flex flex-col gap-4 rounded-2xl border border-dashed border-primary/25 bg-secondary/40 p-5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-6",
					dragging && "border-primary bg-secondary ring-2 ring-primary/20",
				)}
				onDragEnter={(event) => {
					if (!event.dataTransfer.types.includes("Files")) return;
					event.preventDefault();
					dragDepth.current++;
					setDragging(true);
				}}
				onDragOver={(event) => {
					if (event.dataTransfer.types.includes("Files"))
						event.preventDefault();
				}}
				onDragLeave={(event) => {
					event.preventDefault();
					dragDepth.current = Math.max(0, dragDepth.current - 1);
					if (!dragDepth.current) setDragging(false);
				}}
				onDrop={(event) => {
					event.preventDefault();
					dragDepth.current = 0;
					setDragging(false);
					const file = event.dataTransfer.files[0];
					if (file) void readFile(file);
				}}
			>
				<div className="flex min-w-0 items-start gap-3.5 sm:items-center sm:gap-4">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-card text-primary sm:h-12 sm:w-12">
						{loading ? (
							<FiLoader className="h-5 w-5 animate-spin" />
						) : fileName ? (
							<FiFileText className="h-5 w-5" />
						) : (
							<FiUploadCloud className="h-5 w-5" />
						)}
					</div>
					<div className="min-w-0">
						<p className="flex items-center gap-2 text-sm font-semibold">
							{loading
								? copy.loading
								: dragging
									? copy.drop
									: fileName
										? copy.loaded
										: copy.title}
							{fileName && !loading && (
								<FiCheck className="shrink-0 text-primary" />
							)}
						</p>
						<p className="mt-1 break-words text-xs leading-6 text-muted-foreground">
							{fileName || copy.description}
						</p>
						<p className="mt-1 text-[10px] leading-5 text-muted-foreground/80">
							{copy.privacy}
						</p>
					</div>
				</div>
				<div className="shrink-0 sm:text-right">
					<input
						ref={input}
						type="file"
						accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
						aria-label={copy.fileLabel}
						className="sr-only"
						tabIndex={-1}
						onChange={(event) => {
							const file = event.target.files?.[0];
							event.target.value = "";
							if (file) void readFile(file);
						}}
					/>
					<Button
						type="button"
						variant="outline"
						className="h-10 w-full gap-2 rounded-xl border-primary/20 bg-card text-xs text-primary hover:bg-secondary sm:w-auto sm:px-5"
						disabled={loading}
						onClick={() => input.current?.click()}
					>
						<FiUploadCloud className="h-4 w-4" />
						{fileName ? copy.change : copy.choose}
					</Button>
					<p className="mt-2 text-center font-mono text-[10px] text-muted-foreground/80 sm:text-right">
						{copy.format}
					</p>
				</div>
			</div>
			<p className="mt-3 flex items-start gap-2 px-1 text-[11px] leading-6 text-muted-foreground">
				<FiInfo
					className="mt-1 h-3.5 w-3.5 shrink-0 text-primary/70"
					aria-hidden="true"
				/>
				<span>
					{copy.exportTipBefore}{" "}
					<a
						href={copy.exportUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="rounded-sm font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{copy.exportLinkLabel}
						<FiExternalLink
							className="ml-1 inline h-3 w-3 align-middle"
							aria-hidden="true"
						/>
						<span className="sr-only">{copy.newWindow}</span>
					</a>{" "}
					{copy.exportTipAfter}
				</span>
			</p>
			{error && (
				<p
					role="alert"
					className="mt-3 rounded-xl bg-destructive/5 px-4 py-3 text-xs leading-6 text-destructive"
				>
					{error}
				</p>
			)}
			<span className="sr-only" role="status">
				{loading ? copy.loading : ""}
			</span>
		</div>
	);
}
