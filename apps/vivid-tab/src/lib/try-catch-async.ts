type TryCatchReturnAsync<Return> = Promise<
	[unknown, undefined] | [undefined, Return]
>;

/**
 * Converts a promise rejection into an error-first tuple so callers can handle
 * expected failures without a surrounding `try`/`catch` block.
 *
 * @param fn - Deferred asynchronous operation to execute.
 * @returns `[undefined, value]` on success or `[error, undefined]` on failure.
 *
 * @example
 * ```ts
 * const [error, quote] = await tryCatchAsync(() => fetchQuote());
 * if (error) return fallbackQuote;
 * return quote;
 * ```
 */
export const tryCatchAsync = async <Return>(
	fn: () => Promise<Return>,
): TryCatchReturnAsync<Return> => {
	try {
		const result = await fn();

		return [undefined, result] as [undefined, Return];
	} catch (error) {
		return [error, undefined];
	}
};
