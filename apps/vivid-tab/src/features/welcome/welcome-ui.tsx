import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";

type WelcomeStepCardProps = {
	children: ReactNode;
	title: string;
	description: ReactNode;
	footer: ReactNode;
	className?: string;
	contentClassName?: string;
	errorMessage?: string;
};

/** Shared structure keeps every onboarding step responsive and visually consistent. */
const WelcomeStepCard = ({
	children,
	title,
	description,
	footer,
	className,
	contentClassName,
	errorMessage,
}: WelcomeStepCardProps) => (
	<Card
		className={cn(
			"w-full max-w-lg gap-4 text-center text-foreground",
			className,
		)}
	>
		<CardHeader className="text-center">
			<h1 className="text-xl font-medium">{title}</h1>
			<p className="text-sm text-muted-foreground">{description}</p>
		</CardHeader>
		<CardContent className={cn("space-y-4", contentClassName)}>
			{children}
			{errorMessage ? (
				<p className="text-sm text-destructive" role="alert">
					{errorMessage}
				</p>
			) : null}
		</CardContent>
		<CardFooter className="justify-between pt-4">{footer}</CardFooter>
	</Card>
);

export { WelcomeStepCard };
