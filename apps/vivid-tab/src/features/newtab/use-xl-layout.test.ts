import { afterEach, describe, expect, jest, mock, test } from "@test/jest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useXlLayout } from "./use-xl-layout";

afterEach(() => {
	cleanup();
	mock.restore();
});

describe("useXlLayout", () => {
	test("uses the compact layout for the server snapshot", () => {
		const XlLayoutProbe = () => (useXlLayout() ? "xl" : "compact");

		expect(renderToString(createElement(XlLayoutProbe))).toContain("compact");
	});

	test("tracks the same xl media query and unsubscribes on unmount", () => {
		const listeners = new Set<() => void>();
		const mediaQuery = {
			addEventListener: mock((_type: string, listener: () => void) => {
				listeners.add(listener);
			}),
			matches: false,
			removeEventListener: mock((_type: string, listener: () => void) => {
				listeners.delete(listener);
			}),
		};
		const matchMedia = jest
			.spyOn(window, "matchMedia")
			.mockImplementation((query) => {
				expect(query).toBe("(min-width: 80rem)");
				return mediaQuery as unknown as MediaQueryList;
			});

		const { result, unmount } = renderHook(() => useXlLayout());
		expect(result.current).toBe(false);
		expect(listeners.size).toBe(1);

		mediaQuery.matches = true;
		act(() => {
			for (const listener of listeners) listener();
		});
		expect(result.current).toBe(true);

		unmount();
		expect(listeners.size).toBe(0);
		expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
			"change",
			expect.any(Function),
		);
		matchMedia.mockRestore();
	});
});
