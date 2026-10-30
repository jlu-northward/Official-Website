import { useEffect, useState, type ComponentType } from "react";
import { FiBookOpen, FiMapPin } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { classroomContent as copy } from "./content/classrooms";
import EmptyClassroomFinder from "./EmptyClassroomFinder";

export default function ClassroomTools({ active }: { active: boolean }) {
	const [mode, setMode] = useState("rooms");
	const [requested, setRequested] = useState(false);
	const [courseModule, setCourseModule] = useState<{
		default: ComponentType<{ active: boolean }>;
	} | null>(null);
	const [failed, setFailed] = useState(false);
	const [attempt, setAttempt] = useState(0);
	useEffect(() => {
		if (!requested) return;
		let cancelled = false;
		setFailed(false);
		import("./CourseAuditingFinder")
			.then((module) => {
				if (!cancelled) setCourseModule(module);
			})
			.catch(() => {
				if (!cancelled) setFailed(true);
			});
		return () => {
			cancelled = true;
		};
	}, [requested, attempt]);
	const CourseFinder = courseModule?.default;
	return (
		<Tabs
			value={mode}
			onValueChange={(value) => {
				setMode(value);
				if (value === "courses") setRequested(true);
			}}
		>
			<TabsList
				aria-label="教室与课程查询模式"
				className="mb-5 h-11 w-full rounded-xl bg-muted p-1 sm:mb-7 sm:w-auto"
			>
				<TabsTrigger
					value="rooms"
					className="h-9 flex-1 gap-2 rounded-lg px-5 text-xs"
				>
					<FiMapPin />
					{copy.roomMode}
				</TabsTrigger>
				<TabsTrigger
					value="courses"
					className="h-9 flex-1 gap-2 rounded-lg px-5 text-xs"
				>
					<FiBookOpen />
					{copy.courseMode}
				</TabsTrigger>
			</TabsList>
			<TabsContent
				value="rooms"
				forceMount
				className="mt-0 data-[state=inactive]:hidden"
			>
				<EmptyClassroomFinder active={active && mode === "rooms"} />
			</TabsContent>
			<TabsContent
				value="courses"
				forceMount
				className="mt-0 data-[state=inactive]:hidden"
			>
				{CourseFinder ? (
					<CourseFinder active={active && mode === "courses"} />
				) : requested ? (
					<div
						role="status"
						className="rounded-2xl border bg-card px-5 py-12 text-center text-sm text-muted-foreground"
					>
						<p>{failed ? copy.courseModeLoadError : copy.courseModeLoading}</p>
						{failed && (
							<Button
								variant="outline"
								className="mt-4"
								onClick={() => setAttempt((value) => value + 1)}
							>
								重新加载
							</Button>
						)}
					</div>
				) : null}
			</TabsContent>
		</Tabs>
	);
}
