import type { FAQProps } from "config";
import { springGentle, staggerDelay } from "config/motion";
import { motion } from "framer-motion";
import { memo } from "react";

const FAQ = ({ items }: FAQProps) => (
	<div className="mb-16">
		<motion.h2
			initial={{ opacity: 0, y: 12 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={springGentle}
			className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
		>
			FAQ
		</motion.h2>
		<div className="space-y-4">
			{items.map((item, index) => (
				<motion.div
					key={item.question}
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{
						...springGentle,
						delay: staggerDelay(index, 0.07, 0.35),
					}}
					className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm transition-colors duration-300 hover:border-gray-400 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
				>
					<details className="group">
						<summary className="flex cursor-pointer items-center justify-between p-6">
							<h3 className="pr-6 font-medium text-gray-900 dark:text-white">
								{item.question}
							</h3>
							<svg
								className="h-5 w-5 flex-shrink-0 text-gray-600 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-180 dark:text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-label="Toggle answer visibility"
								role="img"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</summary>
						<div className="border-t border-gray-200 px-6 pb-6 pt-6 dark:border-white/5">
							<p className="text-gray-600 dark:text-gray-400">{item.answer}</p>
						</div>
					</details>
				</motion.div>
			))}
		</div>
	</div>
);

export default memo(FAQ);
