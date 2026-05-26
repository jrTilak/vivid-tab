import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
	format12h,
	format12hWithSeconds,
	format24h,
	format24hWithSeconds,
	formatDayDate,
} from "@/lib/date-fns";
import { useSettings } from "@/providers/settings-provider";

interface TimerSettings {
	showSeconds?: boolean;
	timeFormat?: "12h" | "24h";
}

const Clock = () => {
	const {
		settings: { timer },
	} = useSettings();
	const [time, setTime] = useState<Date>(new Date());

	useEffect(() => {
		const intervalId: NodeJS.Timeout = setInterval(
			() => setTime(new Date()),
			1000,
		);
		return () => clearInterval(intervalId);
	}, []);

	const formatTime = (date: Date, timer?: TimerSettings): string => {
		if (!timer) return "00:00";
		if (timer.timeFormat === "12h" && timer.showSeconds)
			return format12hWithSeconds(date);
		if (timer.timeFormat === "24h" && timer.showSeconds)
			return format24hWithSeconds(date);
		if (timer.timeFormat === "12h") return format12h(date);
		if (timer.timeFormat === "24h") return format24h(date);
		return "00:00";
	};

	return (
		<Card className="p-6">
			<div className="text-5xl font-light">{formatTime(time, timer)}</div>
			<div className="mt-1 text-sm">{formatDayDate(time)}</div>
		</Card>
	);
};

export { Clock };
