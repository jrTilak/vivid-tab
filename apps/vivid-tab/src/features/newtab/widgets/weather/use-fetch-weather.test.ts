import { afterEach, describe, expect, jest, mock, test } from "@test/jest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { LOCAL_STORAGE } from "@/constants/keys";
import { useFetchWeather } from "./use-fetch-weather";
import { createCachedWeather } from "./weather-model";
import * as weatherService from "./weather-service";

const originalChromeDescriptor = Object.getOwnPropertyDescriptor(
	globalThis,
	"chrome",
);
const originalFetch = globalThis.fetch;
type FetchImplementation = (
	input: RequestInfo | URL,
	init?: RequestInit,
) => Promise<Response>;

const installFetch = (implementation: FetchImplementation) => {
	const fetchMock = mock(implementation);
	globalThis.fetch = Object.assign(fetchMock, {
		preconnect: originalFetch.preconnect,
	});

	return fetchMock;
};
const originalGeolocationDescriptor = Object.getOwnPropertyDescriptor(
	navigator,
	"geolocation",
);
const originalOnlineDescriptor = Object.getOwnPropertyDescriptor(
	navigator,
	"onLine",
);
const originalWeatherKey = process.env.PLASMO_PUBLIC_WEATHER_API_KEY;

const weather = {
	condition: { icon: "//cdn.weatherapi.com/icon.png", text: "Clear" },
	location: "Kathmandu, Nepal",
	temp: { celsius: 20, fahrenheit: 68 },
};

const setOnline = (online: boolean) => {
	Object.defineProperty(navigator, "onLine", {
		configurable: true,
		value: online,
	});
};

const installWeatherChrome = (cachedValue?: unknown) => {
	const get = mock(async () =>
		cachedValue === undefined ? {} : { [LOCAL_STORAGE.weather]: cachedValue },
	);
	const set = mock(async () => undefined);
	Object.defineProperty(globalThis, "chrome", {
		configurable: true,
		value: { storage: { local: { get, set } } },
		writable: true,
	});

	return { get, set };
};

const installPosition = ({
	error,
	latitude = 27.7,
	longitude = 85.3,
}: {
	error?: GeolocationPositionError;
	latitude?: number;
	longitude?: number;
} = {}) => {
	const getCurrentPosition = mock(
		(success: PositionCallback, failure?: PositionErrorCallback | null) => {
			if (error) {
				failure?.(error);
				return;
			}

			success({ coords: { latitude, longitude } } as GeolocationPosition);
		},
	);
	Object.defineProperty(navigator, "geolocation", {
		configurable: true,
		value: { getCurrentPosition },
	});

	return getCurrentPosition;
};

afterEach(() => {
	cleanup();
	mock.restore();
	globalThis.fetch = originalFetch;
	if (originalChromeDescriptor) {
		Object.defineProperty(globalThis, "chrome", originalChromeDescriptor);
	} else {
		Reflect.deleteProperty(globalThis, "chrome");
	}
	if (originalGeolocationDescriptor) {
		Object.defineProperty(
			navigator,
			"geolocation",
			originalGeolocationDescriptor,
		);
	} else {
		Reflect.deleteProperty(navigator, "geolocation");
	}
	if (originalOnlineDescriptor) {
		Object.defineProperty(navigator, "onLine", originalOnlineDescriptor);
	}
	if (originalWeatherKey === undefined) {
		delete process.env.PLASMO_PUBLIC_WEATHER_API_KEY;
	} else {
		process.env.PLASMO_PUBLIC_WEATHER_API_KEY = originalWeatherKey;
	}
});

