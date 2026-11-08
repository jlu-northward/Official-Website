// Custom Umami events. Links prefer `data-umami-event` attributes so the
// tracker can finish sending before a same-tab navigation; buttons and
// programmatic actions call `track` (the tracker only reads data attributes
// on the exact element clicked, so icons inside a button would miss them).
//
// Never send what the user typed or imported (grades, course names, search
// text): only categories and counts.
export type AnalyticsEvent =
	| "tools-tab"
	| "tools-category"
	| "tools-link"
	| "gpa-import"
	| "gpa-share"
	| "gpa-share-save"
	| "classroom-search"
	| "course-search";

type EventData = Record<string, string | number | boolean>;

declare global {
	interface Window {
		umami?: { track: (event: string, data?: EventData) => unknown };
	}
}

/** Spread onto an `<a>` to track clicks on it. */
export function trackLink(
	event: AnalyticsEvent,
	data: Record<string, string> = {},
): Record<`data-umami-event${string}`, string> {
	const attributes: Record<`data-umami-event${string}`, string> = {
		"data-umami-event": event,
	};
	for (const [key, value] of Object.entries(data))
		attributes[`data-umami-event-${key}`] = value;
	return attributes;
}

// The tracker loads async, so events fired during hydration (e.g. opening
// /tools#gpa) wait for it. Don't stub `window.umami`: the tracker skips
// installing itself when that global already exists.
const pending: [AnalyticsEvent, EventData?][] = [];

function send(event: AnalyticsEvent, data?: EventData) {
	try {
		window.umami?.track(event, data);
	} catch {
		// Analytics must never break the page.
	}
}

function flush() {
	for (const [event, data] of pending.splice(0)) send(event, data);
}

export function track(event: AnalyticsEvent, data?: EventData) {
	if (typeof window === "undefined") return;
	if (window.umami) return send(event, data);
	// Blocked or failed tracker: keep a few, drop the rest.
	if (pending.length >= 20) return;
	pending.push([event, data]);
	if (pending.length === 1)
		document
			.querySelector("script[data-website-id]")
			?.addEventListener("load", flush, { once: true });
}
