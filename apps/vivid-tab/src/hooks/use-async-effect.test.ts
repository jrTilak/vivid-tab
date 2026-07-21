import { afterEach, describe, expect, jest, mock, test } from "@test/jest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { useAsyncEffect } from "./use-async-effect";

afterEach(() => {
	cleanup();
	jest.useRealTimers();
	mock.restore();
});

describe("useAsyncEffect", () => {
	test("runs on dependency changes but not on equal dependencies", async () => {
		const effect = mock(async () => undefined);
		const { rerender } = renderHook(
			({ dependency }) => useAsyncEffect(effect, [dependency]),
			{ initialProps: { dependency: "first" } },
		);

		await waitFor(() => expect(effect).toHaveBeenCalledTimes(1));
		rerender({ dependency: "first" });
		expect(effect).toHaveBeenCalledTimes(1);
		rerender({ dependency: "second" });
		await waitFor(() => expect(effect).toHaveBeenCalledTimes(2));
	});

	test("exposes a mounted guard that becomes false after cleanup", async () => {
		let isMounted: (() => boolean) | undefined;
		const effect = mock(async (getMounted?: () => boolean) => {
			isMounted = getMounted;
		});
		const { unmount } = renderHook(() => useAsyncEffect(effect, []));

		await waitFor(() => expect(isMounted).toBeDefined());
		expect(isMounted?.()).toBe(true);
		unmount();
		expect(isMounted?.()).toBe(false);
	});
});
