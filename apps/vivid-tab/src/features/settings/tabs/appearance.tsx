import { useCallback } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/providers/settings-provider";
import { type Theme, useTheme } from "@/providers/theme-provider";
import type { Settings } from "@/zod/settings";
import {
	RADIUS_OPTIONS,
	THEME_OPTIONS,
	VISUAL_EFFECT_OPTIONS,
} from "../settings-options";
import { SettingsPage, SettingsRow, SettingsSection } from "../settings-ui";

type Appearance = Settings["appearance"];

const AppearanceSettings = () => {
	const {
		settings: { appearance },
		setSettings,
	} = useSettings();
	const { setTheme, theme } = useTheme();

	const updateAppearance = useCallback(
		<Key extends keyof Appearance>(key: Key, value: Appearance[Key]) => {
			setSettings((current) => ({
				...current,
				appearance: {
					...current.appearance,
					[key]: value,
				},
			}));
		},
		[setSettings],
	);

	return (
		<SettingsPage>
			<SettingsSection
				description="Control the overall look of Vivid Tab."
				title="Interface"
			>
				<SettingsRow controlId="settings-theme" label="Theme">
					<Select
						value={theme}
						onValueChange={(value) => setTheme(value as Theme)}
					>
						<SelectTrigger className="w-48" id="settings-theme">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{THEME_OPTIONS.map(({ label, value }) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</SettingsRow>

				<SettingsRow
					controlId="settings-radius"
					description="Adjust corner rounding across the interface."
					label="Corner radius"
				>
					<Select
						value={appearance.radius}
						onValueChange={(value) =>
							updateAppearance("radius", value as Appearance["radius"])
						}
					>
						<SelectTrigger className="w-48" id="settings-radius">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{RADIUS_OPTIONS.map(({ label, value }) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</SettingsRow>

				<SettingsRow
					controlId="settings-visual-effect"
					description="Use solid surfaces or let the wallpaper show through."
					label="Visual effect"
				>
					<Select
						value={appearance.visualEffect}
						onValueChange={(value) =>
							updateAppearance(
								"visualEffect",
								value as Appearance["visualEffect"],
							)
						}
					>
						<SelectTrigger className="w-48" id="settings-visual-effect">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{VISUAL_EFFECT_OPTIONS.map(({ label, value }) => (
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

export default AppearanceSettings;
