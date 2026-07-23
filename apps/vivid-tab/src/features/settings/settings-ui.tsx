import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

const SettingsNewBadge = ({ className }: { className?: string }) => (
	<Badge
		className={cn("h-4 px-1.5 text-[0.625rem]", className)}
		variant="secondary"
	>
		New
	</Badge>
);

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
	isNew?: boolean;
	label: string;
};

const SettingsRow = ({
	children,
	className,
	controlId,
	description,
	isNew = false,
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
			<div className="flex items-center gap-2">
				<Label htmlFor={controlId}>{label}</Label>
				{isNew && <SettingsNewBadge />}
			</div>
			{description && (
				<p className="text-xs leading-relaxed text-muted-foreground">
					{description}
				</p>
			)}
		</div>
		<div className="shrink-0">{children}</div>
	</div>
);

export { SettingsNewBadge, SettingsPage, SettingsRow, SettingsSection };
