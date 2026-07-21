import { afterEach, describe, expect, mock, test } from "@test/jest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { BACKGROUND_ACTIONS } from "@/constants/background-actions";
import { useToggleSearchCommand } from "./use-toggle-search-command";

type MessageListener = (
	message: unknown,
	sender: chrome.runtime.MessageSender,
) => void;

const originalChrome = globalThis.chrome;

const createDeferred = <Value>() => {
	let resolve: (value: Value) => void = () => undefined;
	let reject: (reason?: unknown) => void = () => undefined;
	const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, reject, resolve };
};

const installChrome = (
	getCurrent: () => Promise<chrome.tabs.Tab | undefined>,
) => {
	let listener: MessageListener | undefined;
	const addListener = mock((nextListener: MessageListener) => {
		listener = nextListener;
	});
	const removeListener = mock((removedListener: MessageListener) => {
		if (listener === removedListener) listener = undefined;
	});

	globalThis.chrome = {
		runtime: {
			id: "extension-id",
			onMessage: { addListener, removeListener },
		},
		tabs: { getCurrent },
	} as unknown as typeof chrome;

	return {
		addListener,
		dispatch: (
			message: unknown,
			senderId: string | undefined = "extension-id",
		) => listener?.(message, { id: senderId } as chrome.runtime.MessageSender),
		listener: () => listener,
		removeListener,
	};
};

afterEach(() => {
	cleanup();
	globalThis.chrome = originalChrome;
});

describe("useToggleSearchCommand", () => {
	test("toggles only for a typed command targeting the current new tab", async () => {
		const runtime = installChrome(
			mock(async () => ({ id: 7 }) as chrome.tabs.Tab),
		);
		const onToggle = mock(() => undefined);
		renderHook(() => useToggleSearchCommand(onToggle));
		await act(async () => Promise.resolve());

		for (const [message, senderId] of [
			[
				{
					action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
					targetTabId: 8,
				},
				"extension-id",
			],
			[
				{
					action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
					targetTabId: 7,
				},
				"another-extension",
			],
			[{ action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH }, "extension-id"],
		] as const) {
			act(() => runtime.dispatch(message, senderId));
		}
		expect(onToggle).not.toHaveBeenCalled();

		act(() =>
			runtime.dispatch({
				action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
				targetTabId: 7,
			}),
		);
		expect(onToggle).toHaveBeenCalledTimes(1);
	});

	test("replays pending commands by parity once the tab ID resolves", async () => {
		const currentTab = createDeferred<chrome.tabs.Tab | undefined>();
		const runtime = installChrome(mock(() => currentTab.promise));
		const onToggle = mock(() => undefined);
		renderHook(() => useToggleSearchCommand(onToggle));

		act(() => {
			runtime.dispatch({
				action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
				targetTabId: 7,
			});
			runtime.dispatch({
				action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
				targetTabId: 8,
			});
			runtime.dispatch({
				action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
				targetTabId: 7,
			});
		});
		await act(async () => currentTab.resolve({ id: 7 } as chrome.tabs.Tab));
		expect(onToggle).not.toHaveBeenCalled();

		act(() =>
			runtime.dispatch({
				action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
				targetTabId: 7,
			}),
		);
		expect(onToggle).toHaveBeenCalledTimes(1);
	});

	test.each([
		"missing",
		"rejected",
		"thrown",
	] as const)("ignores commands when current-tab lookup is %s", async (failure) => {
		const getCurrent = mock(() => {
			if (failure === "thrown") throw new Error("tabs unavailable");
			if (failure === "rejected") {
				return Promise.reject(new Error("tab closed"));
			}

			return Promise.resolve(undefined);
		});
		const runtime = installChrome(getCurrent);
		const onToggle = mock(() => undefined);
		renderHook(() => useToggleSearchCommand(onToggle));
		await act(async () => Promise.resolve());

		act(() =>
			runtime.dispatch({
				action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
				targetTabId: 7,
			}),
		);
		expect(onToggle).not.toHaveBeenCalled();
	});

	test("removes the listener and ignores a pending lookup after cleanup", async () => {
		const currentTab = createDeferred<chrome.tabs.Tab | undefined>();
		const runtime = installChrome(mock(() => currentTab.promise));
		const onToggle = mock(() => undefined);
		const { unmount } = renderHook(() => useToggleSearchCommand(onToggle));
		const detachedListener = runtime.listener();

		unmount();
		detachedListener?.(
			{
				action: BACKGROUND_ACTIONS.TOGGLE_VIVID_SEARCH,
				targetTabId: 7,
			},
			{ id: "extension-id" } as chrome.runtime.MessageSender,
		);
		await act(async () => currentTab.resolve({ id: 7 } as chrome.tabs.Tab));

		expect(runtime.removeListener).toHaveBeenCalledTimes(1);
		expect(onToggle).not.toHaveBeenCalled();
	});
});
