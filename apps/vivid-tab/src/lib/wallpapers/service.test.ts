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
	_downloadOnlineImages: (
		images: readonly WallhavenImage[],
	) => Promise<Array<WallhavenImage & { cachedSrc: Blob }>>;
	_replaceOnlineImages: (
		images: ReadonlyArray<WallhavenImage & { cachedSrc: Blob }>,
		bookmarkedImageIds: readonly string[],
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
const originalFetch = globalThis.fetch;
const originalFetchImages = service._provider.fetchImages;
const originalDownloadOnlineImages = service._downloadOnlineImages;
const originalReplaceOnlineImages = service._replaceOnlineImages;

const makeSettings = () => {
	const settings = createDefaultSettings();
	settings.appearance.wallpapers.onlineImages.enabled = true;
	settings.appearance.background.randomizeWallpaper = "daily";

	return settings;
};
const asDownloaded = (images: readonly WallhavenImage[]) =>
	images.map((image) => ({
		...image,
		cachedSrc: new Blob([image.src], { type: "image/jpeg" }),
	}));

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
	service._downloadOnlineImages = mock(async (images) => asDownloaded(images));
	service._replaceOnlineImages = mock(async () => ({
		ids: [] as string[],
		removedIds: new Set<string>(),
	}));
});

afterEach(() => {
	globalThis.chrome = originalChrome;
	Date.now = originalDateNow;
	globalThis.indexedDB = originalIndexedDB;
	globalThis.fetch = originalFetch;
	service._provider.fetchImages = originalFetchImages;
	service._downloadOnlineImages = originalDownloadOnlineImages;
	service._replaceOnlineImages = originalReplaceOnlineImages;
});

