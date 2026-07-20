import { IconDownload, IconUpload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/providers/settings-provider";
import { SettingsPage, SettingsRow, SettingsSection } from "../settings-ui";
import {
	exportSettingsFile,
	InvalidSettingsFileError,
	SettingsFileReadError,
	selectSettingsFile,
} from "./settings-file";

const BackupAndExportSettings = () => {
	const { saveSettings, settings } = useSettings();

	const importSettings = async () => {
		try {
			const candidate = await selectSettingsFile();
			if (candidate === undefined) return;

			const imported = await saveSettings(candidate);

			window.alert(
				imported
					? "Settings imported successfully."
					: "Invalid settings. Settings were reset to defaults.",
			);
		} catch (error) {
			if (error instanceof InvalidSettingsFileError) {
				try {
					await saveSettings(null);
					window.alert("Invalid settings. Settings were reset to defaults.");
				} catch (resetError) {
					console.error("Failed to reset invalid settings:", resetError);
					window.alert("The file was invalid and defaults could not be saved.");
				}

				return;
			}

			console.error("Failed to import settings:", error);
			window.alert(
				error instanceof SettingsFileReadError
					? "The selected file could not be read. Settings were not changed."
					: "The imported settings could not be saved.",
			);
		}
	};

	return (
		<SettingsPage>
			<SettingsSection
				description="Move your preferences between browser profiles."
				title="Settings data"
			>
				<SettingsRow label="Import settings">
					<Button
						className="min-w-32"
						onClick={() => void importSettings()}
						variant="outline"
					>
						Import <IconUpload />
					</Button>
				</SettingsRow>

				<SettingsRow label="Export settings">
					<Button
						className="min-w-32"
						onClick={() => exportSettingsFile(settings)}
						variant="outline"
					>
						Export <IconDownload />
					</Button>
				</SettingsRow>
			</SettingsSection>
		</SettingsPage>
	);
};

export default BackupAndExportSettings;
