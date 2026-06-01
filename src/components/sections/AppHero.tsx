import type { AppHeroProps } from "config";
import { memo } from "react";
import { FaApple, FaGooglePlay } from "react-icons/fa";

const AppHero = ({ title, description, storeLinks, logo }: AppHeroProps) => (
	<div className="mb-8 flex flex-col items-center md:items-start md:flex-row gap-8">
		<div className="flex-shrink-0 md:self-center">
			<div className="rounded-lg border border-gray-200/50 dark:border-white/10 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/[0.02] dark:to-white/[0.05] p-3 w-[152px] h-[152px] flex items-center justify-center shadow-sm">
				<img src={logo.src} alt="App Icon" className="h-34 w-34 rounded-lg object-cover" />
			</div>
		</div>

		<div className="flex flex-1 flex-col justify-between text-center md:text-left">
			<div>
				<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{title}</h1>
				<p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6 max-w-2xl mx-auto md:mx-0">{description}</p>
			</div>

			<div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
				<a
					href="/download-ios"
					target="_blank"
					rel="noopener noreferrer"
					data-umami-event="download-ios"
					className="group w-full md:w-auto flex items-center gap-3 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2.5 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/[0.08] hover:border-gray-400 dark:hover:border-white/20 shadow-sm"
				>
					<div className="flex items-center justify-center w-7 h-7">
						<FaApple className="text-gray-600 dark:text-gray-300 transition-transform duration-300 group-hover:scale-110 group-hover:text-gray-800 dark:group-hover:text-white w-[22px] h-[22px]" />
					</div>
					<span className="text-left">
						<div className="text-base font-semibold tracking-wide text-gray-900 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">苹果版下载</div>
						<div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">iOS</div>
					</span>
				</a>

				<a
					href="/download-android"
					target="_blank"
					rel="noopener noreferrer"
					data-umami-event="download-android"
					className="group w-full md:w-auto flex items-center gap-3 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2.5 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/[0.08] hover:border-gray-400 dark:hover:border-white/20 shadow-sm"
				>
					<div className="flex items-center justify-center w-7 h-7">
						<FaGooglePlay className="text-gray-600 dark:text-gray-300 transition-transform duration-300 group-hover:scale-110 group-hover:text-gray-800 dark:group-hover:text-white w-5 h-5" />
					</div>
					<span className="text-left">
						<div className="text-base font-semibold tracking-wide text-gray-900 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">安卓版下载</div>
						<div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">Android</div>
					</span>
				</a>

				<a
					href={storeLinks.google2}
					target="_blank"
					rel="noopener noreferrer"
					className="group w-full md:w-auto flex items-center gap-3 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2.5 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/[0.08] hover:border-gray-400 dark:hover:border-white/20 shadow-sm"
				>
					<div className="flex items-center justify-center w-7 h-7">
						<FaGooglePlay className="text-gray-600 dark:text-gray-300 transition-transform duration-300 group-hover:scale-110 group-hover:text-gray-800 dark:group-hover:text-white w-5 h-5" />
					</div>
					<span className="text-left">
						<div className="text-base font-semibold tracking-wide text-gray-900 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">安卓版备用下载</div>
						<div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">Android</div>
					</span>
				</a>
			</div>
		</div>
	</div>
);

export default memo(AppHero);
