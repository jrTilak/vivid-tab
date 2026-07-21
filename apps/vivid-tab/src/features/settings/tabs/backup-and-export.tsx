import { IconDownload, IconUpload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/providers/settings-provider";
import { SettingsPage, SettingsRow, SettingsSection } from "../settings-ui";
import {
	exportSettingsFile,
	InvalidSettingsFileError,
	SettingsFileReadError,
	selectSettingsFile,
	validateImportedSettings,
} from "./settings-file";

const BackupAndExportSettings = () => {
	const { saveSettings, settings } = useSettings();

	const importSettings = async () => {
		try {
			const candidate = await selectSettingsFile();
			if (candidate === undefined) return;

			await saveSettings(validateImportedSettings(candidate));
			window.alert("Settings imported successfully.");
		} catch (error) {
			if (error instanceof InvalidSettingsFileError) {
				window.alert(
					"Invalid settings. Your current settings were not changed.",
				);
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
