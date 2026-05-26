import { useCallback } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/providers/settings-provider";
import type { Settings } from "@/zod/settings";

type TemperatureUnit = Settings["temperature"]["unit"];

const TemperatureSetting = () => {
	const {
		settings: { temperature },
		setSettings,
	} = useSettings();

	const handleSettingsChange = useCallback(
		(key: string, value: unknown) => {
			setSettings((prevSettings) => ({
				...prevSettings,
				temperature: {
					...prevSettings.temperature,
					[key]: value,
				},
			}));
		},
		[setSettings],
	);

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<span className="text-sm font-medium">Temperature unit</span>
				</div>
				<Select
					value={temperature.unit}
					onValueChange={(value) =>
						handleSettingsChange("unit", value as TemperatureUnit)
					}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select temperature unit" />
					</SelectTrigger>
					<SelectContent>
						{(
							[
								{
									label: "Celsius",
									value: "celsius",
								},
								{
									label: "Fahrenheit",
									value: "fahrenheit",
								},
							] as const
						).map(({ label, value }) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};

export default TemperatureSetting;
