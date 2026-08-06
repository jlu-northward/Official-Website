import type { FeaturesProps } from "config";
import { memo } from "react";

const Features = ({ items }: FeaturesProps) => (
	<div className="mb-8">
		<h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
			主要功能
		</h2>
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
			{items.map(({ icon: Icon, title, description }) => (
				<div
					key={title}
					className="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
				>
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.04]">
						<Icon className="h-6 w-6 text-gray-700 opacity-90 dark:text-white" />
					</div>
					<h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
						{title}
					</h3>
					<p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
						{description}
					</p>
				</div>
			))}
		</div>
	</div>
);

export default memo(Features);
