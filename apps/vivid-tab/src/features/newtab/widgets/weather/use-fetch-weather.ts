import { useEffect, useState } from "react";
import { useIsOnline } from "@/hooks/use-is-online";
import type { WeatherData } from "./weather-model";
import { isWeatherAbortError, loadWeather } from "./weather-service";

const INITIAL_ERROR = { err: false, message: "" };

const useFetchWeather = () => {
	const isOnline = useIsOnline();
	const [weatherData, setWeatherData] = useState<WeatherData>();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(INITIAL_ERROR);

	useEffect(() => {
		const controller = new AbortController();

		setIsLoading(true);
		setError(INITIAL_ERROR);

		void loadWeather({ isOnline, signal: controller.signal })
			.then((result) => {
				if (controller.signal.aborted) return;
				setWeatherData(result.weatherData);
				setError(result.error);
			})
			.catch((loadError: unknown) => {
				if (controller.signal.aborted || isWeatherAbortError(loadError)) return;

				console.error("Unexpected weather error:", loadError);
				setWeatherData(undefined);
				setError({
					err: true,
					message: "An unexpected error occurred while fetching weather data",
				});
			})
			.finally(() => {
				if (!controller.signal.aborted) setIsLoading(false);
			});

		return () => controller.abort();
	}, [isOnline]);

	return { error, isLoading, weatherData };
};

export { useFetchWeather };
