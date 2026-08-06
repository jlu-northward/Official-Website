import type { AppHeroProps } from "config";
import { memo } from "react";
import { FaApple, FaGooglePlay } from "react-icons/fa";

const AppHero = ({ title, description, storeLinks, logo }: AppHeroProps) => (
	<div className="mb-8 flex flex-col items-center gap-8 md:flex-row md:items-start">
		<div className="flex-shrink-0 md:self-center">
			<div className="flex h-[152px] w-[152px] items-center justify-center rounded-lg border border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100 p-3 shadow-sm dark:border-white/10 dark:from-white/[0.02] dark:to-white/[0.05]">
				<img
					src={logo.src}
					alt="App Icon"
					className="h-34 w-34 rounded-lg object-cover"
				/>
			</div>
		</div>

		<div className="flex flex-1 flex-col justify-between text-center md:text-left">
			<div>
				<h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-white">
					{title}
				</h1>
				<p className="mx-auto mb-6 max-w-2xl text-lg leading-relaxed text-gray-600 md:mx-0 dark:text-gray-400">
					{description}
				</p>
			</div>

			<div className="flex flex-col justify-center gap-4 md:flex-row md:justify-start">
				<a
					href="/download-ios"
					target="_blank"
					rel="noopener noreferrer"
					data-umami-event="download-ios"
					className="flex w-full items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2.5 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-sky-500/25 active:scale-[0.98] md:w-auto dark:border-white/10 dark:bg-white/[0.04]"
				>
					<div className="flex h-7 w-7 items-center justify-center">
						<FaApple className="h-[22px] w-[22px] text-gray-600 dark:text-gray-300" />
					</div>
					<span className="text-left">
						<div className="text-base font-semibold tracking-wide text-gray-900 dark:text-white/90">
							苹果版下载
						</div>
						<div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
							iOS
						</div>
					</span>
				</a>

				<a
					href="/download-android"
					target="_blank"
					rel="noopener noreferrer"
					data-umami-event="download-android"
					className="flex w-full items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2.5 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-sky-500/25 active:scale-[0.98] md:w-auto dark:border-white/10 dark:bg-white/[0.04]"
				>
					<div className="flex h-7 w-7 items-center justify-center">
						<FaGooglePlay className="h-5 w-5 text-gray-600 dark:text-gray-300" />
					</div>
					<span className="text-left">
						<div className="text-base font-semibold tracking-wide text-gray-900 dark:text-white/90">
							安卓版下载
						</div>
						<div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
							Android
						</div>
					</span>
				</a>

				<a
					href={storeLinks.google2}
					target="_blank"
					rel="noopener noreferrer"
					className="flex w-full items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2.5 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-sky-500/25 active:scale-[0.98] md:w-auto dark:border-white/10 dark:bg-white/[0.04]"
				>
					<div className="flex h-7 w-7 items-center justify-center">
						<FaGooglePlay className="h-5 w-5 text-gray-600 dark:text-gray-300" />
					</div>
					<span className="text-left">
						<div className="text-base font-semibold tracking-wide text-gray-900 dark:text-white/90">
							安卓版备用下载
						</div>
						<div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
							Android
						</div>
					</span>
				</a>
			</div>
		</div>
	</div>
);

export default memo(AppHero);
