import { afterEach, describe, expect, jest, mock, test } from "@test/jest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { StoredImage } from "@/lib/wallpapers/database";
import { useImage } from "./use-image";

type PendingRead = {
	database: { close: ReturnType<typeof mock> };
	request: {
		error?: Error;
		onerror?: () => void;
		onsuccess?: () => void;
		result?: StoredImage;
	};
	transaction: {
		onabort?: () => void;
		oncomplete?: () => void;
		onerror?: () => void;
	};
};

const originalIndexedDbDescriptor = Object.getOwnPropertyDescriptor(
	globalThis,
	"indexedDB",
);
const originalCreateObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
	URL,
	"createObjectURL",
);
const originalRevokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
	URL,
	"revokeObjectURL",
);

const installIndexedDb = ({
	automatic = true,
	images = {},
	openError,
	readErrorIds = new Set<string>(),
}: {
	automatic?: boolean;
	images?: Record<string, StoredImage | undefined>;
	openError?: Error;
	readErrorIds?: Set<string>;
} = {}) => {
	const databases: Array<{ close: ReturnType<typeof mock> }> = [];
	const pending = new Map<string, PendingRead>();
	const open = mock(() => {
		const database = {
			close: mock(() => undefined),
			transaction: () => {
				const transaction: PendingRead["transaction"] & {
					objectStore: () => { get: (id: string) => PendingRead["request"] };
				} = {
					objectStore: () => ({
						get: (id) => {
							const request: PendingRead["request"] = {};
							const read = { database, request, transaction };
							pending.set(id, read);

							if (automatic) {
								queueMicrotask(() => {
									if (readErrorIds.has(id)) {
										request.error = new Error("Image read failed");
										request.onerror?.();
										transaction.onerror?.();
										return;
									}

									request.result = images[id];
									request.onsuccess?.();
									transaction.oncomplete?.();
								});
							}

							return request;
						},
					}),
				};

				return transaction;
			},
		};
		databases.push(database);
		const request: {
			error?: Error;
			onerror?: () => void;
			onsuccess?: () => void;
			result: typeof database;
		} = { result: database };

		queueMicrotask(() => {
			if (openError) {
				request.error = openError;
				request.onerror?.();
				return;
			}

			request.onsuccess?.();
		});

		return request;
	});

	Object.defineProperty(globalThis, "indexedDB", {
		configurable: true,
		value: { open },
		writable: true,
	});

	return {
		databases,
		open,
		pending,
		resolve(id: string, image?: StoredImage) {
			const read = pending.get(id);
			if (!read) throw new Error(`No pending image read for ${id}`);
			read.request.result = image;
			read.request.onsuccess?.();
			read.transaction.oncomplete?.();
		},
	};
};

afterEach(() => {
	cleanup();
	mock.restore();
	if (originalIndexedDbDescriptor) {
		Object.defineProperty(globalThis, "indexedDB", originalIndexedDbDescriptor);
	} else {
		Reflect.deleteProperty(globalThis, "indexedDB");
	}
	if (originalCreateObjectUrlDescriptor) {
		Object.defineProperty(
			URL,
			"createObjectURL",
			originalCreateObjectUrlDescriptor,
		);
	} else {
		Reflect.deleteProperty(URL, "createObjectURL");
	}
	if (originalRevokeObjectUrlDescriptor) {
		Object.defineProperty(
			URL,
			"revokeObjectURL",
			originalRevokeObjectUrlDescriptor,
		);
	} else {
		Reflect.deleteProperty(URL, "revokeObjectURL");
	}
});

const image = (id: string): StoredImage => ({
	fetchedAt: 1,
	id,
	source: "wallhaven",
	src: `https://example.com/${id}.jpg`,
});

