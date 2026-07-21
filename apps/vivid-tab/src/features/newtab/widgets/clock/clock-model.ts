import {
	format12h,
	format12hWithSeconds,
	format24h,
	format24hWithSeconds,
} from "@/lib/date-fns";

interface ClockSettings {
	showSeconds?: boolean;
	timeFormat?: "12h" | "24h";
}

const formatClockTime = (date: Date, settings?: ClockSettings): string => {
	if (settings?.timeFormat === "12h") {
		return settings.showSeconds ? format12hWithSeconds(date) : format12h(date);
	}

	if (settings?.timeFormat === "24h") {
		return settings.showSeconds ? format24hWithSeconds(date) : format24h(date);
	}

	return "00:00";
};

/** Milliseconds until the next visible clock unit changes. */
const getClockTickDelay = (date: Date, showSeconds = false): number => {
	if (showSeconds) return 1000 - date.getMilliseconds();

	return (60 - date.getSeconds()) * 1000 - date.getMilliseconds();
};

export type { ClockSettings };
export { formatClockTime, getClockTickDelay };
