import { LOCAL_STORAGE } from "@/constants/keys";
import {
	type CachedWeatherData,
	createCachedWeather,
	isWeatherCacheValid,
	parseCachedWeather,
	parseIpPosition,
	parseWeatherApiResponse,
	type WeatherData,
	type WeatherPosition,
} from "./weather-model";

const IP_LOCATION_URL = "https://ipapi.co/json/";
const WEATHER_API_URL = "https://api.weatherapi.com/v1/current.json";
const GEOLOCATION_TIMEOUT_MS = 10_000;

type WeatherError = {
	err: boolean;
	message: string;
};

export type WeatherLoadResult = {
	error: WeatherError;
	weatherData?: WeatherData;
};

const NO_WEATHER_ERROR: WeatherError = { err: false, message: "" };

const createAbortError = () => {
	const error = new Error("The weather request was cancelled");
	error.name = "AbortError";
	return error;
};

export const isWeatherAbortError = (error: unknown) =>
	error instanceof Error && error.name === "AbortError";

const throwIfAborted = (signal: AbortSignal) => {
	if (signal.aborted) throw createAbortError();
};

const readCachedWeather = async (): Promise<CachedWeatherData | null> => {
	try {
		const data = await chrome.storage.local.get(LOCAL_STORAGE.weather);
		return parseCachedWeather(data[LOCAL_STORAGE.weather]);
	} catch (error) {
		console.warn("Unable to read the cached weather:", error);
		return null;
	}
};

const saveCachedWeather = async (weatherData: WeatherData) => {
	await chrome.storage.local.set({
		[LOCAL_STORAGE.weather]: JSON.stringify(createCachedWeather(weatherData)),
	});
};

const getBrowserPosition = (signal: AbortSignal): Promise<WeatherPosition> =>
	new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(createAbortError());
			return;
		}

		const onAbort = () => reject(createAbortError());
		signal.addEventListener("abort", onAbort, { once: true });

		const finish = (callback: () => void) => {
			signal.removeEventListener("abort", onAbort);
			callback();
		};

		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				finish(() =>
					resolve({
						lat: Number(coords.latitude),
						lon: Number(coords.longitude),
					}),
				);
			},
			(error) => finish(() => reject(error)),
			{
				enableHighAccuracy: false,
				maximumAge: 60 * 60 * 1000,
				timeout: GEOLOCATION_TIMEOUT_MS,
			},
		);
	});

const getIpPosition = async (signal: AbortSignal): Promise<WeatherPosition> => {
	const response = await fetch(IP_LOCATION_URL, { signal });
	if (!response.ok) throw new Error("IP location request failed");

	return parseIpPosition(await response.json());
};

const getUserPosition = async (
	signal: AbortSignal,
): Promise<WeatherPosition> => {
	if ("geolocation" in navigator) {
		try {
			return await getBrowserPosition(signal);
		} catch (error) {
			if (isWeatherAbortError(error)) throw error;
		}
	}

	try {
		return await getIpPosition(signal);
	} catch (error) {
		if (isWeatherAbortError(error)) throw error;
		throw new Error("Unable to determine your location", { cause: error });
	}
};

const fetchFreshWeather = async (
	position: WeatherPosition,
	signal: AbortSignal,
): Promise<WeatherData> => {
	const key = process.env.PLASMO_PUBLIC_WEATHER_API_KEY;
	if (!key) throw new Error("Weather API key is missing");

	const url = new URL(WEATHER_API_URL);
	url.search = new URLSearchParams({
		key,
		q: `${position.lat},${position.lon}`,
	}).toString();

	const response = await fetch(url, { signal });
	if (!response.ok) throw new Error("Failed to fetch weather data");

	return parseWeatherApiResponse(await response.json());
};

const getErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Failed to fetch weather data";

/**
 * Resolves cached or fresh weather while keeping fallback policy out of React.
 * Expired cache is still useful when offline or when refreshing fails.
 */
export const loadWeather = async ({
	isOnline,
	signal,
}: {
	isOnline: boolean;
	signal: AbortSignal;
}): Promise<WeatherLoadResult> => {
	const cachedData = await readCachedWeather();
	throwIfAborted(signal);

	if (!isOnline) {
		return cachedData
			? { error: NO_WEATHER_ERROR, weatherData: cachedData }
			: {
					error: {
						err: true,
						message:
							"No internet connection and no cached weather data available",
					},
				};
	}

	if (cachedData && isWeatherCacheValid(cachedData)) {
		return { error: NO_WEATHER_ERROR, weatherData: cachedData };
	}

	try {
		const position = await getUserPosition(signal);
		const weatherData = await fetchFreshWeather(position, signal);
		throwIfAborted(signal);

		try {
			await saveCachedWeather(weatherData);
		} catch (error) {
			// A cache failure should not hide successfully fetched weather.
			console.warn("Unable to cache the latest weather:", error);
		}

		throwIfAborted(signal);
		return { error: NO_WEATHER_ERROR, weatherData };
	} catch (error) {
		if (isWeatherAbortError(error)) throw error;

		return cachedData
			? {
					error: {
						err: false,
						message: "Using cached weather data (unable to fetch latest)",
					},
					weatherData: cachedData,
				}
			: {
					error: { err: true, message: getErrorMessage(error) },
				};
	}
};
