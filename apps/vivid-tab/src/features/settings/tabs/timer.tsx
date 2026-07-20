import { useCallback } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/providers/settings-provider";
import type { Settings } from "@/zod/settings";
import { TIME_FORMAT_OPTIONS } from "../settings-options";
import { SettingsPage, SettingsRow, SettingsSection } from "../settings-ui";

type Timer = Settings["widgets"]["timer"];

const TimerSettings = () => {
	const {
		settings: {
			widgets: { timer },
		},
		setSettings,
	} = useSettings();

	const updateTimer = useCallback(
		<Key extends keyof Timer>(key: Key, value: Timer[Key]) => {
			setSettings((current) => ({
				...current,
				widgets: {
					...current.widgets,
					timer: { ...current.widgets.timer, [key]: value },
				},
			}));
		},
		[setSettings],
	);

	return (
		<SettingsPage>
			<SettingsSection title="Clock">
				<SettingsRow controlId="settings-time-format" label="Time format">
					<Select
						value={timer.timeFormat}
						onValueChange={(value) =>
							updateTimer("timeFormat", value as Timer["timeFormat"])
						}
					>
						<SelectTrigger className="w-48" id="settings-time-format">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TIME_FORMAT_OPTIONS.map(({ label, value }) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</SettingsRow>

				<SettingsRow controlId="settings-show-seconds" label="Show seconds">
					<Switch
						checked={timer.showSeconds}
						id="settings-show-seconds"
						onCheckedChange={(checked) => updateTimer("showSeconds", checked)}
					/>
				</SettingsRow>
			</SettingsSection>
		</SettingsPage>
	);
};

export default TimerSettings;