describe("online wallpaper refresh", () => {
	test("downloads unique valid images and skips transport, status, MIME, and empty failures", async () => {
		service._downloadOnlineImages = originalDownloadOnlineImages;
		globalThis.fetch = mock(async (input) => {
			const url = String(input);
			if (url.endsWith("network.jpg")) throw new Error("offline");
			if (url.endsWith("status.jpg")) {
				return { ok: false, blob: mock() } as unknown as Response;
			}

			const blob = url.endsWith("text.jpg")
				? new Blob(["not an image"], { type: "text/plain" })
				: url.endsWith("empty.jpg")
					? new Blob([], { type: "image/jpeg" })
					: new Blob(["image"], { type: "image/jpeg" });

			return {
				blob: async () => blob,
				ok: true,
			} as Response;
		}) as unknown as typeof fetch;
		const good = {
			src: "https://wallhaven.cc/good.jpg",
			thumbnailSrc: "https://wallhaven.cc/good-thumb.jpg",
		};

		const result = await service._downloadOnlineImages([
			good,
			good,
			{
				src: "https://wallhaven.cc/network.jpg",
				thumbnailSrc: "network-thumb",
			},
			{
				src: "https://wallhaven.cc/status.jpg",
				thumbnailSrc: "status-thumb",
			},
			{
				src: "https://wallhaven.cc/text.jpg",
				thumbnailSrc: "text-thumb",
			},
			{
				src: "https://wallhaven.cc/empty.jpg",
				thumbnailSrc: "empty-thumb",
			},
		]);

		expect(globalThis.fetch).toHaveBeenCalledTimes(5);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(
			expect.objectContaining({
				...good,
				cachedSrc: expect.any(Blob),
			}),
		);
	});

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
		expect(JSON.parse(write.settings)).toEqual(createDefaultSettings());
	});

	test("preserves legacy settings before replacing them with defaults", async () => {
		const storage = installChromeMock();
		const legacySettings = JSON.stringify({ theme: "dark" });
		storage.syncGet.mockResolvedValue({ settings: legacySettings });

		await wallpaper.fetchOnlineImages(true);

		expect(storage.syncSet).toHaveBeenCalledWith({
			[LEGACY_SETTINGS_STORAGE_KEY]: legacySettings,
			settings: serializeSettings(createDefaultSettings()),
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
		expect(service._replaceOnlineImages).toHaveBeenCalledWith(
			asDownloaded(images),
			[],
		);
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
			"uploaded",
		);
		expect(storage.localSet).toHaveBeenCalledWith({
			[LAST_ONLINE_IMAGES_FETCHED_AT]: String(now),
		});
	});

	test("records a successful refresh when every downloaded URL is already saved", async () => {
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
		expect(storage.syncSet).toHaveBeenCalledTimes(1);
		expect(storage.localSet).toHaveBeenCalledTimes(1);
	});

	test("preserves existing cache and settings when every download fails", async () => {
		const settings = makeSettings();
		settings.appearance.wallpapers.images = ["existing-online"];
		settings.appearance.wallpapers.selectedImageId = "existing-online";
		const storage = installChromeMock({ settings });
		service._provider.fetchImages = mock(async () => [
			{
				src: "https://wallhaven.cc/unavailable.jpg",
				thumbnailSrc: "https://wallhaven.cc/unavailable-thumb.jpg",
			},
		]);
		service._downloadOnlineImages = mock(async () => []);

		await wallpaper.fetchOnlineImages(true);

		expect(service._replaceOnlineImages).not.toHaveBeenCalled();
		expect(storage.syncGet).toHaveBeenCalledTimes(1);
		expect(storage.syncSet).not.toHaveBeenCalled();
		expect(storage.localSet).not.toHaveBeenCalled();
	});

	test("publishes only full images that downloaded successfully", async () => {
		const storage = installChromeMock();
		const images = [
			{
				src: "https://wallhaven.cc/good.jpg",
				thumbnailSrc: "https://wallhaven.cc/good-thumb.jpg",
			},
			{
				src: "https://wallhaven.cc/bad.jpg",
				thumbnailSrc: "https://wallhaven.cc/bad-thumb.jpg",
			},
		];
		const successful = asDownloaded(images.slice(0, 1));
		service._provider.fetchImages = mock(async () => images);
		service._downloadOnlineImages = mock(async () => successful);
		service._replaceOnlineImages = mock(async () => ({
			ids: ["good"],
			removedIds: new Set<string>(),
		}));

		await wallpaper.fetchOnlineImages(true);

		expect(service._replaceOnlineImages).toHaveBeenCalledWith(successful, []);
		expect(storage.syncSet).toHaveBeenCalledTimes(1);
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

	test("keeps bookmarked provider records and skips new records with the same URL", async () => {
		await deleteWallpaperDatabase();
		const settings = makeSettings();
		settings.appearance.wallpapers.images = [
			"local_manual",
			"bookmarked-online",
			"old-online",
		];
		settings.appearance.wallpapers.selectedImageId = "old-online";
		settings.appearance.wallpapers.bookmarkedImageIds = ["bookmarked-online"];
		const storage = installChromeMock({ settings });
		const bookmarkedBlob = new Blob(["saved"], { type: "image/jpeg" });
		await writeStoredImages([
			{
				fetchedAt: 1,
				id: "local_manual",
				source: "local",
				src: "data:image/jpeg;base64,bG9jYWw=",
			},
			{
				cachedSrc: bookmarkedBlob,
				fetchedAt: 1,
				id: "bookmarked-online",
				source: "wallhaven",
				src: "https://wallhaven.cc/saved.jpg",
			},
			{
				cachedSrc: new Blob(["old"], { type: "image/jpeg" }),
				fetchedAt: 1,
				id: "old-online",
				source: "wallhaven",
				src: "https://wallhaven.cc/old.jpg",
			},
		]);
		const images = [
			{
				src: "https://wallhaven.cc/saved.jpg",
				thumbnailSrc: "https://wallhaven.cc/saved-thumb.jpg",
			},
			{
				src: "https://wallhaven.cc/new.jpg",
				thumbnailSrc: "https://wallhaven.cc/new-thumb.jpg",
			},
		];
		service._provider.fetchImages = mock(async () => images);
		service._replaceOnlineImages = originalReplaceOnlineImages;

		try {
			await wallpaper.fetchOnlineImages(true);

			const records = await readStoredImages();
			expect(records).toHaveLength(3);
			expect(records.map(({ id }) => id)).toContain("local_manual");
			expect(records.map(({ id }) => id)).toContain("bookmarked-online");
			expect(records.map(({ id }) => id)).not.toContain("old-online");
			expect(
				records.filter(({ src }) => src === "https://wallhaven.cc/saved.jpg"),
			).toHaveLength(1);
			const newRecord = records.find(
				({ src }) => src === "https://wallhaven.cc/new.jpg",
			);
			expect(newRecord).toHaveProperty("cachedSrc");

			const write = storage.syncSet.mock.calls[0]?.[0] as {
				settings: string;
			};
			const writtenSettings = JSON.parse(write.settings) as ReturnType<
				typeof makeSettings
			>;
			expect(writtenSettings.appearance.wallpapers.images).toEqual([
				"local_manual",
				"bookmarked-online",
				newRecord?.id,
			]);
			expect(writtenSettings.appearance.wallpapers.bookmarkedImageIds).toEqual([
				"bookmarked-online",
			]);
			expect(writtenSettings.appearance.wallpapers.selectedImageId).toBe(
				"local_manual",
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
			service._replaceOnlineImages(
				[
					{
						src: "https://wallhaven.cc/new.jpg",
						thumbnailSrc: "https://wallhaven.cc/new-thumb.jpg",
						cachedSrc: new Blob(["image"], { type: "image/jpeg" }),
					},
				],
				[],
			),
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
