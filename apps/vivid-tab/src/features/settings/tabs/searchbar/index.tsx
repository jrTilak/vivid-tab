import { Switch } from "@/components/ui/switch";
import { supportsRemoteSearchSuggestions } from "@/lib/search-suggestions";
import { useSettings } from "@/providers/settings-provider";
import { SettingsPage, SettingsRow, SettingsSection } from "../../settings-ui";

const SearchbarSettings = () => {
	const suggestionsSupported = supportsRemoteSearchSuggestions(
		process.env.PLASMO_PUBLIC_BROWSER_NAME,
	);
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
					description={
						suggestionsSupported
							? "Show suggestions while entering a search or bang query."
							: "Unavailable in Firefox to avoid transmitting text while you type."
					}
					label="Search suggestions"
				>
					<Switch
						checked={suggestionsSupported && searchbar.searchSuggestions}
						disabled={!suggestionsSupported}
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
