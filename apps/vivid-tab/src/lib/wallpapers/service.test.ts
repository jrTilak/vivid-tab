import {
	afterEach,
	beforeEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "@test/jest";
import { LAST_ONLINE_IMAGES_FETCHED_AT } from "@/constants/keys";
import {
	createDefaultSettings,
	LEGACY_SETTINGS_STORAGE_KEY,
	serializeSettings,
} from "@/lib/settings-storage";
import {
	deleteWallpaperDatabase,
	openImageDB,
	type StoredImage,
} from "./database";
import { wallpaper } from "./service";
import type { WallhavenImage } from "./wallhaven";

type ReplaceResult = {
	ids: string[];
	removedIds: Set<string>;
};

type WallpaperInternals = {
	_provider: {
		fetchImages: (
			searchTerms?: readonly string[],
			count?: number,
		) => Promise<WallhavenImage[]>;
	};
	_replaceOnlineImages: (
		images: readonly WallhavenImage[],
	) => Promise<ReplaceResult>;
};

type StorageMocks = {
	localGet: ReturnType<typeof mock>;
	localSet: ReturnType<typeof mock>;
	syncGet: ReturnType<typeof mock>;
	syncSet: ReturnType<typeof mock>;
	tabsQuery: ReturnType<typeof mock>;
};

const service = wallpaper as unknown as WallpaperInternals;
const originalChrome = globalThis.chrome;
const originalDateNow = Date.now;
const originalIndexedDB = globalThis.indexedDB;
const originalFetchImages = service._provider.fetchImages;
const originalReplaceOnlineImages = service._replaceOnlineImages;

const makeSettings = () => createDefaultSettings();

const installFailingIndexedDB = (
	outcome: "abort" | "error",
	transactionError: DOMException | null,
) => {
	const getAllRequest = {} as IDBRequest<StoredImage[]>;
	const store = {
		getAll: () => getAllRequest,
	} as unknown as IDBObjectStore;
	const transaction = {
		error: transactionError,
		objectStore: () => store,
		onabort: null,
		oncomplete: null,
		onerror: null,
	} as unknown as IDBTransaction;
	const close = mock(() => undefined);
	const database = {
		close,
		transaction: () => {
			queueMicrotask(() => {
				const event = new Event(outcome);
				if (outcome === "error") {
					transaction.onerror?.call(transaction, event);
				} else {
					transaction.onabort?.call(transaction, event);
				}
			});

			return transaction;
		},
	} as unknown as IDBDatabase;
	const openRequest = {
		onerror: null,
		onsuccess: null,
		onupgradeneeded: null,
		result: database,
	} as unknown as IDBOpenDBRequest;
	const open = mock(() => {
		queueMicrotask(() => {
			openRequest.onsuccess?.call(openRequest, new Event("success"));
		});

		return openRequest;
	});

	globalThis.indexedDB = { open } as unknown as IDBFactory;

	return close;
};

const writeStoredImages = async (images: readonly StoredImage[]) => {
	const db = await openImageDB();

	try {
		await new Promise<void>((resolve, reject) => {
			const transaction = db.transaction("images", "readwrite");
			const store = transaction.objectStore("images");
			for (const image of images) store.put(image);
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
	} finally {
		db.close();
	}
};

const readStoredImages = async (): Promise<StoredImage[]> => {
	const db = await openImageDB();

	try {
		return await new Promise<StoredImage[]>((resolve, reject) => {
			const transaction = db.transaction("images", "readonly");
			const request = transaction.objectStore("images").getAll();
			request.onsuccess = () => resolve(request.result as StoredImage[]);
			request.onerror = () => reject(request.error);
		});
	} finally {
		db.close();
	}
};

const installChromeMock = ({
	settings = makeSettings(),
	lastFetchedAt,
	activeTabs = [{ id: 1 }],
}: {
	settings?: ReturnType<typeof makeSettings>;
	lastFetchedAt?: unknown;
	activeTabs?: Array<{ id: number }>;
} = {}): StorageMocks => {
	const serialized = serializeSettings(settings);
	const syncGet = mock(async () => ({ settings: serialized }));
	const syncSet = mock(async () => undefined);
	const localGet = mock(async () => ({
		[LAST_ONLINE_IMAGES_FETCHED_AT]: lastFetchedAt,
	}));
	const localSet = mock(async () => undefined);
	const tabsQuery = mock(async () => activeTabs);

	globalThis.chrome = {
		storage: {
			local: { get: localGet, set: localSet },
			sync: { get: syncGet, set: syncSet },
		},
		tabs: { query: tabsQuery },
	} as unknown as typeof chrome;

	return { localGet, localSet, syncGet, syncSet, tabsQuery };
};

beforeEach(() => {
	service._provider.fetchImages = mock(async () => []);
	service._replaceOnlineImages = mock(async () => ({
		ids: [] as string[],
		removedIds: new Set<string>(),
	}));
});

afterEach(() => {
	globalThis.chrome = originalChrome;
	Date.now = originalDateNow;
	globalThis.indexedDB = originalIndexedDB;
	service._provider.fetchImages = originalFetchImages;
	service._replaceOnlineImages = originalReplaceOnlineImages;
});

describe("online wallpaper refresh", () => {
	test("does no work when online images are disabled", async () => {
		const settings = makeSettings();
		settings.appearance.wallpapers.onlineImages.enabled = false;
		const storage = installChromeMock({ settings });

		await wallpaper.fetchOnlineImages(true);

		expect(service._provider.fetchImages).not.toHaveBeenCalled();
		expect(storage.localGet).not.toHaveBeenCalled();
		expect(storage.syncSet).not.toHaveBeenCalled();
	});

	test("respects disabled rotation unless the refresh is forced", async () => {
		const settings = makeSettings();
		settings.appearance.background.randomizeWallpaper = "off";
		const storage = installChromeMock({ settings });

		await wallpaper.fetchOnlineImages();
		expect(service._provider.fetchImages).not.toHaveBeenCalled();

		await wallpaper.fetchOnlineImages(true);
		expect(service._provider.fetchImages).toHaveBeenCalledWith(
			["anime", " superhero", " comics"],
			20,
		);
		expect(storage.localGet).not.toHaveBeenCalled();
	});

	test("skips recent automatic refreshes before querying active tabs", async () => {
		const now = 2_000_000_000_000;
		Date.now = mock(() => now);
		const storage = installChromeMock({ lastFetchedAt: String(now - 1_000) });

		await wallpaper.fetchOnlineImages();

		expect(storage.localGet).toHaveBeenCalledWith(
			LAST_ONLINE_IMAGES_FETCHED_AT,
		);
		expect(storage.tabsQuery).not.toHaveBeenCalled();
		expect(service._provider.fetchImages).not.toHaveBeenCalled();
	});

	test("skips an automatic refresh when no browser tab is active", async () => {
		const storage = installChromeMock({
			activeTabs: [],
			lastFetchedAt: "invalid",
		});

		await wallpaper.fetchOnlineImages();

		expect(storage.tabsQuery).toHaveBeenCalledWith({ active: true });
		expect(service._provider.fetchImages).not.toHaveBeenCalled();
	});

	test("refreshes after an expired cache when a browser tab is active", async () => {
		const storage = installChromeMock({ lastFetchedAt: "invalid" });

		await wallpaper.fetchOnlineImages();

		expect(storage.tabsQuery).toHaveBeenCalledWith({ active: true });
		expect(service._provider.fetchImages).toHaveBeenCalledTimes(1);
	});

	test("does not replace storage when the provider returns no images", async () => {
		const storage = installChromeMock();

		await wallpaper.fetchOnlineImages(true);

		expect(service._replaceOnlineImages).not.toHaveBeenCalled();
		expect(storage.syncSet).not.toHaveBeenCalled();
		expect(storage.localSet).not.toHaveBeenCalled();
	});

	test("stops when online images are disabled during the network request", async () => {
		const enabledSettings = makeSettings();
		const disabledSettings = makeSettings();
		disabledSettings.appearance.wallpapers.onlineImages.enabled = false;
		const storage = installChromeMock({ settings: enabledSettings });
		storage.syncGet
			.mockResolvedValueOnce({ settings: serializeSettings(enabledSettings) })
			.mockResolvedValueOnce({ settings: serializeSettings(disabledSettings) });
		service._provider.fetchImages = mock(async () => [
			{
				src: "https://wallhaven.cc/new.jpg",
				thumbnailSrc: "https://wallhaven.cc/new-thumb.jpg",
			},
		]);

		await wallpaper.fetchOnlineImages(true);

		expect(service._replaceOnlineImages).not.toHaveBeenCalled();
		expect(storage.syncSet).not.toHaveBeenCalled();
		expect(storage.localSet).not.toHaveBeenCalled();
	});

	test("canonicalizes invalid stored settings before refreshing", async () => {
		const storage = installChromeMock();
		storage.syncGet.mockResolvedValue({ settings: "{invalid-json" });

		await wallpaper.fetchOnlineImages(true);

		expect(storage.syncSet).toHaveBeenCalledTimes(1);
		const write = storage.syncSet.mock.calls[0]?.[0] as { settings: string };
		expect(JSON.parse(write.settings)).toEqual(makeSettings());
	});

	test("preserves legacy settings before replacing them with defaults", async () => {
		const storage = installChromeMock();
		const legacySettings = JSON.stringify({ theme: "dark" });
		storage.syncGet.mockResolvedValue({ settings: legacySettings });

		await wallpaper.fetchOnlineImages(true);

		expect(storage.syncSet).toHaveBeenCalledWith({
			[LEGACY_SETTINGS_STORAGE_KEY]: legacySettings,
			settings: serializeSettings(makeSettings()),
		});
	});

	test("preserves user images and repairs a removed selected image", async () => {
		const now = 2_000_000_000_000;
		Date.now = mock(() => now);
		const settings = makeSettings();
		settings.appearance.wallpapers.images = ["uploaded", "old-online"];
		settings.appearance.wallpapers.selectedImageId = "old-online";
		settings.appearance.wallpapers.onlineImages.keywords = " Space,City ";
		const storage = installChromeMock({ settings });
		const images = [
			{
				src: "https://wallhaven.cc/new.jpg",
				thumbnailSrc: "https://wallhaven.cc/new-thumb.jpg",
			},
		];
		service._provider.fetchImages = mock(async () => images);
		service._replaceOnlineImages = mock(async () => ({
			ids: ["new-online"],
			removedIds: new Set(["old-online"]),
		}));

		await wallpaper.fetchOnlineImages(true);

		expect(service._provider.fetchImages).toHaveBeenCalledWith(
			[" Space", "City "],
			20,
		);
		expect(service._replaceOnlineImages).toHaveBeenCalledWith(images);
		expect(storage.syncSet).toHaveBeenCalledTimes(1);
		const writtenValue = storage.syncSet.mock.calls[0]?.[0] as {
			settings: string;
		};
		const writtenSettings = JSON.parse(writtenValue.settings) as ReturnType<
			typeof makeSettings
		>;
		expect(writtenSettings.appearance.wallpapers.images).toEqual([
			"uploaded",
			"new-online",
		]);
		expect(writtenSettings.appearance.wallpapers.selectedImageId).toBe(
			"new-online",
		);
		expect(storage.localSet).toHaveBeenCalledWith({
			[LAST_ONLINE_IMAGES_FETCHED_AT]: String(now),
		});
	});

	test("does not persist a refresh when replacement produces no IDs", async () => {
		const storage = installChromeMock();
		service._provider.fetchImages = mock(async () => [
			{
				src: "https://wallhaven.cc/new.jpg",
				thumbnailSrc: "https://wallhaven.cc/new-thumb.jpg",
			},
		]);

		await wallpaper.fetchOnlineImages(true);

		expect(service._replaceOnlineImages).toHaveBeenCalledTimes(1);
		expect(storage.syncGet).toHaveBeenCalledTimes(2);
		expect(storage.syncSet).not.toHaveBeenCalled();
		expect(storage.localSet).not.toHaveBeenCalled();
	});

	test("atomically replaces only Wallhaven records in IndexedDB", async () => {
		await deleteWallpaperDatabase();
		const now = 2_000_000_000_000;
		Date.now = mock(() => now);
		const settings = makeSettings();
		settings.appearance.wallpapers.images = ["uploaded", "old-online"];
		settings.appearance.wallpapers.selectedImageId = "uploaded";
		const storage = installChromeMock({ settings });
		await writeStoredImages([
			{
				fetchedAt: 1,
				id: "uploaded",
				source: "upload",
				src: "data:image/jpeg;base64,custom",
			},
			{
				fetchedAt: 1,
				id: "old-online",
				source: "wallhaven",
				src: "https://wallhaven.cc/old.jpg",
			},
		]);
		service._provider.fetchImages = mock(async () => [
			{
				src: "https://wallhaven.cc/new.jpg",
				thumbnailSrc: "https://wallhaven.cc/new-thumb.jpg",
			},
		]);
		service._replaceOnlineImages = originalReplaceOnlineImages;

		try {
			await wallpaper.fetchOnlineImages(true);

			const storedImages = await readStoredImages();
			expect(storedImages).toHaveLength(2);
			expect(storedImages).toContainEqual(
				expect.objectContaining({ id: "uploaded", source: "upload" }),
			);
			const onlineImage = storedImages.find(
				(image) => image.source === "wallhaven",
			);
			expect(onlineImage).toEqual(
				expect.objectContaining({
					fetchedAt: now,
					src: "https://wallhaven.cc/new.jpg",
					thumbnailSrc: "https://wallhaven.cc/new-thumb.jpg",
				}),
			);
			expect(onlineImage?.id).not.toBe("old-online");

			const write = storage.syncSet.mock.calls[0]?.[0] as {
				settings: string;
			};
			const writtenSettings = JSON.parse(write.settings) as ReturnType<
				typeof makeSettings
			>;
			expect(writtenSettings.appearance.wallpapers.images).toEqual([
				"uploaded",
				onlineImage?.id,
			]);
			expect(writtenSettings.appearance.wallpapers.selectedImageId).toBe(
				"uploaded",
			);
		} finally {
			await deleteWallpaperDatabase();
		}
	});

	test.each([
		["error", new DOMException("quota exceeded"), "quota exceeded"],
		["error", null, "Failed to replace wallpapers"],
		["abort", null, "Replacing wallpapers was aborted"],
	] as const)("closes IndexedDB after a transaction %s", async (outcome, transactionError, message) => {
		const close = installFailingIndexedDB(outcome, transactionError);
		service._replaceOnlineImages = originalReplaceOnlineImages;

		await expect(
			service._replaceOnlineImages([
				{
					src: "https://wallhaven.cc/new.jpg",
					thumbnailSrc: "https://wallhaven.cc/new-thumb.jpg",
				},
			]),
		).rejects.toThrow(message);
		expect(close).toHaveBeenCalledTimes(1);
	});

	test("coalesces concurrent refresh requests", async () => {
		const settings = makeSettings();
		const serialized = serializeSettings(settings);
		let releaseRead: ((value: { settings: string }) => void) | undefined;
		const firstRead = new Promise<{ settings: string }>((resolve) => {
			releaseRead = resolve;
		});
		const syncGet = mock(() => firstRead);
		const syncSet = mock(async () => undefined);
		globalThis.chrome = {
			storage: {
				local: {
					get: mock(async () => ({})),
					set: mock(async () => undefined),
				},
				sync: { get: syncGet, set: syncSet },
			},
			tabs: { query: mock(async () => [{ id: 1 }]) },
		} as unknown as typeof chrome;

		const first = wallpaper.fetchOnlineImages(true);
		const second = wallpaper.fetchOnlineImages(true);
		expect(first).toBe(second);
		releaseRead?.({ settings: serialized });
		await Promise.all([first, second]);

		expect(syncGet).toHaveBeenCalledTimes(1);
		expect(service._provider.fetchImages).toHaveBeenCalledTimes(1);
	});

	test("runs a forced refresh queued behind an automatic refresh", async () => {
		const settings = makeSettings();
		settings.appearance.background.randomizeWallpaper = "off";
		const serialized = serializeSettings(settings);
		let releaseRead: ((value: { settings: string }) => void) | undefined;
		const firstRead = new Promise<{ settings: string }>((resolve) => {
			releaseRead = resolve;
		});
		const syncGet = mock()
			.mockImplementationOnce(() => firstRead)
			.mockResolvedValue({ settings: serialized });
		globalThis.chrome = {
			storage: {
				local: {
					get: mock(async () => ({})),
					set: mock(async () => undefined),
				},
				sync: {
					get: syncGet,
					set: mock(async () => undefined),
				},
			},
			tabs: { query: mock(async () => [{ id: 1 }]) },
		} as unknown as typeof chrome;

		const automatic = wallpaper.fetchOnlineImages();
		const forced = wallpaper.fetchOnlineImages(true);
		expect(forced).toBe(automatic);
		releaseRead?.({ settings: serialized });
		await forced;

		expect(syncGet).toHaveBeenCalledTimes(2);
		expect(service._provider.fetchImages).toHaveBeenCalledTimes(1);
	});

	test("logs browser failures and allows a later retry", async () => {
		const syncGet = mock(async () => {
			throw new Error("storage unavailable");
		});
		globalThis.chrome = {
			storage: { sync: { get: syncGet } },
		} as unknown as typeof chrome;
		const consoleError = spyOn(console, "error").mockImplementation(
			() => undefined,
		);

		await wallpaper.fetchOnlineImages(true);
		await wallpaper.fetchOnlineImages(true);

		expect(syncGet).toHaveBeenCalledTimes(2);
		expect(consoleError).toHaveBeenCalledTimes(2);
		consoleError.mockRestore();
	});
});
