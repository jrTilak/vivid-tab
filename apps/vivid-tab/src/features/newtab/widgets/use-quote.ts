import { useEffect, useState } from "react";
import { loadQuote, type QuoteData } from "./quote-service";

interface QuoteState {
	isLoading: boolean;
	quote: QuoteData | null;
}

const useQuote = (categories: readonly string[]): QuoteState => {
	const [state, setState] = useState<QuoteState>({
		isLoading: true,
		quote: null,
	});
	const categoriesKey = [...categories].sort().join("|");

	useEffect(() => {
		const controller = new AbortController();
		const requestedCategories = categoriesKey ? categoriesKey.split("|") : [];
		setState((current) =>
			current.isLoading && current.quote === null
				? current
				: { isLoading: true, quote: null },
		);

		void loadQuote(requestedCategories, controller.signal)
			.then((quote) => setState({ isLoading: false, quote }))
			.catch(() => {
				if (!controller.signal.aborted) {
					setState({ isLoading: false, quote: null });
				}
			});

		return () => controller.abort();
	}, [categoriesKey]);

	return state;
};

export { useQuote };
