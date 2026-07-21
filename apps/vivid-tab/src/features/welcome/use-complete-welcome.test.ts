import { jest } from "@jest/globals";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "@test/jest";
import { act, renderHook } from "@testing-library/react";
import { createDefaultSettings } from "@/lib/settings-storage";
import { useCompleteWelcome } from "./use-complete-welcome";

const mockSettings = createDefaultSettings();
const mockSaveSettings = mock(async (_candidate: unknown) => true);

jest.mock("@/providers/settings-provider", () => ({
	useSettings: () => ({
		saveSettings: mockSaveSettings,
		settings: mockSettings,
	}),
}));

const originalChrome = globalThis.chrome;

const createTabFixture = (id: number, index: number): chrome.tabs.Tab => ({
	active: true,
	autoDiscardable: true,
	discarded: false,
	frozen: false,
	groupId: -1,
	highlighted: true,
	id,
	incognito: false,
	index,
	pinned: false,
	selected: true,
	windowId: 1,
});

const getCurrent = mock(
	async (): Promise<chrome.tabs.Tab | undefined> => createTabFixture(1, 0),
);
const createTab = mock(
	async (): Promise<chrome.tabs.Tab> => createTabFixture(2, 1),
);
const removeTab = mock(async (_tabId: number): Promise<void> => undefined);

beforeEach(() => {
	mockSaveSettings.mockClear();
	mockSaveSettings.mockResolvedValue(true);
	getCurrent.mockClear();
	createTab.mockClear();
	removeTab.mockClear();
	getCurrent.mockResolvedValue(createTabFixture(1, 0));
	createTab.mockResolvedValue(createTabFixture(2, 1));
	removeTab.mockResolvedValue(undefined);
	globalThis.chrome = {
		tabs: {
			create: createTab,
			getCurrent,
			remove: removeTab,
		},
	} as unknown as typeof chrome;
});

afterEach(() => {
	globalThis.chrome = originalChrome;
});

describe("useCompleteWelcome", () => {
	test("persists a resolved folder and exposes a successful completion", async () => {
		const { result } = renderHook(() => useCompleteWelcome());
		let completed = false;

		await act(async () => {
			completed = await result.current.completeWelcome(() => "folder-42");
		});

		expect(completed).toBe(true);
		expect(mockSaveSettings).toHaveBeenCalledWith({
			...mockSettings,
			general: { ...mockSettings.general, rootFolder: "folder-42" },
		});
		expect(removeTab).toHaveBeenCalledWith(1);
		expect(result.current.errorMessage).toBeUndefined();
		expect(result.current.isCompleting).toBe(false);
	});

	test("skips settings persistence when completion has no folder resolver", async () => {
		const { result } = renderHook(() => useCompleteWelcome());

		await act(async () => {
			expect(await result.current.completeWelcome()).toBe(true);
		});

		expect(mockSaveSettings).not.toHaveBeenCalled();
		expect(createTab).toHaveBeenCalledTimes(1);
	});

	test("blocks duplicate completion while the first call is pending", async () => {
		let resolveCreation: ((tab: chrome.tabs.Tab) => void) | undefined;
		createTab.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveCreation = resolve;
				}),
		);
		const { result } = renderHook(() => useCompleteWelcome());
		let firstCompletion: Promise<boolean> | undefined;

		act(() => {
			firstCompletion = result.current.completeWelcome();
		});
		expect(result.current.isCompleting).toBe(true);

		await act(async () => {
			expect(await result.current.completeWelcome()).toBe(false);
		});
		expect(createTab).toHaveBeenCalledTimes(1);

		resolveCreation?.(createTabFixture(2, 1));
		await act(async () => {
			expect(await firstCompletion).toBe(true);
		});
		expect(result.current.isCompleting).toBe(false);
	});

	test("reports a failure, releases the guard, and clears the error on retry", async () => {
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		createTab.mockRejectedValueOnce(new Error("tab creation failed"));
		const { result } = renderHook(() => useCompleteWelcome());

		await act(async () => {
			expect(await result.current.completeWelcome()).toBe(false);
		});
		expect(result.current.errorMessage).toBe(
			"Could not finish setup. Please try again.",
		);
		expect(result.current.isCompleting).toBe(false);

		await act(async () => {
			expect(await result.current.completeWelcome()).toBe(true);
		});
		expect(result.current.errorMessage).toBeUndefined();
		expect(createTab).toHaveBeenCalledTimes(2);
		consoleError.mockRestore();
	});
});
