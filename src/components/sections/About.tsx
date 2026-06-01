import { memo } from "react";
import { FiHeart, FiMail } from "react-icons/fi";

const stats = [
	{ value: "40+", label: "团队成员" },
	{ value: "13", label: "成员来自不同专业" },
	{ value: "7", label: "覆盖大一至研三" },
	{ value: "4", label: "团队下设职能部门" },
];

const About = () => (
	<div className="mb-8">
		<h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
			关于我们
		</h2>

		<blockquote className="mt-2 border-l-4 border-gray-300 dark:border-white/15 pl-4 py-1 italic text-gray-500 dark:text-gray-400">
			向北 App 的名字取自吉林大学大型原创话剧「先生向北」，象征着 JLUer 们青春向北。
		</blockquote>

		<p className="mt-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
			<span className="font-semibold text-gray-900 dark:text-white">「向北」</span>是一款由吉林大学开放原子开源社团推出的吉大校园论坛 App，团队全员来自吉林大学，下设开发、运营、艺术设计三大方向。我们热爱开源、热爱技术，更热爱吉大的校园生活。
		</p>

		<div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
			{stats.map(({ value, label }) => (
				<div
					key={label}
					className="rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-3 text-center shadow-sm"
				>
					<div className="text-2xl font-semibold text-gray-900 dark:text-white">
						{value}
					</div>
					<div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{label}
					</div>
				</div>
			))}
		</div>

		<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
				<FiHeart className="w-5 h-5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
				<span>
					如果你对「代码 / 运营 / 创作」感兴趣，对向北 App 充满热情，欢迎加入我们，一起让吉大的校园生活变得更加美好！
				</span>
			</div>
			<a
				href="mailto:admin@northward.zone"
				className="inline-flex items-center gap-2 self-start sm:self-auto rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.08] transition-colors"
			>
				<FiMail className="w-4 h-4" />
				<span>admin@northward.zone</span>
			</a>
		</div>
	</div>
);

export default memo(About);
