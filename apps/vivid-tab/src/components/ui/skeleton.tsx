import { cn } from "@/lib/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn(
				"animate-pulse rounded-md bg-muted in-data-[visual-effect=opaque]:bg-muted in-data-[visual-effect=translucent]:bg-muted/60",
				className,
			)}
			{...props}
		/>
	);
}

export { Skeleton };
