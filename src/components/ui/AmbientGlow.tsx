import { memo } from "react";

const AmbientGlow = () => {
	return (
		<div
			className="ambient-glow pointer-events-none fixed inset-0 z-0 overflow-hidden"
			aria-hidden="true"
		>
			<div className="absolute left-[-18rem] top-[-18rem] h-[52rem] w-[68rem] rounded-[50%] bg-sky-300/20 blur-[105px] dark:bg-sky-500/[0.09]" />
			<div className="absolute right-[-20rem] top-[18vh] h-[58rem] w-[64rem] rounded-[50%] bg-indigo-300/15 blur-[120px] dark:bg-indigo-500/[0.07]" />
			<div className="absolute bottom-[-26rem] left-[8%] h-[60rem] w-[72rem] rounded-[50%] bg-blue-200/15 blur-[125px] dark:bg-blue-500/[0.055]" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.34),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(245,245,247,0.18))] dark:bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.035),transparent_34%),linear-gradient(to_bottom,rgba(9,9,11,0.16),rgba(9,9,11,0.44))]" />
		</div>
	);
};

export default memo(AmbientGlow);
