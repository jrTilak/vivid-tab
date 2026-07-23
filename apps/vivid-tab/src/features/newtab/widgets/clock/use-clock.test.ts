import { afterEach, describe, expect, jest, test } from "@test/jest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useClock } from "./use-clock";

afterEach(() => {
	cleanup();
	jest.useRealTimers();
});

describe("useClock", () => {
	test("aligns minute updates instead of rerendering every second", () => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2026, 0, 1, 12, 0, 3, 250));
		const { result } = renderHook(() => useClock());
		const initial = result.current;

		act(() => jest.advanceTimersByTime(56_749));
		expect(result.current).toBe(initial);

		act(() => jest.advanceTimersByTime(1));
		expect(result.current).not.toBe(initial);
		expect(result.current).toBeInstanceOf(Date);
		expect(jest.getTimerCount()).toBe(1);
	});

	test("reschedules at second boundaries and clears timers on unmount", () => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2026, 0, 1, 12, 0, 3, 250));
		const { result, unmount } = renderHook(() => useClock(true));
		const initial = result.current;

		act(() => jest.advanceTimersByTime(749));
		expect(result.current).toBe(initial);
		act(() => jest.advanceTimersByTime(1));
		expect(result.current).not.toBe(initial);
		expect(jest.getTimerCount()).toBe(1);

		unmount();
		expect(jest.getTimerCount()).toBe(0);
	});

	test("restarts scheduling when seconds visibility changes", () => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2026, 0, 1, 12, 0, 3, 250));
		const { rerender } = renderHook(
			({ showSeconds }) => useClock(showSeconds),
			{ initialProps: { showSeconds: false } },
		);

		expect(jest.getTimerCount()).toBe(1);
		rerender({ showSeconds: true });
		expect(jest.getTimerCount()).toBe(1);
		act(() => jest.advanceTimersByTime(750));
		expect(jest.getTimerCount()).toBe(1);
	});
});
