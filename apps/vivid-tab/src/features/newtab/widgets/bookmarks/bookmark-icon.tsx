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
				"relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/80 text-sm font-medium text-muted-foreground in-data-[visual-effect=translucent]:bg-muted/60",
				className,
			)}
		>
			<span>{getBookmarkInitials(title)}</span>
			{showImage && (
				<img
					alt=""
					className="absolute inset-0 size-full object-contain object-center"
					decoding="async"
					fetchPriority="low"
					loading="lazy"
					onError={() => setFailedSource(src ?? undefined)}
					src={src ?? undefined}
				/>
			)}
		</div>
	);
};

export { BookmarkIcon };
