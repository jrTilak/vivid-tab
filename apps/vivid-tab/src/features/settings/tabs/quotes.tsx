import { IconTrash } from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { tryCatchAsync } from "@/lib/try-catch-async";
import { useSettings } from "@/providers/settings-provider";

type CategoriesResponse = {
	_id: string;
	name: string;
	slug: string;
};

const QUOTE_SKELETON_KEYS = [
	"quote-skeleton-1",
	"quote-skeleton-2",
	"quote-skeleton-3",
	"quote-skeleton-4",
	"quote-skeleton-5",
	"quote-skeleton-6",
	"quote-skeleton-7",
	"quote-skeleton-8",
] as const;

const QuotesSettings = () => {
	const {
		settings: {
			widgets: { quotes },
		},
		setSettings,
	} = useSettings();
	const [isLoaded, setIsLoaded] = useState(false);
	const [categories, setCategories] = useState<CategoriesResponse[]>([]);

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

	useAsyncEffect(async () => {
		const [err, data] = await tryCatchAsync(async () => {
			const response = await fetch("https://api.quotable.io/tags");

			return (await response.json()) as CategoriesResponse[];
		});

		if (err || !data) {
			console.error(err);
			setIsLoaded(true);

			return;
		}

		setCategories(data);
		setIsLoaded(true);
	}, []);

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex flex-col gap-3">
				<div className="space-y-0.5 flex items-center justify-between">
					<Label className="text-base">Categories</Label>
					<button
						disabled={quotes.categories.length === 0}
						type="button"
						onClick={() => handleSettingsChange("categories", [])}
						className="disabled:opacity-60"
					>
						<IconTrash className="w-4 h-4" />
					</button>
				</div>
				<div className="grid grid-cols-2 gap-4">
					{isLoaded
						? categories.map(({ name, slug }) => (
								<div
									key={slug}
									className="flex items-center space-x-2 text-muted-foreground"
								>
									<Checkbox
										id={slug}
										checked={quotes.categories.includes(slug)}
										onCheckedChange={() => {
											const newCategories = quotes.categories.includes(slug)
												? quotes.categories.filter(
														(category) => category !== slug,
													)
												: [...quotes.categories, slug];

											handleSettingsChange("categories", newCategories);
										}}
									/>
									<Label htmlFor={slug}>{name}</Label>
								</div>
							))
						: QUOTE_SKELETON_KEYS.map((key) => (
								<Skeleton
									key={key}
									className="h-4 bg-muted-foreground/20 rounded-sm"
								/>
							))}
				</div>
			</div>
		</div>
	);
};

export default QuotesSettings;
