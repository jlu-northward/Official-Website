import type { Review, ReviewsProps } from "config";
import { springGentle, springSnappy, staggerDelay } from "config/motion";
import { motion } from "framer-motion";
import { memo } from "react";
import RatingStars from "../ui/RatingStars";

const Reviews = ({ items }: ReviewsProps) => (
	<div className="mb-16">
		<motion.h2
			initial={{ opacity: 0, y: 12 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={springGentle}
			className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
		>
			User Reviews
		</motion.h2>

		<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
			{items.map((review: Review, index: number) => (
				<motion.div
					key={`review-${review.author.replace(/\s+/g, "-")}-${index}`}
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{
						...springGentle,
						delay: staggerDelay(index, 0.08, 0.4),
					}}
					whileHover={{ y: -4, transition: springSnappy }}
					className="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03]"
				>
					<div className="mb-4 flex items-center gap-4">
						{review.avatar ? (
							<img
								src={review.avatar}
								alt={`${review.author} avatar`}
								className="h-12 w-12 rounded-full border border-gray-300 object-cover dark:border-white/10"
							/>
						) : (
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-800 dark:bg-white/[0.08] dark:text-white/90">
								{review.author[0]}
							</div>
						)}
						<div>
							<div className="font-medium text-gray-900 dark:text-white">
								{review.author}
							</div>
							<RatingStars rating={review.rating} />
						</div>
					</div>
					<p className="text-gray-600 dark:text-gray-400">{review.text}</p>
				</motion.div>
			))}
		</div>
	</div>
);

export default memo(Reviews);
