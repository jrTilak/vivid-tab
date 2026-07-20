import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/providers/settings-provider";
import type { Settings } from "@/zod/settings";
import { TEMPERATURE_UNIT_OPTIONS } from "../settings-options";
import { SettingsPage, SettingsRow, SettingsSection } from "../settings-ui";

type TemperatureUnit = Settings["widgets"]["temperature"]["unit"];

const TemperatureSettings = () => {
	const {
		settings: {
			widgets: { temperature },
		},
		setSettings,
	} = useSettings();

	return (
		<SettingsPage>
			<SettingsSection title="Temperature">
				<SettingsRow controlId="settings-temperature-unit" label="Unit">
					<Select
						value={temperature.unit}
						onValueChange={(value) =>
							setSettings((current) => ({
								...current,
								widgets: {
									...current.widgets,
									temperature: { unit: value as TemperatureUnit },
								},
							}))
						}
					>
						<SelectTrigger className="w-48" id="settings-temperature-unit">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TEMPERATURE_UNIT_OPTIONS.map(({ label, value }) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</SettingsRow>
			</SettingsSection>
		</SettingsPage>
	);
};

export default TemperatureSettings;
