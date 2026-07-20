import type { ComponentType } from "react";
import { WallpaperBackground } from "@/components/wallpaper-background";
import { cn } from "@/lib/cn";
import { useWelcomeContext } from "./_context";
import { CreateNewBookmarkFolder } from "./create-new-bookmark-folder";
import { ImportFromBrowserBookmarks } from "./import-from-browser-bookmarks";
import { ImportTab } from "./import-tab";
import type { WelcomeStep } from "./types";
import { WelcomeTab } from "./welcome-tab";

const PANELS: Record<WelcomeStep, ComponentType> = {
	WELCOME: WelcomeTab,
	IMPORT: ImportTab,
	CREATE_NEW_BOOKMARK_FOLDER: CreateNewBookmarkFolder,
	IMPORT_FROM_BROWSER_BOOKMARKS: ImportFromBrowserBookmarks,
};

const Welcome = () => {
	const { currentStep, direction } = useWelcomeContext();
	const ActivePanel = PANELS[currentStep];

	return (
		<main className="relative min-h-dvh w-full overflow-x-hidden">
			<WallpaperBackground />
			<div className="relative z-10 flex min-h-dvh items-center justify-center bg-black/20 p-4 in-data-[visual-effect=opaque]:bg-black/35 in-data-[visual-effect=translucent]:bg-black/20 sm:p-6">
				<div
					key={currentStep}
					className={cn(
						"flex w-full justify-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 motion-safe:ease-out",
						direction === "forward"
							? "motion-safe:slide-in-from-right-8"
							: "motion-safe:slide-in-from-left-8",
					)}
				>
					<ActivePanel />
				</div>
			</div>
		</main>
	);
};

export { Welcome };
