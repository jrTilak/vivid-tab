import { afterEach, describe, expect, jest, mock, test } from "@test/jest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useIsOnline } from "./use-is-online";

const originalOnlineDescriptor = Object.getOwnPropertyDescriptor(
	navigator,
	"onLine",
);

afterEach(() => {
	cleanup();
	jest.useRealTimers();
	mock.restore();
	if (originalOnlineDescriptor) {
		Object.defineProperty(navigator, "onLine", originalOnlineDescriptor);
	} else {
		Reflect.deleteProperty(navigator, "onLine");
	}
});

describe("useIsOnline", () => {
	test("uses the browser status and follows online/offline events", () => {
		Object.defineProperty(navigator, "onLine", {
			configurable: true,
			value: false,
		});
		const { result } = renderHook(() => useIsOnline());

		expect(result.current).toBe(false);
		act(() => window.dispatchEvent(new Event("online")));
		expect(result.current).toBe(true);
		act(() => window.dispatchEvent(new Event("offline")));
		expect(result.current).toBe(false);
	});

	test("removes both listeners on unmount", () => {
		const removeListener = mock(window.removeEventListener.bind(window));
		const removeListenerSpy = jest
			.spyOn(window, "removeEventListener")
			.mockImplementation(removeListener);
		const { unmount } = renderHook(() => useIsOnline());

		unmount();

		expect(removeListenerSpy.mock.calls.map(([event]) => event)).toContain(
			"online",
		);
		expect(removeListenerSpy.mock.calls.map(([event]) => event)).toContain(
			"offline",
		);
	});
});
