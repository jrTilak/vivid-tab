import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LOCAL_STORAGE } from "@/constants/keys";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { tryCatchAsync } from "@/lib/try-catch-async";
import { useSettings } from "@/providers/settings-provider";

type QuoteResponse = {
	_id: string;
	content: string;
	author: string;
};

const Quote = () => {
	const [isLoaded, setIsLoaded] = useState(false);
	const [quote, setQuote] = useState<QuoteResponse | null>(null);
	const [err, setErr] = useState({
		err: false,
		message: "",
	});
	const {
		settings: {
			quotes: { categories },
		},
	} = useSettings();

	useAsyncEffect(
		async (isMounted) => {
			const [err, data] = await tryCatchAsync(async () => {
				const baseUrl = "https://api.quotable.io/quotes/random";
				const urlWithTags =
					categories.length > 0
						? `${baseUrl}?tags=${categories.join("|")}&maxLength=80`
						: baseUrl;
				const response = await fetch(urlWithTags);
				const json = (await response.json()) as QuoteResponse[];

				return json[0];
			});

			if (err || !data) {
				const [err, cachedQuote] = await tryCatchAsync<Error, QuoteResponse>(
					() => {
						return new Promise((resolve, reject) => {
							chrome.storage.local.get(LOCAL_STORAGE.quote, (storageData) => {
								try {
									const raw = storageData?.[LOCAL_STORAGE.quote];

									if (raw == null || typeof raw !== "string") {
										reject(new Error("No cached quote"));

										return;
									}

									const w = JSON.parse(raw) as QuoteResponse;

									if (w) {
										resolve(w);
									} else {
										reject(false);
									}
								} catch (e) {
									reject(e);
								}
							});
						});
					},
				);

				if (err) {
					if (isMounted?.()) {
						setErr({
							err: true,
							message: err.message,
						});
						setIsLoaded(true);
					}
				} else if (cachedQuote && isMounted?.()) {
					setQuote(cachedQuote);
					setIsLoaded(true);
				}

				return;
			}

			chrome.storage.local.set({ [LOCAL_STORAGE.quote]: JSON.stringify(data) });

			if (isMounted?.()) {
				setQuote(data);
				setIsLoaded(true);
			}
		},
		[categories],
	);

	if (!quote && !isLoaded) {
		return <Skeleton className="h-24" />;
	}

	if (err.err) return null;

	return (
		<Card className=" p-6">
			<blockquote className="space-y-2">
				<p className="text-sm italic">
					&apos;
					{quote?.content}
					&apos;
				</p>
				<footer className="text-xs">
					— {err.err ? "Unknown" : quote?.author}{" "}
				</footer>
			</blockquote>
		</Card>
	);
};

export { Quote };
