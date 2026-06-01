import { siteConfig } from "config";
import { memo } from "react";
import { FiFileText, FiShield } from "react-icons/fi";
import ThemeToggle from "../ui/ThemeToggle";

const Footer = () => {
	return (
		<footer className="py-8 border-t border-neutral-200/70 dark:border-neutral-700/70 bg-neutral-50/50 dark:bg-black/50 backdrop-blur-sm transition-all duration-300">
			<div className="container mx-auto px-4">
				<div className="flex flex-col gap-8">
					<div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-8">
						<div className="flex flex-col items-center md:items-start gap-3 max-w-lg text-center md:text-left">
							<div className="flex items-center gap-2">
								<img src="/favicon-512.svg" alt="Logo" className="w-7 h-7 rounded-md shadow-sm" />
								<span className="text-xl font-semibold text-neutral-800 dark:text-white">
									{siteConfig.title}
								</span>
							</div>
							<p className="text-base text-neutral-600 dark:text-neutral-400">
								{siteConfig.description}
							</p>
						</div>
						<div className="flex flex-col items-center gap-2">
							<img
								src="/media/公众号.jpg"
								alt="向北App 微信公众号二维码"
								width={80}
								height={80}
								className="rounded-lg border border-neutral-200/50 dark:border-white/10 bg-white p-1 shadow-sm"
								loading="lazy"
								decoding="async"
							/>
							<div className="text-xs text-neutral-500 dark:text-neutral-400">
								扫码关注「大鹅」公众号
							</div>
						</div>
					</div>

					<div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4 pt-6 border-t border-neutral-200/30 dark:border-neutral-800/30">
						<div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
							<span>
								向北App &copy; {new Date().getFullYear()} All rights reserved.
							</span>
							<div className="flex items-center gap-3">
								{siteConfig.socialLinks.map((link) => (
									<a
										key={link.label}
										href={link.url}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors border border-neutral-200/50 dark:border-white/5"
										aria-label={link.label}
										title={link.label}
									>
										<link.icon className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
									</a>
								))}
							</div>
						</div>

						<div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2">
							{[
								{ href: "/privacy", icon: FiShield, text: "Privacy" },
								{ href: "/terms", icon: FiFileText, text: "Terms" },
							].map(({ href, icon: Icon, text }) => (
								<a
									key={text}
									href={href}
									className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors text-sm"
								>
									<Icon className="w-4 h-4" />
									<span>{text}</span>
								</a>
							))}
							<ThemeToggle />
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default memo(Footer);
