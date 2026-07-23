import { IconTrash } from "@tabler/icons-react";
import { useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { QUOTE_CATEGORIES } from "@/data/quotes";
import { useSettings } from "@/providers/settings-provider";

const QuotesSettings = () => {
	const {
		settings: {
			widgets: { quotes },
		},
		setSettings,
	} = useSettings();

	const handleSettingsChange = useCallback(
		(key: string, value: unknown) => {
			setSettings((prevSettings) => ({
				...prevSettings,
				widgets: {
					...prevSettings.widgets,
					quotes: {
						...prevSettings.widgets.quotes,
						[key]: value,
					},
				},
			}));
		},
		[setSettings],
	);

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex flex-col gap-3">
				<div className="space-y-0.5 flex items-center justify-between">
					<Label className="text-base">Categories</Label>
					<button
						aria-label="Clear quote categories"
						disabled={quotes.categories.length === 0}
						type="button"
						onClick={() => handleSettingsChange("categories", [])}
						className="disabled:opacity-60"
					>
						<IconTrash className="w-4 h-4" />
					</button>
				</div>
				<div className="grid grid-cols-2 gap-4">
					{QUOTE_CATEGORIES.map(({ name, slug }) => (
						<div
							key={slug}
							className="flex items-center space-x-2 text-muted-foreground"
						>
							<Checkbox
								id={slug}
								checked={quotes.categories.includes(slug)}
								onCheckedChange={() => {
									const newCategories = quotes.categories.includes(slug)
										? quotes.categories.filter((category) => category !== slug)
										: [...quotes.categories, slug];

									handleSettingsChange("categories", newCategories);
								}}
							/>
							<Label htmlFor={slug}>{name}</Label>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default QuotesSettings;
