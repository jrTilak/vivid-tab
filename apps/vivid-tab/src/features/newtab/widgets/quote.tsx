import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/providers/settings-provider";
import { useQuote } from "./use-quote";

const Quote = () => {
	const {
		settings: {
			widgets: {
				quotes: { categories },
			},
		},
	} = useSettings();
	const { isLoading, quote } = useQuote(categories);

	if (isLoading) {
		return <Skeleton className="h-24" />;
	}

	if (!quote) return null;

	return (
		<Card className="p-6">
			<blockquote className="space-y-2">
				<p className="text-sm italic">
					&apos;
					{quote.content}
					&apos;
				</p>
				<footer className="text-xs">— {quote.author}</footer>
			</blockquote>
		</Card>
	);
};

export { Quote };
