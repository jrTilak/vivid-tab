import {
	afterEach,
	beforeEach,
	describe,
	expect,
	jest,
	mock,
	test,
} from "@test/jest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useBookmarkEditorIcon } from "./use-bookmark-editor-icon";

let runtimeError: { message: string } | undefined;
const storageGet = mock(
	(key: string, callback: (items: Record<string, unknown>) => void) =>
		callback({ [key]: undefined }),
);

beforeEach(() => {
	runtimeError = undefined;
	storageGet.mockReset();
	storageGet.mockImplementation((key, callback) =>
		callback({ [key]: undefined }),
	);
	globalThis.chrome = {
		runtime: {
			get lastError() {
				return runtimeError;
			},
		},
		storage: { local: { get: storageGet } },
	} as unknown as typeof chrome;
});

afterEach(() => {
	cleanup();
	mock.restore();
});

describe("useBookmarkEditorIcon", () => {
	test("does not read storage for a closed editor or a new node", () => {
		const closed = renderHook(() =>
			useBookmarkEditorIcon({ bookmarkId: "bookmark", open: false }),
		);
		expect(closed.result.current).toMatchObject({
			icon: undefined,
			iconLoadError: undefined,
			isLoadingIcon: false,
		});
		closed.unmount();

		const closedNewNode = renderHook(() =>
			useBookmarkEditorIcon({ open: false }),
		);
		expect(closedNewNode.result.current).toMatchObject({
			icon: null,
			iconLoadError: undefined,
			isLoadingIcon: false,
		});
		closedNewNode.unmount();

		const created = renderHook(() => useBookmarkEditorIcon({ open: true }));
		expect(created.result.current).toMatchObject({
			icon: null,
			iconLoadError: undefined,
			isLoadingIcon: false,
		});
		expect(storageGet).not.toHaveBeenCalled();
	});

	test("loads and validates the existing custom icon", async () => {
		storageGet.mockImplementationOnce((key, callback) =>
			callback({ [key]: { icon: "data:image/png;base64,abc" } }),
		);
		const { result } = renderHook(() =>
			useBookmarkEditorIcon({ bookmarkId: "bookmark", open: true }),
		);

		await waitFor(() => expect(result.current.isLoadingIcon).toBe(false));
		expect(result.current.icon).toBe("data:image/png;base64,abc");
		expect(result.current.iconLoadError).toBeUndefined();
		expect(storageGet).toHaveBeenCalledWith(
			"icon-bookmark",
			expect.any(Function),
		);
	});

	test("shows a recoverable load error and lets a new selection clear it", async () => {
		storageGet.mockImplementationOnce((_key, callback) => {
			runtimeError = { message: "storage failed" };
			callback({});
			runtimeError = undefined;
		});
		const errorLog = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const { result } = renderHook(() =>
			useBookmarkEditorIcon({ bookmarkId: "bookmark", open: true }),
		);

		await waitFor(() => expect(result.current.isLoadingIcon).toBe(false));
		expect(result.current.icon).toBeUndefined();
		expect(result.current.iconLoadError).toContain("could not be loaded");

		act(() => result.current.setIcon("data:image/png;base64,new"));
		expect(result.current.icon).toBe("data:image/png;base64,new");
		expect(result.current.iconLoadError).toBeUndefined();
		errorLog.mockRestore();
	});

	test("ignores an obsolete read after the selected bookmark changes", async () => {
		const callbacks: Array<{
			callback: (items: Record<string, unknown>) => void;
			key: string;
		}> = [];
		storageGet.mockImplementation((key, callback) => {
			callbacks.push({ callback, key });
		});
		const { result, rerender } = renderHook(
			({ bookmarkId }) => useBookmarkEditorIcon({ bookmarkId, open: true }),
			{ initialProps: { bookmarkId: "first" } },
		);
		expect(callbacks).toHaveLength(1);

		rerender({ bookmarkId: "second" });
		expect(callbacks).toHaveLength(2);
		await act(async () => {
			const second = callbacks[1];
			second?.callback({
				[second.key]: { icon: "data:image/png;base64,second" },
			});
			await Promise.resolve();
		});
		expect(result.current.icon).toBe("data:image/png;base64,second");

		await act(async () => {
			const first = callbacks[0];
			first?.callback({
				[first.key]: { icon: "data:image/png;base64,first" },
			});
			await Promise.resolve();
		});
		expect(result.current.icon).toBe("data:image/png;base64,second");
	});

	test("ignores an obsolete read failure after the bookmark changes", async () => {
		const callbacks: Array<{
			callback: (items: Record<string, unknown>) => void;
			key: string;
		}> = [];
		storageGet.mockImplementation((key, callback) => {
			callbacks.push({ callback, key });
		});
		const errorLog = jest
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const { result, rerender } = renderHook(
			({ bookmarkId }) => useBookmarkEditorIcon({ bookmarkId, open: true }),
			{ initialProps: { bookmarkId: "first" } },
		);

		rerender({ bookmarkId: "second" });
		await act(async () => {
			const second = callbacks[1];
			second?.callback({
				[second.key]: { icon: "data:image/png;base64,second" },
			});
			await Promise.resolve();
		});

		await act(async () => {
			runtimeError = { message: "obsolete storage failure" };
			callbacks[0]?.callback({});
			runtimeError = undefined;
			await Promise.resolve();
		});

		expect(result.current).toMatchObject({
			icon: "data:image/png;base64,second",
			iconLoadError: undefined,
			isLoadingIcon: false,
		});
		expect(errorLog).toHaveBeenCalledWith(
			"Failed to load bookmark icon:",
			expect.any(Error),
		);
	});

	test("resets state when the editor closes and ignores pending completion", async () => {
		let finish: ((items: Record<string, unknown>) => void) | undefined;
		storageGet.mockImplementationOnce((_key, callback) => {
			finish = callback;
		});
		const { result, rerender } = renderHook(
			({ open }) => useBookmarkEditorIcon({ bookmarkId: "bookmark", open }),
			{ initialProps: { open: true } },
		);
		expect(result.current.isLoadingIcon).toBe(true);

		rerender({ open: false });
		expect(result.current).toMatchObject({
			icon: undefined,
			iconLoadError: undefined,
			isLoadingIcon: false,
		});
		await act(async () => {
			finish?.({ "icon-bookmark": { icon: "data:image/png;base64,late" } });
			await Promise.resolve();
		});
		expect(result.current.icon).toBeUndefined();
	});
});
