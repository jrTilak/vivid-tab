import { Card } from "@/components/ui/card";
import { formatDayDate } from "@/lib/date-fns";
import { useSettings } from "@/providers/settings-provider";
import { formatClockTime } from "./clock-model";
import { useClock } from "./use-clock";

const Clock = () => {
	const {
		settings: {
			widgets: { timer },
		},
	} = useSettings();
	const time = useClock(timer.showSeconds);

	return (
		<Card className="p-6">
			<div className="text-5xl font-light">{formatClockTime(time, timer)}</div>
			<div className="mt-1 text-sm">{formatDayDate(time)}</div>
		</Card>
	);
};

export { Clock };
