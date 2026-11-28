import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { DayPicker, type DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({ className, classNames, ...props }: DayPickerProps) {
	return (
		<DayPicker
			className={cn("relative p-3", className)}
			classNames={{
				months: "flex flex-col",
				month: "space-y-4",
				month_caption: "relative flex h-9 items-center justify-center",
				caption_label: "text-sm font-medium",
				nav: "absolute inset-x-1 top-1 flex items-center justify-between",
				button_previous:
					"flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				button_next:
					"flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				month_grid: "w-full border-collapse",
				weekdays: "flex",
				weekday:
					"w-9 py-1 text-center text-xs font-normal text-muted-foreground",
				week: "mt-1 flex w-full",
				day: "h-9 w-9 p-0 text-center text-sm",
				day_button:
					"h-9 w-9 rounded-md font-normal hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
				selected:
					"[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90 [&>button]:hover:text-primary-foreground",
				outside: "text-muted-foreground opacity-50",
				disabled: "text-muted-foreground opacity-50",
				...classNames,
			}}
			components={{
				Chevron: ({ orientation }) =>
					orientation === "left" ? (
						<ChevronLeftIcon className="h-4 w-4" />
					) : (
						<ChevronRightIcon className="h-4 w-4" />
					),
			}}
			{...props}
		/>
	);
}

export { Calendar };
