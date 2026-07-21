import * as z from "zod/mini";

const WeatherDataSchema = z.object({
	condition: z.object({
		icon: z.string(),
		text: z.string(),
	}),
	location: z.string(),
	temp: z.object({
		celsius: z.number(),
		fahrenheit: z.number(),
	}),
});

const CachedWeatherDataSchema = z.extend(WeatherDataSchema, {
	expires: z.number(),
});

const IpLocationSchema = z.object({
	latitude: z.number(),
	longitude: z.number(),
});

const WeatherApiResponseSchema = z.object({
	current: z.object({
		condition: z.object({
			icon: z.string(),
			text: z.string(),
		}),
		temp_c: z.number(),
		temp_f: z.number(),
	}),
	location: z.object({
		country: z.string(),
		name: z.string(),
	}),
});

export type WeatherData = z.infer<typeof WeatherDataSchema>;
export type CachedWeatherData = z.infer<typeof CachedWeatherDataSchema>;
export type WeatherPosition = {
	lat: number;
	lon: number;
};
export type TemperatureUnit = "celsius" | "fahrenheit";

export const WEATHER_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

/** Parses persisted weather without trusting JSON or extension storage values. */
export const parseCachedWeather = (
	storedValue: unknown,
): CachedWeatherData | null => {
	let candidate = storedValue;

	if (typeof storedValue === "string") {
		try {
			candidate = JSON.parse(storedValue) as unknown;
		} catch {
			return null;
		}
	}

	const parsed = z.safeParse(CachedWeatherDataSchema, candidate);
	return parsed.success ? parsed.data : null;
};

export const isWeatherCacheValid = (
	cachedData: CachedWeatherData,
	now = Date.now(),
) => cachedData.expires > now;

export const createCachedWeather = (
	weatherData: WeatherData,
	now = Date.now(),
): CachedWeatherData => ({
	...weatherData,
	expires: now + WEATHER_CACHE_TTL_MS,
});

export const parseIpPosition = (response: unknown): WeatherPosition => {
	const data = z.parse(IpLocationSchema, response);

	return {
		lat: data.latitude,
		lon: data.longitude,
	};
};

export const parseWeatherApiResponse = (response: unknown): WeatherData => {
	const data = z.parse(WeatherApiResponseSchema, response);

	return {
		condition: data.current.condition,
		location: `${data.location.name}, ${data.location.country}`,
		temp: {
			celsius: data.current.temp_c,
			fahrenheit: data.current.temp_f,
		},
	};
};

export const formatWeatherTemperature = (
	weatherData: WeatherData,
	unit: TemperatureUnit,
) =>
	unit === "celsius"
		? `${weatherData.temp.celsius}°C`
		: `${weatherData.temp.fahrenheit}°F`;

/** Normalizes protocol-relative WeatherAPI icons and rejects unsafe protocols. */
export const getWeatherIconUrl = (icon: string): string | null => {
	const value = icon.trim();
	if (!value) return null;

	try {
		const normalized = value.startsWith("//") ? `https:${value}` : value;
		const url = new URL(normalized, "https://cdn.weatherapi.com");

		if (url.protocol === "http:") url.protocol = "https:";
		return url.protocol === "https:" ? url.toString() : null;
	} catch {
		return null;
	}
};
