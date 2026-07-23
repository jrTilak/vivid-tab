import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"group/input-group flex h-9 w-full min-w-0 items-center rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20 in-data-[visual-effect=opaque]:bg-background in-data-[visual-effect=translucent]:bg-background/30 dark:border-input dark:has-[[aria-invalid=true]]:border-destructive/50 dark:has-[[aria-invalid=true]]:ring-destructive/40 dark:in-data-[visual-effect=opaque]:bg-background dark:in-data-[visual-effect=translucent]:bg-input/30",
				className,
			)}
			data-slot="input-group"
			{...props}
		/>
	);
}

function InputGroupAddon({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center gap-1.5 pl-2.5 text-sm text-muted-foreground [&_img]:size-4 [&_img]:object-contain [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			data-slot="input-group-addon"
			{...props}
		/>
	);
}

function InputGroupInput({
	className,
	...props
}: React.ComponentProps<"input">) {
	return (
		<Input
			className={cn(
				"h-full flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0 in-data-[visual-effect=opaque]:bg-transparent in-data-[visual-effect=translucent]:bg-transparent dark:bg-transparent dark:in-data-[visual-effect=opaque]:bg-transparent dark:in-data-[visual-effect=translucent]:bg-transparent",
				className,
			)}
			data-slot="input-group-control"
			{...props}
		/>
	);
}

function InputGroupButton({
	className,
	...props
}: React.ComponentProps<typeof Button>) {
	return (
		<Button
			className={cn("mr-0.5", className)}
			data-slot="input-group-button"
			size="icon-sm"
			variant="ghost"
			{...props}
		/>
	);
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput };
