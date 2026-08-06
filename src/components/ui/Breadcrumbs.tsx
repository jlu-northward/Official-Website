import type { BreadcrumbsProps } from "config";
import { springGentle } from "config/motion";
import { motion } from "framer-motion";
import { memo } from "react";
import { FiChevronRight, FiHome } from "react-icons/fi";

const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
	<motion.nav
		initial={{ opacity: 0, y: 12 }}
		animate={{ opacity: 1, y: 0 }}
		transition={springGentle}
		className="mb-8 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
	>
		<a
			href="/"
			className="-ml-2 rounded-md p-2 outline-none transition-colors duration-300 hover:text-gray-800 focus-visible:text-gray-800 dark:hover:text-white dark:focus-visible:text-white"
		>
			<FiHome className="h-4 w-4" />
		</a>
		{items.map(({ label, href }) => (
			<div key={label} className="flex items-center space-x-2">
				<FiChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600" />
				{href ? (
					<a
						href={href}
						className="rounded-md outline-none transition-colors duration-300 hover:text-gray-800 focus-visible:text-gray-800 dark:hover:text-white dark:focus-visible:text-white"
					>
						{label}
					</a>
				) : (
					<span className="text-gray-900 dark:text-white">{label}</span>
				)}
			</div>
		))}
	</motion.nav>
);

export default memo(Breadcrumbs);
