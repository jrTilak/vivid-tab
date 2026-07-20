import { useEffect, useState } from "react";
import { useWallpaper } from "@/hooks/use-wallpaper";
import { cn } from "@/lib/cn";
import type { StoredImage } from "@/lib/wallpaper-database";
import { useSettings } from "@/providers/settings-provider";

type WallpaperBackgroundProps = {
	className?: string;
	showAttribution?: boolean;
};

type DisplayImage = Pick<StoredImage, "id" | "source" | "src">;

/** Renders the active wallpaper plus the configured brightness and blur layers. */
const WallpaperBackground = ({
	className,
	showAttribution = false,
}: WallpaperBackgroundProps) => {
	const [displayImage, setDisplayImage] = useState<DisplayImage | null>(null);
	const {
		settings: {
			appearance: { background },
		},
	} = useSettings();
	const { activeImageId, imageData } = useWallpaper();

	useEffect(() => {
		if (!activeImageId) {
			setDisplayImage(null);

			return;
		}

		if (!imageData?.src || imageData.id !== activeImageId) return;

		let cancelled = false;
		const image = new Image();

		image.onload = () => {
			if (cancelled) return;

			setDisplayImage({
				id: imageData.id,
				source: imageData.source,
				src: imageData.src,
			});
		};
		image.onerror = () => {
			if (cancelled) return;

			setDisplayImage(null);
		};
		image.src = imageData.src;

		return () => {
			cancelled = true;
		};
	}, [activeImageId, imageData?.id, imageData?.source, imageData?.src]);

	return (
		<div
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute inset-0 overflow-hidden",
				className,
			)}
		>
			<img
				alt=""
				className="size-full object-cover"
				decoding="async"
				draggable={false}
				fetchPriority="high"
				onError={() => setDisplayImage(null)}
				src={
					displayImage?.id === activeImageId
						? displayImage.src
						: chrome.runtime.getURL("assets/scene.jpg")
				}
			/>
			<div
				className="absolute inset-0"
				style={{
					WebkitBackdropFilter: `blur(${Math.max(0, background.blurIntensity)}px)`,
					backdropFilter: `blur(${Math.max(0, background.blurIntensity)}px)`,
					backgroundColor: `rgb(0 0 0 / ${Math.min(
						1,
						Math.max(0, 1 - background.brightness / 10),
					)})`,
				}}
			/>
			{showAttribution &&
				displayImage?.id === activeImageId &&
				displayImage.source === "wallhaven" && (
					<div className="fixed bottom-4 left-4 z-50 rounded-md bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
						Images powered by Wallhaven
					</div>
				)}
		</div>
	);
};

export { WallpaperBackground };
