import type * as React from "react";
import { cn } from "@/lib/cn";

function Link({ className, ...props }: React.ComponentProps<"a">) {
	return (
		<a
			className={cn(
				"underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
				className,
			)}
			data-slot="link"
			{...props}
		/>
	);
}

export { Link };
