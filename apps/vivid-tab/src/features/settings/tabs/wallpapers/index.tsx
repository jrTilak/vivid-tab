import { IconRefresh } from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_SEARCH_TERMS } from "@/constants/wallpapers";
import { cn } from "@/lib/cn";
import { orderWallpaperIds } from "@/lib/wallpapers/order";
import { wallpaper } from "@/lib/wallpapers/service";
import { useSettings } from "@/providers/settings-provider";
import { SettingsPage, SettingsRow, SettingsSection } from "../../settings-ui";
import ImageCard from "./components/image-card";
import UploadButton from "./components/upload-button";
import WallpaperSelectionDialog from "./components/wallpaper-selection-dialog";
import {
	deleteStoredWallpaper,
	storeLocalWallpaper,
} from "./wallpaper-storage";

export default function WallpaperSettings() {
	const {
		settings: {
			appearance: {
				background: { randomizeWallpaper },
				wallpapers: {
					bookmarkedImageIds,
					selectedImageId,
					images,
					onlineImages,
				},
			},
		},
		setSettings,
	} = useSettings();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [pendingSelection, setPendingSelection] = useState<{
		imageId: string | null;
	} | null>(null);
	const orderedImageIds = orderWallpaperIds(images, bookmarkedImageIds);

	const commitImageSelection = useCallback(
		(id: string | null) => {
			setSettings((prev) => ({
				...prev,
				appearance: {
					...prev.appearance,
					background: {
						...prev.appearance.background,
						randomizeWallpaper: "off",
					},
					wallpapers: {
						...prev.appearance.wallpapers,
						selectedImageId: id,
					},
				},
			}));
		},
		[setSettings],
	);

	const handleImageSelect = useCallback(
		(imageId: string | null) => {
			if (randomizeWallpaper === "off") {
				commitImageSelection(imageId);
				return;
			}

			setPendingSelection({ imageId });
		},
		[commitImageSelection, randomizeWallpaper],
	);

	const handlePendingSelectionConfirm = useCallback(() => {
		if (!pendingSelection) return;

		commitImageSelection(pendingSelection.imageId);
		setPendingSelection(null);
	}, [commitImageSelection, pendingSelection]);

	const handleImageUpload = useCallback(
		async (file: File) => {
			try {
				const imageId = await storeLocalWallpaper(file);
				setSettings((prev) => ({
					...prev,
					appearance: {
						...prev.appearance,
						wallpapers: {
							...prev.appearance.wallpapers,
							images: [
								imageId,
								...prev.appearance.wallpapers.images.filter(
									(id) => id !== imageId,
								),
							],
						},
					},
				}));
			} catch (error) {
				console.error("Failed to store the uploaded wallpaper:", error);
			}
		},
		[setSettings],
	);

	const handleImageDelete = useCallback(
		async (imageId: string) => {
			try {
				await deleteStoredWallpaper(imageId);
				setSettings((prev) => ({
					...prev,
					appearance: {
						...prev.appearance,
						wallpapers: {
							...prev.appearance.wallpapers,
							bookmarkedImageIds:
								prev.appearance.wallpapers.bookmarkedImageIds.filter(
									(id) => id !== imageId,
								),
							images: prev.appearance.wallpapers.images.filter(
								(id) => id !== imageId,
							),
							selectedImageId:
								prev.appearance.wallpapers.selectedImageId === imageId
									? null
									: prev.appearance.wallpapers.selectedImageId,
						},
					},
				}));
			} catch (error) {
				console.error("Failed to delete the wallpaper:", error);
			}
		},
		[setSettings],
	);

	const handleBookmarkChange = useCallback(
		(imageId: string) => {
			setSettings((prev) => {
				const bookmarks = prev.appearance.wallpapers.bookmarkedImageIds;
				const isBookmarked = bookmarks.includes(imageId);

				return {
					...prev,
					appearance: {
						...prev.appearance,
						wallpapers: {
							...prev.appearance.wallpapers,
							bookmarkedImageIds: isBookmarked
								? bookmarks.filter((id) => id !== imageId)
								: [...bookmarks, imageId],
						},
					},
				};
			});
		},
		[setSettings],
	);

	const handleOnlineImagesChange = useCallback(
		(key: "enabled" | "keywords", value: boolean | string) => {
			setSettings((prev) => ({
				...prev,
				appearance: {
					...prev.appearance,
					wallpapers: {
						...prev.appearance.wallpapers,
						onlineImages: {
							...prev.appearance.wallpapers.onlineImages,
							[key]: value,
						},
					},
				},
			}));
		},
		[setSettings],
	);

	const forceRefreshImages = useCallback(async () => {
		if (!onlineImages.enabled || isRefreshing) {
			return;
		}

		setIsRefreshing(true);

		try {
			await wallpaper.fetchOnlineImages(true);
		} catch (error) {
			console.error("Error in forceRefreshImages:", error);
		} finally {
			setIsRefreshing(false);
		}
	}, [onlineImages.enabled, isRefreshing]);

	return (
		<SettingsPage>
			<WallpaperSelectionDialog
				onConfirm={handlePendingSelectionConfirm}
				onOpenChange={(open) => {
					if (!open) setPendingSelection(null);
				}}
				open={pendingSelection !== null}
			/>
			<SettingsSection
				description="Fetch fresh, safe-only wallpaper choices from Wallhaven."
				title="Online wallpapers"
			>
				<SettingsRow
					controlId="online-images-toggle"
					description="Automatically fetch new wallpaper choices from Wallhaven."
					label="Get images from online"
				>
					<Switch
						checked={onlineImages.enabled}
						onCheckedChange={(checked) =>
							handleOnlineImagesChange("enabled", checked)
						}
						id="online-images-toggle"
					/>
				</SettingsRow>

				<SettingsRow
					controlId="keywords-input"
					description="Separate multiple search terms with commas."
					label="Image keywords"
				>
					<Input
						className="w-72 max-w-[40vw]"
						disabled={!onlineImages.enabled}
						id="keywords-input"
						onChange={(e) =>
							handleOnlineImagesChange("keywords", e.target.value)
						}
						placeholder={DEFAULT_SEARCH_TERMS.join(", ")}
						value={onlineImages.keywords}
					/>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection
				description="Choose the bundled image or one of your saved wallpapers."
				title="Wallpaper gallery"
			>
				<div className="space-y-4 p-4">
					<div className="flex items-center justify-end">
						<Button
							className="gap-2"
							disabled={!onlineImages.enabled || isRefreshing}
							onClick={forceRefreshImages}
							variant="outline"
						>
							<IconRefresh
								className={cn("size-4", isRefreshing && "animate-spin")}
							/>
							{isRefreshing ? "Refreshing..." : "Reload"}
						</Button>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<UploadButton onUpload={(file) => void handleImageUpload(file)} />

						{[null, ...orderedImageIds].map((image) => (
							<ImageCard
								imageId={image}
								isBookmarked={
									image !== null && bookmarkedImageIds.includes(image)
								}
								isSelected={image === selectedImageId}
								key={image ?? "default-wallpaper"}
								onDelete={
									image === null
										? undefined
										: () => void handleImageDelete(image)
								}
								onBookmarkChange={
									image === null ? undefined : () => handleBookmarkChange(image)
								}
								onSelect={() => handleImageSelect(image)}
							/>
						))}
					</div>
				</div>
			</SettingsSection>
		</SettingsPage>
	);
}
