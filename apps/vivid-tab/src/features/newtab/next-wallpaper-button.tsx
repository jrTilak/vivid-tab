import { IconPlayerSkipForward } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useNextWallpaper } from "@/hooks/use-next-wallpaper";

export const NextWallpaperButton = () => {
	const { nextWallpaper, hasWallpapers } = useNextWallpaper();

	if (!hasWallpapers) return null;

	return (
		<Button
			aria-label="Next wallpaper"
			className="fixed right-6 bottom-6 z-40 text-foreground shadow-lg"
			onClick={nextWallpaper}
			size="icon"
			title="Next wallpaper"
			type="button"
			variant="secondary"
		>
			<IconPlayerSkipForward className="size-5" />
		</Button>
	);
};
