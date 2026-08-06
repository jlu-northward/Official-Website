import { memo } from "react";

const stats = [
	{ value: "40+", label: "团队成员总数" },
	{ value: "4", label: "下设职能部门" },
	{ value: "13", label: "来自不同专业" },
	{ value: "7", label: "涵盖各个年级" },
];

const About = () => (
	<div className="mb-8">
		<h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
			关于我们
		</h2>

		<div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
			{stats.map(({ value, label }) => (
				<div
					key={label}
					className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
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

		<p className="mt-6 text-base leading-relaxed text-gray-700 dark:text-gray-300">
			<span className="font-semibold text-gray-900 dark:text-white">
				「向北」
			</span>
			是一款由吉林大学开放原子开源社团推出的吉大校园论坛
			App，团队全员来自吉林大学，下设开发、运营、艺术设计三大方向。我们热爱开源、热爱技术，更热爱吉大的校园生活，欢迎通过
			<a
				href="mailto:admin@northward.zone"
				className="text-gray-600 underline-offset-2 outline-none focus-visible:underline dark:text-gray-300"
			>
				admin@northward.zone
			</a>
			加入我们。
		</p>

		<blockquote className="mt-3 border-l-4 border-gray-300 py-1 pl-4 italic text-gray-500 dark:border-white/15 dark:text-gray-400">
			App 的名字取自吉大大型原创话剧「先生向北」，象征着 JLUer 们青春向北。
		</blockquote>
	</div>
);

export default memo(About);
