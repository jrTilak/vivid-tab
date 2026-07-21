import {
	afterAll,
	beforeEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "@test/jest";
import { LOCAL_STORAGE } from "@/constants/keys";
import { createCachedWeather, type WeatherData } from "./weather-model";
import { isWeatherAbortError, loadWeather } from "./weather-service";

const weather: WeatherData = {
	condition: { icon: "//cdn.weatherapi.com/icon.png", text: "Clear" },
	location: "Kathmandu, Nepal",
	temp: { celsius: 20, fahrenheit: 68 },
};
const weatherApiResponse = {
	current: {
		condition: weather.condition,
		temp_c: weather.temp.celsius,
		temp_f: weather.temp.fahrenheit,
	},
	location: { country: "Nepal", name: "Kathmandu" },
};

const storageGet = mock(async () => ({}));
const storageSet = mock(async (_values: Record<string, unknown>) => undefined);
const getCurrentPosition = mock(
	(success: PositionCallback, _error?: PositionErrorCallback | null) => {
		success({
			coords: { latitude: 27.7, longitude: 85.3 },
		} as GeolocationPosition);
	},
);
const fetchMock = mock(async (input: string | URL | Request) => {
	const url = new URL(String(input));
	const body =
		url.hostname === "ipapi.co"
			? { latitude: 27.7, longitude: 85.3 }
			: weatherApiResponse;

	return new Response(JSON.stringify(body), {
		headers: { "content-type": "application/json" },
		status: 200,
	});
});
const originalApiKey = process.env.PLASMO_PUBLIC_WEATHER_API_KEY;
const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(
	globalThis,
	"navigator",
);

const setNavigator = (geolocation?: Partial<Geolocation>) => {
	Object.defineProperty(globalThis, "navigator", {
		configurable: true,
		value: geolocation ? { geolocation } : {},
	});
};

beforeEach(() => {
	process.env.PLASMO_PUBLIC_WEATHER_API_KEY = "weather-key";
	storageGet.mockReset();
	storageGet.mockResolvedValue({});
	storageSet.mockReset();
	storageSet.mockResolvedValue(undefined);
	getCurrentPosition.mockReset();
	getCurrentPosition.mockImplementation((success) => {
		success({
			coords: { latitude: 27.7, longitude: 85.3 },
		} as GeolocationPosition);
	});
	fetchMock.mockReset();
	fetchMock.mockImplementation(async (input) => {
		const url = new URL(String(input));
		const body =
			url.hostname === "ipapi.co"
				? { latitude: 27.7, longitude: 85.3 }
				: weatherApiResponse;

		return new Response(JSON.stringify(body), {
			headers: { "content-type": "application/json" },
			status: 200,
		});
	});
	globalThis.chrome = {
		storage: { local: { get: storageGet, set: storageSet } },
	} as unknown as typeof chrome;
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	setNavigator({ getCurrentPosition });
});

afterAll(() => {
	process.env.PLASMO_PUBLIC_WEATHER_API_KEY = originalApiKey;
	if (originalNavigatorDescriptor) {
		Object.defineProperty(globalThis, "navigator", originalNavigatorDescriptor);
	} else {
		Reflect.deleteProperty(globalThis, "navigator");
	}
});

describe("weather service cache policy", () => {
	test("uses cached weather while offline even after expiry", async () => {
		const cached = createCachedWeather(weather, 0);
		storageGet.mockResolvedValue({
			[LOCAL_STORAGE.weather]: JSON.stringify(cached),
		});

		expect(
			await loadWeather({
				isOnline: false,
				signal: new AbortController().signal,
			}),
		).toEqual({
			error: { err: false, message: "" },
			weatherData: cached,
		});
		expect(fetchMock).not.toHaveBeenCalled();
		expect(getCurrentPosition).not.toHaveBeenCalled();
	});

	test("reports offline state when there is no valid cache object", async () => {
		storageGet.mockResolvedValue({ [LOCAL_STORAGE.weather]: "invalid" });

		expect(
			await loadWeather({
				isOnline: false,
				signal: new AbortController().signal,
			}),
		).toEqual({
			error: {
				err: true,
				message: "No internet connection and no cached weather data available",
			},
		});
	});

	test("returns a fresh online cache without requesting location", async () => {
		const cached = createCachedWeather(weather, Date.now());
		storageGet.mockResolvedValue({
			[LOCAL_STORAGE.weather]: JSON.stringify(cached),
		});

		expect(
			await loadWeather({
				isOnline: true,
				signal: new AbortController().signal,
			}),
		).toEqual({
			error: { err: false, message: "" },
			weatherData: cached,
		});
		expect(getCurrentPosition).not.toHaveBeenCalled();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe("fresh weather requests", () => {
	test("uses browser position, validates weather, and caches it", async () => {
		const result = await loadWeather({
			isOnline: true,
			signal: new AbortController().signal,
		});

		expect(result).toEqual({
			error: { err: false, message: "" },
			weatherData: weather,
		});
		expect(getCurrentPosition).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const weatherUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
		expect(weatherUrl.hostname).toBe("api.weatherapi.com");
		expect(weatherUrl.searchParams.get("key")).toBe("weather-key");
		expect(weatherUrl.searchParams.get("q")).toBe("27.7,85.3");
		expect(storageSet).toHaveBeenCalledTimes(1);
		const write = storageSet.mock.calls[0]?.[0] as Record<string, string>;
		expect(JSON.parse(write[LOCAL_STORAGE.weather])).toMatchObject(weather);
	});

	test("falls back to IP location when geolocation fails", async () => {
		getCurrentPosition.mockImplementationOnce((_success, error) => {
			error?.({ message: "denied" } as GeolocationPositionError);
		});

		await expect(
			loadWeather({
				isOnline: true,
				signal: new AbortController().signal,
			}),
		).resolves.toEqual({
			error: { err: false, message: "" },
			weatherData: weather,
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(new URL(String(fetchMock.mock.calls[0]?.[0])).hostname).toBe(
			"ipapi.co",
		);
	});

	test("uses IP location when geolocation is unavailable", async () => {
		setNavigator();

		await loadWeather({
			isOnline: true,
			signal: new AbortController().signal,
		});
		expect(getCurrentPosition).not.toHaveBeenCalled();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test("returns a useful error when location cannot be resolved", async () => {
		setNavigator();
		fetchMock.mockResolvedValueOnce(new Response("down", { status: 503 }));

		expect(
			await loadWeather({
				isOnline: true,
				signal: new AbortController().signal,
			}),
		).toEqual({
			error: { err: true, message: "Unable to determine your location" },
		});
	});

	test("falls back to expired cache when refreshing fails", async () => {
		const cached = createCachedWeather(weather, 0);
		storageGet.mockResolvedValue({
			[LOCAL_STORAGE.weather]: JSON.stringify(cached),
		});
		process.env.PLASMO_PUBLIC_WEATHER_API_KEY = "";

		expect(
			await loadWeather({
				isOnline: true,
				signal: new AbortController().signal,
			}),
		).toEqual({
			error: {
				err: false,
				message: "Using cached weather data (unable to fetch latest)",
			},
			weatherData: cached,
		});
	});

	test("does not hide fresh weather when cache persistence fails", async () => {
		storageSet.mockRejectedValueOnce(new Error("quota exceeded"));
		const warn = spyOn(console, "warn").mockImplementation(() => undefined);

		await expect(
			loadWeather({
				isOnline: true,
				signal: new AbortController().signal,
			}),
		).resolves.toEqual({
			error: { err: false, message: "" },
			weatherData: weather,
		});
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});

	test("continues after a cache read failure", async () => {
		storageGet.mockRejectedValueOnce(new Error("storage unavailable"));
		const warn = spyOn(console, "warn").mockImplementation(() => undefined);

		await expect(
			loadWeather({
				isOnline: true,
				signal: new AbortController().signal,
			}),
		).resolves.toHaveProperty("weatherData", weather);
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});
});

describe("weather cancellation", () => {
	test("identifies only AbortError instances", () => {
		const abortError = new Error("cancelled");
		abortError.name = "AbortError";

		expect(isWeatherAbortError(abortError)).toBe(true);
		expect(isWeatherAbortError(new Error("failed"))).toBe(false);
		expect(isWeatherAbortError({ name: "AbortError" })).toBe(false);
	});

	test("rejects a signal aborted before work continues", async () => {
		const controller = new AbortController();
		controller.abort();

		await expect(
			loadWeather({ isOnline: true, signal: controller.signal }),
		).rejects.toHaveProperty("name", "AbortError");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test("cancels a pending geolocation request", async () => {
		getCurrentPosition.mockImplementationOnce(() => undefined);
		const controller = new AbortController();
		const request = loadWeather({ isOnline: true, signal: controller.signal });
		await Promise.resolve();
		controller.abort();

		await expect(request).rejects.toHaveProperty("name", "AbortError");
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
