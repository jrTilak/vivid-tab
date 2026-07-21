import { IconRefresh } from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_SEARCH_TERMS } from "@/constants/wallpapers";
import { cn } from "@/lib/cn";
import { wallpaper } from "@/lib/wallpapers/service";
import { useSettings } from "@/providers/settings-provider";
import { SettingsPage, SettingsRow, SettingsSection } from "../../settings-ui";
import ImageCard from "./components/image-card";
import UploadButton from "./components/upload-button";
import {
	deleteStoredWallpaper,
	storeLocalWallpaper,
} from "./wallpaper-storage";

export default function WallpaperSettings() {
	const {
		settings: {
			appearance: {
				wallpapers: { selectedImageId, images, onlineImages },
			},
		},
		setSettings,
	} = useSettings();
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleImageSelect = useCallback(
		(id: string | null) => {
			setSettings((prev) => ({
				...prev,
				appearance: {
					...prev.appearance,
					wallpapers: {
						...prev.appearance.wallpapers,
						selectedImageId: id,
					},
				},
			}));
		},
		[setSettings],
	);

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
							images: [...prev.appearance.wallpapers.images, imageId],
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

						{[null, ...images].map((image) => (
							<ImageCard
								imageId={image}
								isSelected={image === selectedImageId}
								key={image ?? "default-wallpaper"}
								onDelete={
									image === null
										? undefined
										: () => void handleImageDelete(image)
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
