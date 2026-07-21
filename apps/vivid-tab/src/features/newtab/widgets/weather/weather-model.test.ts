import { describe, expect, test } from "@test/jest";
import {
	createCachedWeather,
	formatWeatherTemperature,
	getWeatherIconUrl,
	isWeatherCacheValid,
	parseCachedWeather,
	parseIpPosition,
	parseWeatherApiResponse,
	WEATHER_CACHE_TTL_MS,
} from "./weather-model";

const weather = {
	condition: { icon: "//cdn.weatherapi.com/icon.png", text: "Clear" },
	location: "Kathmandu, Nepal",
	temp: { celsius: 20, fahrenheit: 68 },
};

describe("weather model", () => {
	test("validates stored cache values and rejects malformed JSON", () => {
		const cached = createCachedWeather(weather, 1_000);

		expect(parseCachedWeather(JSON.stringify(cached))).toEqual(cached);
		expect(parseCachedWeather(cached)).toEqual(cached);
		expect(parseCachedWeather("not json")).toBeNull();
		expect(parseCachedWeather({ ...cached, expires: "later" })).toBeNull();
	});

	test("creates a two-hour cache and expires at the exact boundary", () => {
		const cached = createCachedWeather(weather, 1_000);

		expect(cached.expires).toBe(1_000 + WEATHER_CACHE_TTL_MS);
		expect(isWeatherCacheValid(cached, cached.expires - 1)).toBe(true);
		expect(isWeatherCacheValid(cached, cached.expires)).toBe(false);
	});

	test("validates and maps remote location and weather responses", () => {
		expect(parseIpPosition({ latitude: 27.7, longitude: 85.3 })).toEqual({
			lat: 27.7,
			lon: 85.3,
		});
		expect(() => parseIpPosition({ latitude: "27.7" })).toThrow();

		expect(
			parseWeatherApiResponse({
				current: {
					condition: weather.condition,
					temp_c: 20,
					temp_f: 68,
				},
				location: { country: "Nepal", name: "Kathmandu" },
			}),
		).toEqual(weather);
	});

	test("formats units and normalizes only safe icon URLs", () => {
		expect(formatWeatherTemperature(weather, "celsius")).toBe("20°C");
		expect(formatWeatherTemperature(weather, "fahrenheit")).toBe("68°F");
		expect(getWeatherIconUrl(weather.condition.icon)).toBe(
			"https://cdn.weatherapi.com/icon.png",
		);
		expect(getWeatherIconUrl("http://cdn.weatherapi.com/icon.png")).toBe(
			"https://cdn.weatherapi.com/icon.png",
		);
		expect(getWeatherIconUrl("javascript:alert(1)")).toBeNull();
		expect(getWeatherIconUrl("   ")).toBeNull();
		expect(getWeatherIconUrl("http://[")).toBeNull();
	});
});
