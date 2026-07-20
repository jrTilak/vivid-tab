import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetchWeather } from "@/hooks/use-fetch-weather";
import { useSettings } from "@/providers/settings-provider";
import { formatWeatherTemperature, getWeatherIconUrl } from "./weather-model";

const Weather = () => {
	const { isLoading, error, weatherData } = useFetchWeather();
	const {
		settings: {
			widgets: { temperature },
		},
	} = useSettings();

	if (error.err) return null;

	if (isLoading) {
		return <Skeleton className="h-24" />;
	}

	if (!weatherData) return null;

	const iconUrl = getWeatherIconUrl(weatherData.condition.icon);

	return (
		<Card className="p-6">
			<div className="flex space-x-3">
				{iconUrl ? (
					<img
						alt={weatherData.condition.text}
						className="mt-1 size-8"
						decoding="async"
						height={32}
						src={iconUrl}
						width={32}
					/>
				) : null}
				<div>
					<div className="text-2xl">
						{formatWeatherTemperature(weatherData, temperature.unit)}
					</div>
					<div className="text-sm">{weatherData.location}</div>
					<div className="text-xs text-foreground/40 dark:text-muted-foreground">
						{weatherData.condition.text}
					</div>
				</div>
			</div>
		</Card>
	);
};

export { Weather };
