import { afterEach, describe, expect, jest, mock, test } from "@test/jest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "./use-debounced-value";

afterEach(() => {
	cleanup();
	jest.useRealTimers();
	mock.restore();
});

describe("useDebouncedValue", () => {
	test("uses a 300 millisecond delay when none is provided", () => {
		jest.useFakeTimers();
		const { result, rerender } = renderHook(
			({ value }) => useDebouncedValue(value),
			{ initialProps: { value: "first" } },
		);

		rerender({ value: "second" });
		act(() => jest.advanceTimersByTime(299));
		expect(result.current).toBe("first");

		act(() => jest.advanceTimersByTime(1));
		expect(result.current).toBe("second");
	});

	test("keeps the current value until the delay boundary", () => {
		jest.useFakeTimers();
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebouncedValue(value, delay),
			{ initialProps: { delay: 300, value: "first" } },
		);

		rerender({ delay: 300, value: "second" });
		expect(result.current).toBe("first");

		act(() => jest.advanceTimersByTime(299));
		expect(result.current).toBe("first");

		act(() => jest.advanceTimersByTime(1));
		expect(result.current).toBe("second");
	});

	test("restarts the timer when the value or delay changes", () => {
		jest.useFakeTimers();
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebouncedValue(value, delay),
			{ initialProps: { delay: 200, value: "first" } },
		);

		rerender({ delay: 200, value: "second" });
		act(() => jest.advanceTimersByTime(150));
		rerender({ delay: 100, value: "third" });
		act(() => jest.advanceTimersByTime(99));
		expect(result.current).toBe("first");

		act(() => jest.advanceTimersByTime(1));
		expect(result.current).toBe("third");
	});
});
