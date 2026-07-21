import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/providers/settings-provider";
import { SettingsPage, SettingsRow, SettingsSection } from "../../settings-ui";

const SearchbarSettings = () => {
	const {
		settings: {
			widgets: { searchbar },
		},
		setSettings,
	} = useSettings();

	return (
		<SettingsPage>
			<SettingsSection title="Search suggestions">
				<SettingsRow
					controlId="settings-search-suggestions"
					description="Show suggestions while entering a search or bang query."
					label="Search suggestions"
				>
					<Switch
						checked={searchbar.searchSuggestions}
						id="settings-search-suggestions"
						onCheckedChange={(checked) => {
							setSettings((current) => ({
								...current,
								widgets: {
									...current.widgets,
									searchbar: {
										...current.widgets.searchbar,
										searchSuggestions: checked,
									},
								},
							}));
						}}
					/>
				</SettingsRow>
			</SettingsSection>
		</SettingsPage>
	);
};

export default SearchbarSettings;
