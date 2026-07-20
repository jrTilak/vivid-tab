import type * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

const SettingsPage = ({ className, ...props }: React.ComponentProps<"div">) => (
	<div className={cn("space-y-6 p-5", className)} {...props} />
);

type SettingsSectionProps = React.ComponentProps<"section"> & {
	description?: string;
	title: string;
};

const SettingsSection = ({
	children,
	className,
	description,
	title,
	...props
}: SettingsSectionProps) => (
	<section className={cn("space-y-3", className)} {...props}>
		<header className="space-y-1 px-1">
			<h2 className="text-sm font-medium">{title}</h2>
			{description && (
				<p className="text-xs text-muted-foreground">{description}</p>
			)}
		</header>
		<div className="divide-y divide-border/70 overflow-hidden rounded-lg border bg-background in-data-[visual-effect=opaque]:bg-background in-data-[visual-effect=translucent]:bg-background/25">
			{children}
		</div>
	</section>
);

type SettingsRowProps = React.ComponentProps<"div"> & {
	controlId?: string;
	description?: string;
	label: string;
};

const SettingsRow = ({
	children,
	className,
	controlId,
	description,
	label,
	...props
}: SettingsRowProps) => (
	<div
		className={cn(
			"flex min-h-14 items-center justify-between gap-6 px-4 py-3",
			className,
		)}
		{...props}
	>
		<div className="min-w-0 space-y-1">
			<Label htmlFor={controlId}>{label}</Label>
			{description && (
				<p className="text-xs leading-relaxed text-muted-foreground">
					{description}
				</p>
			)}
		</div>
		<div className="shrink-0">{children}</div>
	</div>
);

export { SettingsPage, SettingsRow, SettingsSection };
