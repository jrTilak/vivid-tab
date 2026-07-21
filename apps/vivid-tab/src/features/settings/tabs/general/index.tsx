import { IconHistory } from "@tabler/icons-react";
import { useCallback } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFlattenBookmarkFolders } from "@/hooks/use-flatten-bookmark-folders";
import { useSettings } from "@/providers/settings-provider";
import type { Settings } from "@/zod/settings";
import {
	BOOKMARK_LAYOUT_OPTIONS,
	OPEN_URL_OPTIONS,
} from "../../settings-options";
import { SettingsPage, SettingsRow, SettingsSection } from "../../settings-ui";

type General = Settings["general"];

const GeneralSettings = () => {
	const folders = useFlattenBookmarkFolders();
	const {
		settings: { general },
		setSettings,
		resetSettings,
	} = useSettings();

	const updateGeneral = useCallback(
		<Key extends keyof General>(key: Key, value: General[Key]) => {
			setSettings((current) => ({
				...current,
				general: {
					...current.general,
					[key]: value,
				},
			}));
		},
		[setSettings],
	);

	return (
		<SettingsPage>
			<SettingsSection
				description="Choose which browser folder Vivid Tab displays."
				title="Bookmarks"
			>
				<SettingsRow controlId="settings-root-folder" label="Root folder">
					<Select
						disabled={folders.length === 0}
						value={general.rootFolder}
						onValueChange={(value) => updateGeneral("rootFolder", value)}
					>
						<SelectTrigger className="w-64" id="settings-root-folder">
							<SelectValue
								placeholder={
									folders.length === 0
										? "No bookmark folders found"
										: "Select folder"
								}
							/>
						</SelectTrigger>
						<SelectContent>
							{folders.map((folder) => (
								<SelectItem key={folder.id} value={folder.id}>
									<span style={{ paddingLeft: folder.depth * 10 }}>
										{folder.title}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</SettingsRow>

				<SettingsRow controlId="settings-bookmark-layout" label="Layout">
					<Select
						value={general.layout}
						onValueChange={(value) =>
							updateGeneral("layout", value as General["layout"])
						}
					>
						<SelectTrigger className="w-48" id="settings-bookmark-layout">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{BOOKMARK_LAYOUT_OPTIONS.map(({ label, value }) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</SettingsRow>

				<SettingsRow
					controlId="settings-bookmark-extra-space"
					description="Allow bookmarks to use unused widget space."
					label="Use available space"
				>
					<Switch
						checked={general.bookmarksCanTakeExtraSpaceIfAvailable}
						id="settings-bookmark-extra-space"
						onCheckedChange={(checked) =>
							updateGeneral("bookmarksCanTakeExtraSpaceIfAvailable", checked)
						}
					/>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Browsing">
				<SettingsRow controlId="settings-show-history" label="Show history">
					<Switch
						checked={general.showHistory}
						id="settings-show-history"
						onCheckedChange={(checked) => updateGeneral("showHistory", checked)}
					/>
				</SettingsRow>

				<SettingsRow controlId="settings-show-top-sites" label="Show top sites">
					<Switch
						checked={general.showTopSites}
						id="settings-show-top-sites"
						onCheckedChange={(checked) =>
							updateGeneral("showTopSites", checked)
						}
					/>
				</SettingsRow>

				<SettingsRow
					controlId="settings-open-url"
					description="Used by searches, bang shortcuts, bookmarks, and quick actions."
					label="Open links in"
				>
					<Select
						value={general.openUrlIn}
						onValueChange={(value) =>
							updateGeneral("openUrlIn", value as General["openUrlIn"])
						}
					>
						<SelectTrigger className="w-48" id="settings-open-url">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{OPEN_URL_OPTIONS.map(({ label, value }) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Maintenance">
				<SettingsRow
					description="Restore default preferences and clear wallpapers. Notes and todos are kept."
					label="Reset settings"
				>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button className="min-w-32 text-destructive" variant="outline">
								Reset <IconHistory />
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Reset settings?</AlertDialogTitle>
								<AlertDialogDescription>
									This restores default preferences and clears saved wallpapers.
									Your notes and todos will be kept.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => void resetSettings()}
									variant="destructive"
								>
									Reset settings
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</SettingsRow>
			</SettingsSection>
		</SettingsPage>
	);
};

export default GeneralSettings;
