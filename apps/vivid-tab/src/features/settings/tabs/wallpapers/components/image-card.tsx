import { IconTrash } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useImage } from "@/hooks/use-image";

const ImageCard = ({
	imageId,
	isSelected,
	onDelete,
	onSelect,
}: {
	imageId: string | null;
	isSelected: boolean;
	onDelete?: () => void;
	onSelect: () => void;
}) => {
	const imageData = useImage(imageId);

	return (
		<div className="group relative h-48 overflow-hidden rounded-lg bg-muted">
			<button
				aria-label={
					imageId === null ? "Use the default wallpaper" : "Use this wallpaper"
				}
				aria-pressed={isSelected}
				className="size-full overflow-hidden outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				onClick={onSelect}
				type="button"
			>
				<img
					alt=""
					className="size-full object-cover brightness-75 transition-transform group-hover:scale-105"
					decoding="async"
					height={200}
					loading="lazy"
					src={
						imageId === null
							? chrome.runtime.getURL("assets/scene.jpg")
							: (imageData?.thumbnailSrc ?? imageData?.src)
					}
					width={200}
				/>
				{isSelected && (
					<Badge
						className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2"
						variant="secondary"
					>
						Selected
					</Badge>
				)}
			</button>
			{onDelete && (
				<Button
					aria-label="Delete wallpaper"
					className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
					onClick={onDelete}
					size="icon"
					type="button"
					variant="destructive"
				>
					<IconTrash />
				</Button>
			)}
		</div>
	);
};

export default ImageCard;
