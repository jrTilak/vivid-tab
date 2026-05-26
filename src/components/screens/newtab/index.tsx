import { useEffect, useMemo, useState } from "react";
import { useWallpaper } from "@/hooks/use-wallpaper";
import { cn } from "@/lib/cn";
import type { StoredImage } from "@/lib/wallpapers";
import { useSettings } from "@/providers/settings-provider";
import { NextWallpaperButton } from "./next-wallpaper-button";
import { Bookmarks } from "./widgets/bookmarks";
import { Clock } from "./widgets/clock";
import { Notes } from "./widgets/notes";
import { Quote } from "./widgets/quote";
import { Searchbar } from "./widgets/searchbar";
import { Todos } from "./widgets/todos";
import { Weather } from "./widgets/weather";

type Layout = "small" | "mid" | "large";

export default function Homepage() {
	const [layoutType, setLayoutType] = useState<Layout>("small");
	const [imageLoadError, setImageLoadError] = useState(false);
	const [displayImage, setDisplayImage] = useState<
		Pick<StoredImage, "id" | "src" | "source"> | null
	>(null);
	const {
		settings: {
			layout,
			general: { bookmarksCanTakeExtraSpaceIfAvailable },
			background: backgroundSettings,
		},
	} = useSettings();

	const { imageData, activeImageId } = useWallpaper();

	// biome-ignore lint/correctness/useExhaustiveDependencies :  Reset error state when image changes
	useEffect(() => {
		setImageLoadError(false);
	}, [activeImageId]);

	useEffect(() => {
		if (!activeImageId) {
			setDisplayImage(null);
		}
	}, [activeImageId]);

	useEffect(() => {
		if (!imageData?.src || imageData.id !== activeImageId) {
			return;
		}

		let cancelled = false;
		const img = new Image();

		img.onload = () => {
			if (cancelled) return;

			setImageLoadError(false);
			setDisplayImage({
				id: imageData.id,
				src: imageData.src,
				source: imageData.source,
			});
		};

		img.onerror = () => {
			if (cancelled) return;

			setImageLoadError(true);
		};

		img.src = imageData.src;

		return () => {
			cancelled = true;
		};
	}, [activeImageId, imageData?.id, imageData?.source, imageData?.src]);

	const COMPONENTS = useMemo(() => {
		return {
			searchbar: <Searchbar />,
			clock: <Clock />,
			weather: <Weather />,
			todos: <Todos />,
			bookmarks: <Bookmarks />,
			quotes: <Quote />,
			notes: <Notes />,
		};
	}, []);

	useEffect(() => {
		if (!bookmarksCanTakeExtraSpaceIfAvailable) {
			setLayoutType("small");

			return;
		}

		// case 1: three cols are present
		if (
			(layout[1] || layout[2] || layout[3]) &&
			(layout[5] || layout[6] || layout[7])
		) {
			setLayoutType("small");
		}
		// case 2: only two col is present (left and middle or right and middle)
		else if (
			layout[1] ||
			layout[2] ||
			layout[3] ||
			layout[5] ||
			layout[6] ||
			layout[7]
		) {
			setLayoutType("mid");
		}
		// case 3: only one col is present
		else {
			setLayoutType("large");
		}
	}, [bookmarksCanTakeExtraSpaceIfAvailable, layout]);

	const background = chrome.runtime.getURL("assets/scene.jpg");

	// Determine which background to use
	const backgroundToUse =
		displayImage?.src ?? (imageLoadError || !activeImageId ? background : null);

	return (
		<div className="min-h-screen w-full bg-cover bg-center p-6 relative select-none transition-all">
			<div
				style={{
					backgroundImage: backgroundToUse ? `url(${backgroundToUse})` : "none",
				}}
				className={cn(
					"h-full w-full bg-cover bg-center bg-no-repeat absolute inset-0",
				)}
			/>
			<div
				style={{
					backdropFilter: `blur(${backgroundSettings.blurIntensity}px)`,
					backgroundColor: `rgba(0, 0, 0, ${1 - backgroundSettings.brightness / 10})`,
				}}
				className={cn(`h-full w-full absolute inset-0`)}
			/>

			<div className="mx-auto max-w-[1500px] relative mt-20">
				{/* Tabs */}

				<div className="grid grid-cols-1 xl:grid-cols-12 gap-x-14">
					{/* Left Sidebar */}
					{(layout[1] || layout[2] || layout[3]) && (
						<div className="col-span-3 space-y-6 max-xl:hidden">
							{layout[1] && COMPONENTS[layout[1]]}
							{layout[2] && COMPONENTS[layout[2]]}
							{layout[3] && COMPONENTS[layout[3]]}
						</div>
					)}

					{/* to align to center */}
					{layoutType === "small" &&
						!(layout[1] || layout[2] || layout[3]) &&
						!(layout[5] || layout[6] || layout[7]) && (
							<div className="col-span-3" />
						)}
					{layoutType === "large" && <div className="col-span-1" />}

					<div
						className={cn(
							"flex flex-col col-span-6",
							layoutType === "mid"
								? "col-span-8"
								: layoutType === "large"
									? "col-span-10"
									: "col-span-6",
						)}
					>
						{layout[0] && (
							<div className="mb-6 flex items-center justify-center mx-auto w-full">
								{COMPONENTS[layout[0]]}
							</div>
						)}
						{layout[4] && COMPONENTS[layout[4]]}
						{layout[8] && (
							<div className="mt-6 flex items-center justify-center mx-auto w-full">
								{COMPONENTS[layout[8]]}
							</div>
						)}
					</div>

					{/* Right Sidebar */}
					{(layout[5] || layout[6] || layout[7]) && (
						<div className="col-span-3 space-y-6  max-xl:hidden">
							{layout[5] && COMPONENTS[layout[5]]}
							{layout[6] && COMPONENTS[layout[6]]}
							{layout[7] && COMPONENTS[layout[7]]}
						</div>
					)}
				</div>
			</div>

			{/* Image Credits */}
			{displayImage?.source && displayImage.source !== "local" && (
				<div className="fixed bottom-4 left-4 z-50">
					<div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
						Images powered by {displayImage.source}
					</div>
				</div>
			)}

			<NextWallpaperButton />
		</div>
	);
}
