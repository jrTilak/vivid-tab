import { useState } from "react";
import { cn } from "@/lib/cn";
import { getBookmarkInitials } from "./bookmark-display";

interface BookmarkIconProps {
	className?: string;
	sources?: readonly (string | null | undefined)[];
	title: string;
}

/**
 * Lazily loads the first working source and falls through failed candidates.
 * This lets Firefox try a high-resolution touch icon before the conventional
 * favicon while still ending with a readable initials fallback.
 */
const BookmarkIcon = ({
	className,
	sources = [],
	title,
}: BookmarkIconProps) => {
	const uniqueSources = [...new Set(sources.filter(Boolean) as string[])];
	const sourceKey = uniqueSources.join("\u0000");
	const [failureState, setFailureState] = useState<{
		failedSources: ReadonlySet<string>;
		sourceKey: string;
	}>(() => ({ failedSources: new Set(), sourceKey }));
	const failedSources =
		failureState.sourceKey === sourceKey
			? failureState.failedSources
			: new Set<string>();
	const source = uniqueSources.find(
		(candidate) => !failedSources.has(candidate),
	);

	return (
		<div
			aria-hidden="true"
			className={cn(
				"relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md",
				className,
			)}
		>
			{source ? (
				<img
					alt=""
					className="size-full object-contain object-center"
					decoding="async"
					fetchPriority="low"
					loading="lazy"
					onError={() => {
						setFailureState((current) => {
							const next = new Set(
								current.sourceKey === sourceKey
									? current.failedSources
									: undefined,
							);
							next.add(source);

							return { failedSources: next, sourceKey };
						});
					}}
					src={source}
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
