import { Card } from "@/components/ui/card";
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
	const quote = useQuote(categories);

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
