import { useEffect, useState } from "react";
import { getClockTickDelay } from "./clock-model";

const useClock = (showSeconds = false): Date => {
	const [time, setTime] = useState(() => new Date());

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout>;

		const scheduleTick = () => {
			const now = new Date();
			timeoutId = setTimeout(
				() => {
					setTime(new Date());
					scheduleTick();
				},
				getClockTickDelay(now, showSeconds),
			);
		};

		scheduleTick();

		return () => clearTimeout(timeoutId);
	}, [showSeconds]);

	return time;
};

export { useClock };