describe("useFetchWeather", () => {
	test("returns cached weather while offline", async () => {
		setOnline(false);
		const cached = createCachedWeather(weather, Date.now());
		installWeatherChrome(JSON.stringify(cached));
		const fetchMock = installFetch((_input) =>
			Promise.reject(new Error("should not fetch")),
		);

		const { result } = renderHook(() => useFetchWeather());

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.weatherData).toEqual(cached);
		expect(result.current.error).toEqual({ err: false, message: "" });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test("reports the empty-cache offline case", async () => {
		setOnline(false);
		installWeatherChrome();

		const { result } = renderHook(() => useFetchWeather());

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.weatherData).toBeUndefined();
		expect(result.current.error).toEqual({
			err: true,
			message: "No internet connection and no cached weather data available",
		});
	});

	test("loads fresh weather, passes location, and caches the result", async () => {
		setOnline(true);
		process.env.PLASMO_PUBLIC_WEATHER_API_KEY = "weather-key";
		const { set } = installWeatherChrome();
		const getCurrentPosition = installPosition();
		const fetchMock = installFetch((_input) =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						current: {
							condition: weather.condition,
							temp_c: weather.temp.celsius,
							temp_f: weather.temp.fahrenheit,
						},
						location: { country: "Nepal", name: "Kathmandu" },
					}),
				),
			),
		);

		const { result } = renderHook(() => useFetchWeather());

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.weatherData).toEqual(weather);
		expect(result.current.error.err).toBe(false);
		expect(getCurrentPosition).toHaveBeenCalledTimes(1);
		const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
		expect(requestUrl.searchParams.get("key")).toBe("weather-key");
		expect(requestUrl.searchParams.get("q")).toBe("27.7,85.3");
		expect(set).toHaveBeenCalledTimes(1);
	});

	test("surfaces a network failure when no cached fallback exists", async () => {
		setOnline(true);
		process.env.PLASMO_PUBLIC_WEATHER_API_KEY = "weather-key";
		installWeatherChrome();
		installPosition();
		installFetch((_input) =>
			Promise.reject(new Error("Weather service unavailable")),
		);

		const { result } = renderHook(() => useFetchWeather());

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.weatherData).toBeUndefined();
		expect(result.current.error).toEqual({
			err: true,
			message: "Weather service unavailable",
		});
	});

	test("converts an unexpected service rejection into a stable hook error", async () => {
		setOnline(true);
		installWeatherChrome();
		const unexpectedError = new TypeError("Invalid service state");
		jest
			.spyOn(weatherService, "loadWeather")
			.mockRejectedValue(unexpectedError);
		const consoleError = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);

		const { result } = renderHook(() => useFetchWeather());

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.weatherData).toBeUndefined();
		expect(result.current.error).toEqual({
			err: true,
			message: "An unexpected error occurred while fetching weather data",
		});
		expect(consoleError).toHaveBeenCalledWith(
			"Unexpected weather error:",
			unexpectedError,
		);
	});

	test("silently ignores an abort rejection", async () => {
		setOnline(true);
		installWeatherChrome();
		const abortError = new Error("Cancelled");
		abortError.name = "AbortError";
		jest.spyOn(weatherService, "loadWeather").mockRejectedValue(abortError);
		const consoleError = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);

		const { result } = renderHook(() => useFetchWeather());

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.weatherData).toBeUndefined();
		expect(result.current.error).toEqual({ err: false, message: "" });
		expect(consoleError).not.toHaveBeenCalled();
	});

	test("aborts an in-flight request when the hook unmounts", async () => {
		setOnline(true);
		process.env.PLASMO_PUBLIC_WEATHER_API_KEY = "weather-key";
		installWeatherChrome();
		installPosition();
		let requestSignal: AbortSignal | null | undefined;
		installFetch((_input, init) => {
			requestSignal = init?.signal;
			return new Promise<Response>(() => undefined);
		});
		const { unmount } = renderHook(() => useFetchWeather());
		await waitFor(() => expect(requestSignal).toBeInstanceOf(AbortSignal));

		unmount();

		expect(requestSignal?.aborted).toBe(true);
	});

	test("ignores a weather result that resolves after unmount", async () => {
		setOnline(true);
		let resolveWeather:
			| ((result: weatherService.WeatherLoadResult) => void)
			| undefined;
		const pendingWeather = new Promise<weatherService.WeatherLoadResult>(
			(resolve) => {
				resolveWeather = resolve;
			},
		);
		jest.spyOn(weatherService, "loadWeather").mockReturnValue(pendingWeather);
		const { result, unmount } = renderHook(() => useFetchWeather());
		await waitFor(() =>
			expect(weatherService.loadWeather).toHaveBeenCalledTimes(1),
		);

		unmount();
		await act(async () => {
			resolveWeather?.({
				error: { err: false, message: "" },
				weatherData: weather,
			});
			await pendingWeather;
			await Promise.resolve();
		});

		expect(result.current.weatherData).toBeUndefined();
		expect(result.current.isLoading).toBe(true);
	});

	test("ignores a weather rejection that arrives after unmount", async () => {
		setOnline(true);
		let rejectWeather: ((error: Error) => void) | undefined;
		const pendingWeather = new Promise<weatherService.WeatherLoadResult>(
			(_resolve, reject) => {
				rejectWeather = reject;
			},
		);
		jest.spyOn(weatherService, "loadWeather").mockReturnValue(pendingWeather);
		const consoleError = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const { result, unmount } = renderHook(() => useFetchWeather());
		await waitFor(() =>
			expect(weatherService.loadWeather).toHaveBeenCalledTimes(1),
		);

		unmount();
		await act(async () => {
			rejectWeather?.(new Error("Late weather failure"));
			await pendingWeather.catch(() => undefined);
			await Promise.resolve();
		});

		expect(result.current.error).toEqual({ err: false, message: "" });
		expect(result.current.isLoading).toBe(true);
		expect(consoleError).not.toHaveBeenCalled();
	});
});
