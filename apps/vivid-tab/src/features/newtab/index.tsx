import { WallpaperBackground } from "@/components/wallpaper-background";
import { cn } from "@/lib/cn";
import { useSettings } from "@/providers/settings-provider";
import {
	getNewtabLayoutType,
	hasLeftLayoutColumn,
	hasRightLayoutColumn,
} from "./newtab-layout";
import { NewtabSearchProvider } from "./newtab-search";
import { NextWallpaperButton } from "./next-wallpaper-button";
import { useXlLayout } from "./use-xl-layout";
import { NewtabWidget } from "./widget-registry";

export default function Homepage() {
	const {
		settings: {
			widgets: { layout },
			general: { bookmarksCanTakeExtraSpaceIfAvailable },
		},
	} = useSettings();
	const layoutType = getNewtabLayoutType(
		layout,
		bookmarksCanTakeExtraSpaceIfAvailable,
	);
	const hasLeftColumn = hasLeftLayoutColumn(layout);
	const hasRightColumn = hasRightLayoutColumn(layout);
	const isXlLayout = useXlLayout();

	return (
		<NewtabSearchProvider>
			<div className="relative min-h-dvh w-full select-none p-6">
				<WallpaperBackground showAttribution />

				<main className="relative mx-auto mt-20 max-w-[1500px]">
					<div className="grid grid-cols-1 gap-x-14 xl:grid-cols-12">
						{isXlLayout && hasLeftColumn && (
							<div className="space-y-6 xl:col-span-3">
								<NewtabWidget id={layout[1]} />
								<NewtabWidget id={layout[2]} />
								<NewtabWidget id={layout[3]} />
							</div>
						)}

						{isXlLayout &&
							layoutType === "small" &&
							!hasLeftColumn &&
							!hasRightColumn && (
								<div className="hidden xl:col-span-3 xl:block" />
							)}
						{isXlLayout && layoutType === "large" && (
							<div className="hidden xl:col-span-1 xl:block" />
						)}

						<div
							className={cn(
								"flex min-w-0 flex-col xl:col-span-6",
								layoutType === "mid" && "xl:col-span-8",
								layoutType === "large" && "xl:col-span-10",
							)}
						>
							{layout[0] && (
								<div className="mx-auto mb-6 flex w-full items-center justify-center">
									<NewtabWidget id={layout[0]} />
								</div>
							)}
							<NewtabWidget id={layout[4]} />
							{layout[8] && (
								<div className="mx-auto mt-6 flex w-full items-center justify-center">
									<NewtabWidget id={layout[8]} />
								</div>
							)}
						</div>

						{isXlLayout && hasRightColumn && (
							<div className="space-y-6 xl:col-span-3">
								<NewtabWidget id={layout[5]} />
								<NewtabWidget id={layout[6]} />
								<NewtabWidget id={layout[7]} />
							</div>
						)}
					</div>
				</main>

				<NextWallpaperButton />
			</div>
		</NewtabSearchProvider>
	);
}
