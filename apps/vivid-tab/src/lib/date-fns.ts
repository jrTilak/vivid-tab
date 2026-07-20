const DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];
const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** "eeee dd, MMMM" → e.g. "Monday 26, May" */
export const formatDayDate = (date: Date): string => {
	return `${DAYS[date.getDay()]} ${pad(date.getDate())}, ${MONTHS[date.getMonth()]}`;
};

/** "hh:mm:ss a" → e.g. "09:05:03 AM" */
export const format12hWithSeconds = (date: Date): string => {
	const h = date.getHours();
	return `${pad(h % 12 || 12)}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${h < 12 ? "AM" : "PM"}`;
};

/** "hh:mm a" → e.g. "09:05 AM" */
export const format12h = (date: Date): string => {
	const h = date.getHours();
	return `${pad(h % 12 || 12)}:${pad(date.getMinutes())} ${h < 12 ? "AM" : "PM"}`;
};

/** "HH:mm:ss" → e.g. "21:05:03" */
export const format24hWithSeconds = (date: Date): string => {
	return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

/** "HH:mm" → e.g. "21:05" */
export const format24h = (date: Date): string => {
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
