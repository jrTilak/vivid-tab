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

	useEffect(() => {
		const controller = new AbortController();

		void loadQuote(categories, controller.signal)
			.then((quote) => setState({ isLoading: false, quote }))
			.catch(() => {
				if (!controller.signal.aborted) {
					setState({ isLoading: false, quote: null });
				}
			});

		return () => controller.abort();
	}, [categories]);

	return state;
};

export { useQuote };
