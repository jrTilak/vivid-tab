import { useCallback } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/providers/settings-provider";
import type { Settings } from "@/zod/settings";
import { RANDOMIZE_WALLPAPER_OPTIONS } from "../settings-options";
import { SettingsPage, SettingsRow, SettingsSection } from "../settings-ui";

type Background = Settings["appearance"]["background"];

const BackgroundSettings = () => {
	const {
		settings: {
			appearance: { background },
		},
		setSettings,
	} = useSettings();

	const updateBackground = useCallback(
		<Key extends keyof Background>(key: Key, value: Background[Key]) => {
			setSettings((current) => ({
				...current,
				appearance: {
					...current.appearance,
					background: {
						...current.appearance.background,
						[key]: value,
					},
				},
			}));
		},
		[setSettings],
	);

	return (
		<SettingsPage>
			<SettingsSection
				description="Preview changes immediately on the current wallpaper."
				title="Image adjustments"
			>
				<SettingsRow
					controlId="settings-background-blur"
					label={`Blur (${background.blurIntensity}px)`}
				>
					<Slider
						className="w-56"
						id="settings-background-blur"
						max={10}
						min={0}
						onValueChange={([value]) =>
							updateBackground("blurIntensity", value)
						}
						step={1}
						value={[background.blurIntensity]}
					/>
				</SettingsRow>

				<SettingsRow
					controlId="settings-background-brightness"
					label={`Brightness (${background.brightness * 10}%)`}
				>
					<Slider
						className="w-56"
						id="settings-background-brightness"
						max={10}
						min={0}
						onValueChange={([value]) => updateBackground("brightness", value)}
						step={1}
						value={[background.brightness]}
					/>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Rotation">
				<SettingsRow
					controlId="settings-randomize-wallpaper"
					description="Choose when Vivid Tab should select another wallpaper."
					label="Randomize wallpaper"
				>
					<Select
						value={background.randomizeWallpaper}
						onValueChange={(value) =>
							updateBackground(
								"randomizeWallpaper",
								value as Background["randomizeWallpaper"],
							)
						}
					>
						<SelectTrigger className="w-48" id="settings-randomize-wallpaper">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{RANDOMIZE_WALLPAPER_OPTIONS.map(({ label, value }) => (
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

export default BackgroundSettings;
