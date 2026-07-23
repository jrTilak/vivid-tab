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
		<Card className="p-6 gap-2">
			<div className="text-5xl font-medium">{formatClockTime(time, timer)}</div>
			<div className="text-sm">{formatDayDate(time)}</div>
		</Card>
	);
};

export { Clock };
