import { afterEach, describe, expect, mock, spyOn, test } from "@test/jest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { createElement, type PropsWithChildren } from "react";
import { type Theme, ThemeProvider, useTheme } from "./theme-provider";

type WrapperOptions = {
	defaultTheme?: Theme;
	disableTransitionOnChange?: boolean;
	forcedTheme?: Theme;
	storageKey?: string;
};

const createWrapper = (options: WrapperOptions = {}) =>
	function ThemeWrapper({ children }: PropsWithChildren) {
		return createElement(ThemeProvider, {
			...options,
			children,
			disableTransitionOnChange: options.disableTransitionOnChange ?? false,
		});
	};

afterEach(() => {
	cleanup();
	mock.restore();
	localStorage.clear();
	sessionStorage.clear();
	document.documentElement.classList.remove("dark", "light");
});

describe("ThemeProvider and useTheme", () => {
	test("requires the hook to be used inside its provider", () => {
		expect(() => renderHook(() => useTheme())).toThrow(
			"useTheme must be used within a ThemeProvider",
		);
	});

	test("uses valid storage and falls back from invalid storage", () => {
		localStorage.setItem("stored-theme", "dark");
		const stored = renderHook(() => useTheme(), {
			wrapper: createWrapper({
				defaultTheme: "light",
				storageKey: "stored-theme",
			}),
		});
		expect(stored.result.current.theme).toBe("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		stored.unmount();

		localStorage.setItem("invalid-theme", "auto");
		const invalid = renderHook(() => useTheme(), {
			wrapper: createWrapper({
				defaultTheme: "light",
				storageKey: "invalid-theme",
			}),
		});
		expect(invalid.result.current.theme).toBe("light");
	});

	test("setTheme updates state, storage, and the document class", () => {
		const { result } = renderHook(() => useTheme(), {
			wrapper: createWrapper({ defaultTheme: "light", storageKey: "custom" }),
		});

		act(() => result.current.setTheme("dark"));

		expect(result.current.theme).toBe("dark");
		expect(localStorage.getItem("custom")).toBe("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(document.documentElement.classList.contains("light")).toBe(false);
	});

	test("temporarily disables transitions only after the initial theme", () => {
		const getComputedStyle = spyOn(window, "getComputedStyle");
		const requestFrame = spyOn(
			window,
			"requestAnimationFrame",
		).mockImplementation((callback) => {
			callback(0);
			return 1;
		});
		const { result } = renderHook(() => useTheme(), {
			wrapper: createWrapper({
				defaultTheme: "light",
				disableTransitionOnChange: true,
			}),
		});

		expect(getComputedStyle).not.toHaveBeenCalled();
		act(() => result.current.setTheme("dark"));

		expect(getComputedStyle).toHaveBeenCalled();
		expect(getComputedStyle.mock.calls.at(-1)?.[0]).toBe(document.body);
		expect(requestFrame).toHaveBeenCalledTimes(2);
		expect(
			[...document.head.querySelectorAll("style")].some((style) =>
				style.textContent?.includes("transition:none"),
			),
		).toBe(false);
	});

	test("keeps a forced theme effective and disables the keyboard shortcut", () => {
		const { result } = renderHook(() => useTheme(), {
			wrapper: createWrapper({ defaultTheme: "light", forcedTheme: "dark" }),
		});

		act(() => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
		});

		expect(result.current.theme).toBe("dark");
		expect(localStorage.getItem("theme")).toBeNull();

		act(() => result.current.setTheme("light"));
		expect(result.current.theme).toBe("dark");
		expect(localStorage.getItem("theme")).toBe("light");
	});

	test("tracks system color-scheme changes", () => {
		let prefersDark = true;
		const listeners = new Set<() => void>();
		spyOn(window, "matchMedia").mockImplementation(
			() =>
				({
					addEventListener: (_type: string, listener: () => void) =>
						listeners.add(listener),
					get matches() {
						return prefersDark;
					},
					removeEventListener: (_type: string, listener: () => void) =>
						listeners.delete(listener),
				}) as unknown as MediaQueryList,
		);
		const { result, unmount } = renderHook(() => useTheme(), {
			wrapper: createWrapper({ defaultTheme: "system" }),
		});

		expect(result.current.theme).toBe("system");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(listeners.size).toBe(1);

		prefersDark = false;
		act(() => {
			for (const listener of listeners) listener();
		});
		expect(document.documentElement.classList.contains("light")).toBe(true);

		unmount();
		expect(listeners.size).toBe(0);
	});

	test("toggles with D while ignoring modified, repeated, and editable events", () => {
		const { result } = renderHook(() => useTheme(), {
			wrapper: createWrapper({ defaultTheme: "light" }),
		});
		const input = document.createElement("input");
		document.body.append(input);

		act(() => {
			window.dispatchEvent(
				new KeyboardEvent("keydown", { ctrlKey: true, key: "d" }),
			);
			window.dispatchEvent(
				new KeyboardEvent("keydown", { key: "d", repeat: true }),
			);
			input.dispatchEvent(
				new KeyboardEvent("keydown", { bubbles: true, key: "d" }),
			);
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));
		});
		expect(result.current.theme).toBe("light");

		act(() => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "D" }));
		});
		expect(result.current.theme).toBe("dark");
		expect(localStorage.getItem("theme")).toBe("dark");
		input.remove();
	});

	test("applies valid cross-tab storage changes and resets invalid values", () => {
		const { result } = renderHook(() => useTheme(), {
			wrapper: createWrapper({ defaultTheme: "light", storageKey: "shared" }),
		});

		act(() => {
			window.dispatchEvent(
				new StorageEvent("storage", {
					key: "shared",
					newValue: "dark",
					storageArea: sessionStorage,
				}),
			);
			window.dispatchEvent(
				new StorageEvent("storage", {
					key: "other",
					newValue: "dark",
					storageArea: localStorage,
				}),
			);
			window.dispatchEvent(
				new StorageEvent("storage", {
					key: "shared",
					newValue: "dark",
					storageArea: localStorage,
				}),
			);
		});
		expect(result.current.theme).toBe("dark");

		act(() => {
			window.dispatchEvent(
				new StorageEvent("storage", {
					key: "shared",
					newValue: "invalid",
					storageArea: localStorage,
				}),
			);
		});
		expect(result.current.theme).toBe("light");
	});

	test("removes keyboard and storage listeners on unmount", () => {
		const removeEventListener = spyOn(window, "removeEventListener");
		const { unmount } = renderHook(() => useTheme(), {
			wrapper: createWrapper({ defaultTheme: "light" }),
		});

		unmount();

		expect(removeEventListener).toHaveBeenCalledWith(
			"keydown",
			expect.any(Function),
		);
		expect(removeEventListener).toHaveBeenCalledWith(
			"storage",
			expect.any(Function),
		);
	});
});
