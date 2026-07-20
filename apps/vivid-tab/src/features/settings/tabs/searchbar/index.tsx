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
import { SEARCH_ACTION_OPTIONS } from "../../settings-options";
import { SettingsPage, SettingsRow, SettingsSection } from "../../settings-ui";

type Searchbar = Settings["widgets"]["searchbar"];

const SearchbarSettings = () => {
	const {
		settings: {
			widgets: { searchbar },
		},
		setSettings,
	} = useSettings();

	const updateSearchbar = useCallback(
		<Key extends keyof Searchbar>(key: Key, value: Searchbar[Key]) => {
			setSettings((current) => ({
				...current,
				widgets: {
					...current.widgets,
					searchbar: {
						...current.widgets.searchbar,
						[key]: value,
					},
				},
			}));
		},
		[setSettings],
	);

	return (
		<SettingsPage>
			<SettingsSection title="Search behavior">
				<SettingsRow controlId="settings-search-action" label="Default action">
					<Select
						value={searchbar.submitDefaultAction}
						onValueChange={(value) =>
							updateSearchbar(
								"submitDefaultAction",
								value as Searchbar["submitDefaultAction"],
							)
						}
					>
						<SelectTrigger className="w-64" id="settings-search-action">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{SEARCH_ACTION_OPTIONS.map(({ label, value }) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</SettingsRow>

				<SettingsRow
					controlId="settings-search-suggestions"
					description="Show suggestions while entering a query."
					label="Search suggestions"
				>
					<Switch
						checked={searchbar.searchSuggestions}
						id="settings-search-suggestions"
						onCheckedChange={(checked) =>
							updateSearchbar("searchSuggestions", checked)
						}
					/>
				</SettingsRow>
			</SettingsSection>
		</SettingsPage>
	);
};

export default SearchbarSettings;
