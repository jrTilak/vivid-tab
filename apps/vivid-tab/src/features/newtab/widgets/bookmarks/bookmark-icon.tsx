import { useState } from "react";
import { cn } from "@/lib/cn";
import { getBookmarkInitials } from "./bookmark-display";

interface BookmarkIconProps {
	className?: string;
	src?: string | null;
	title: string;
}

/** Uses native lazy loading so large bookmark collections do not preload every favicon. */
const BookmarkIcon = ({ className, src, title }: BookmarkIconProps) => {
	const [failedSource, setFailedSource] = useState<string>();
	const showImage = Boolean(src && src !== failedSource);

	return (
		<div
			aria-hidden="true"
			className={cn(
				"relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md",
				className,
			)}
		>
			{showImage ? (
				<img
					alt=""
					className="size-full object-contain object-center"
					decoding="async"
					fetchPriority="low"
					loading="lazy"
					onError={() => setFailedSource(src ?? undefined)}
					src={src ?? undefined}
				/>
			) : (
				<span className="flex size-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground in-data-[visual-effect=opaque]:bg-muted in-data-[visual-effect=translucent]:bg-muted/60">
					{getBookmarkInitials(title)}
				</span>
			)}
		</div>
	);
};

export { BookmarkIcon };
