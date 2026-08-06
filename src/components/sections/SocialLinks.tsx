import type { SocialLink, SocialLinksProps } from "config";
import { memo } from "react";

const SocialLinks = ({ items }: SocialLinksProps) => (
	<div className="mb-8">
		<div className="relative">
			<div className="absolute inset-0 flex items-center">
				<div className="mx-auto border-t border-gray-300 dark:border-white/10" />
			</div>
			<div className="relative flex justify-center">
				<span className="bg-gray-50 px-6 text-sm font-medium uppercase tracking-wider text-gray-500 dark:bg-black dark:text-white/50">
					Social Media
				</span>
			</div>
		</div>

		<div className="mt-6 flex justify-center gap-4">
			{items.map(({ icon: Icon, label, url }: SocialLink) => (
				<a
					key={label}
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="rounded-xl border border-gray-300 bg-white p-3 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-sky-500/25 dark:border-white/10 dark:bg-white/[0.03]"
					aria-label={label}
				>
					<Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
				</a>
			))}
		</div>
	</div>
);

export default memo(SocialLinks);
