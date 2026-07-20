import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/providers/settings-provider";

const SearchbarSettings = () => {
	const {
		settings: {
			searchbar: { searchSuggestions, submitDefaultAction },
		},
		setSettings,
	} = useSettings();

	const handleSettingsChange = useCallback(
		(key: string, value: unknown) => {
			setSettings((prevSettings) => ({
				...prevSettings,
				searchbar: {
					...prevSettings.searchbar,
					[key]: value,
				},
			}));
		},
		[setSettings],
	);

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<span className="text-sm font-medium">Action on search</span>
				</div>
				<Select
					value={submitDefaultAction}
					onValueChange={(value) =>
						handleSettingsChange("submitDefaultAction", value)
					}
				>
					<SelectTrigger className="w-[280px]">
						<SelectValue placeholder="Select action on search" />
					</SelectTrigger>
					<SelectContent>
						{(
							[
								{
									label: "Default search engine",
									value: "default",
								},
								{
									label: "Ask ChatGPT",
									value: "ask-chatgpt",
								},
								{
									label: "Ask Claude",
									value: "ask-claude",
								},
								{
									label: "Search on YouTube",
									value: "search-on-youtube",
								},
							] as const
						).map(({ label, value }) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label className="text-sm font-medium">Search Suggestions</Label>
				</div>
				<Switch
					checked={searchSuggestions}
					onCheckedChange={(checked) =>
						handleSettingsChange("searchSuggestions", checked)
					}
				/>
			</div>
		</div>
	);
};

export default SearchbarSettings;