describe("useImage", () => {
	test("does not open IndexedDB for an empty image id", () => {
		const { open } = installIndexedDb();

		const { result } = renderHook(() => useImage(null));

		expect(result.current).toBeNull();
		expect(open).not.toHaveBeenCalled();
	});

	test("loads an image and closes its database connection", async () => {
		const storedImage = image("selected");
		const { databases } = installIndexedDb({
			images: { selected: storedImage },
		});

		const { result } = renderHook(() => useImage("selected"));

		await waitFor(() => expect(result.current).toEqual(storedImage));
		expect(databases).toHaveLength(1);
		expect(databases[0]?.close).toHaveBeenCalledTimes(1);
	});

	test("uses and revokes an object URL for a cached full-resolution image", async () => {
		const cachedSrc = new Blob(["cached image"], { type: "image/jpeg" });
		const storedImage = { ...image("cached"), cachedSrc };
		const createObjectURL = mock(() => "blob:vivid-tab-cached");
		const revokeObjectURL = mock(() => undefined);
		Object.defineProperty(URL, "createObjectURL", {
			configurable: true,
			value: createObjectURL,
		});
		Object.defineProperty(URL, "revokeObjectURL", {
			configurable: true,
			value: revokeObjectURL,
		});
		installIndexedDb({ images: { cached: storedImage } });

		const { result, unmount } = renderHook(() => useImage("cached"));

		await waitFor(() =>
			expect(result.current?.src).toBe("blob:vivid-tab-cached"),
		);
		expect(result.current).toEqual({
			...storedImage,
			src: "blob:vivid-tab-cached",
		});
		expect(createObjectURL).toHaveBeenCalledWith(cachedSrc);
		expect(revokeObjectURL).not.toHaveBeenCalled();

		unmount();
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:vivid-tab-cached");
	});

	test("falls back to the remote source when object URL creation fails", async () => {
		const storedImage = {
			...image("fallback"),
			cachedSrc: new Blob(["cached image"], { type: "image/jpeg" }),
		};
		Object.defineProperty(URL, "createObjectURL", {
			configurable: true,
			value: mock(() => {
				throw new Error("Object URLs unavailable");
			}),
		});
		installIndexedDb({ images: { fallback: storedImage } });

		const { result } = renderHook(() => useImage("fallback"));

		await waitFor(() => expect(result.current).toEqual(storedImage));
	});

	test("returns null for missing records, read errors, and open errors", async () => {
		const missing = installIndexedDb();
		const first = renderHook(() => useImage("missing"));
		await waitFor(() => expect(missing.databases[0]?.close).toHaveBeenCalled());
		expect(first.result.current).toBeNull();
		first.unmount();

		const failedRead = installIndexedDb({
			readErrorIds: new Set(["failed"]),
		});
		const second = renderHook(() => useImage("failed"));
		await waitFor(() =>
			expect(failedRead.databases[0]?.close).toHaveBeenCalled(),
		);
		expect(second.result.current).toBeNull();
		second.unmount();

		const failedOpen = installIndexedDb({
			openError: new Error("Database unavailable"),
		});
		const third = renderHook(() => useImage("unavailable"));
		await waitFor(() => expect(failedOpen.open).toHaveBeenCalledTimes(1));
		expect(third.result.current).toBeNull();
	});

	test("does not let a stale image read replace the latest image", async () => {
		const database = installIndexedDb({ automatic: false });
		const { result, rerender } = renderHook(
			({ id }: { id: string | null }) => useImage(id),
			{ initialProps: { id: "old" } },
		);
		await waitFor(() => expect(database.pending.has("old")).toBe(true));

		rerender({ id: "new" });
		await waitFor(() => expect(database.pending.has("new")).toBe(true));
		act(() => database.resolve("new", image("new")));
		expect(result.current?.id).toBe("new");

		act(() => database.resolve("old", image("old")));
		expect(result.current?.id).toBe("new");
		expect(
			database.databases.every(({ close }) => close.mock.calls.length === 1),
		).toBe(true);
	});

	test.each([
		"oncomplete",
		"onabort",
		"onerror",
	] as const)("closes the database when a transaction fires %s", async (eventName) => {
		const database = installIndexedDb({ automatic: false });
		const { unmount } = renderHook(() => useImage(eventName));
		await waitFor(() => expect(database.pending.has(eventName)).toBe(true));
		const read = database.pending.get(eventName);

		act(() => read?.transaction[eventName]?.());

		expect(read?.database.close).toHaveBeenCalledTimes(1);
		unmount();
	});

	test("ignores a read error that arrives after unmount", async () => {
		const database = installIndexedDb({ automatic: false });
		const { result, unmount } = renderHook(() => useImage("cancelled-read"));
		await waitFor(() =>
			expect(database.pending.has("cancelled-read")).toBe(true),
		);
		const read = database.pending.get("cancelled-read");

		unmount();
		act(() => {
			read?.request.onerror?.();
			read?.transaction.onerror?.();
		});

		expect(result.current).toBeNull();
		expect(read?.database.close).toHaveBeenCalledTimes(1);
	});

	test("ignores an open failure that arrives after unmount", async () => {
		const databaseModule = await import("@/lib/wallpapers/database");
		let rejectOpen: ((error: Error) => void) | undefined;
		const pendingOpen = new Promise<IDBDatabase>((_resolve, reject) => {
			rejectOpen = reject;
		});
		const openImageDB = jest
			.spyOn(databaseModule, "openImageDB")
			.mockReturnValue(pendingOpen);
		const { result, unmount } = renderHook(() => useImage("cancelled-open"));
		await waitFor(() => expect(openImageDB).toHaveBeenCalledTimes(1));

		unmount();
		await act(async () => {
			rejectOpen?.(new Error("Late database failure"));
			await pendingOpen.catch(() => undefined);
			await Promise.resolve();
		});

		expect(result.current).toBeNull();
	});

	test("closes an opened database when transaction creation throws", async () => {
		const databaseModule = await import("@/lib/wallpapers/database");
		const close = mock(() => undefined);
		jest.spyOn(databaseModule, "openImageDB").mockResolvedValue({
			close,
			transaction: () => {
				throw new Error("Transaction unavailable");
			},
		} as unknown as IDBDatabase);

		const { result } = renderHook(() => useImage("transaction-failure"));

		await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
		expect(result.current).toBeNull();
	});
});
