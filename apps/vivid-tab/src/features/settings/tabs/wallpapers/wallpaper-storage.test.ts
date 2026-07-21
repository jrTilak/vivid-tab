import {
	afterEach,
	beforeEach,
	describe,
	expect,
	jest,
	test,
} from "@test/jest";
import {
	deleteWallpaperDatabase,
	openImageDB,
	type StoredImage,
} from "@/lib/wallpapers/database";
import {
	deleteStoredWallpaper,
	storeLocalWallpaper,
} from "./wallpaper-storage";

const originalFileReader = globalThis.FileReader;

const failNextWriteTransaction = (
	event: "abort" | "error",
	error: DOMException | null = null,
) => {
	const transaction = {
		error,
		onabort: null as ((event: Event) => void) | null,
		oncomplete: null as ((event: Event) => void) | null,
		onerror: null as ((event: Event) => void) | null,
		objectStore: () => {
			const fail = () =>
				queueMicrotask(() => transaction[`on${event}`]?.(new Event(event)));

			return { delete: fail, put: fail };
		},
	};
	const transactionSpy = jest
		.spyOn(IDBDatabase.prototype, "transaction")
		.mockReturnValue(transaction as unknown as IDBTransaction);

	return transactionSpy;
};

const readStoredImage = async (
	id: string,
): Promise<StoredImage | undefined> => {
	const db = await openImageDB();

	try {
		return await new Promise((resolve, reject) => {
			const transaction = db.transaction("images", "readonly");
			const request = transaction.objectStore("images").get(id);
			request.onsuccess = () =>
				resolve(request.result as StoredImage | undefined);
			request.onerror = () => reject(request.error);
		});
	} finally {
		db.close();
	}
};

beforeEach(async () => {
	await deleteWallpaperDatabase();
});

afterEach(async () => {
	globalThis.FileReader = originalFileReader;
	jest.restoreAllMocks();
	await deleteWallpaperDatabase();
});

describe("wallpaper storage", () => {
	test("stores a local file as a data URL with local metadata", async () => {
		const before = Date.now();
		const id = await storeLocalWallpaper(
			new File(["image bytes"], "wallpaper.png", { type: "image/png" }),
		);
		const after = Date.now();
		const stored = await readStoredImage(id);

		expect(id).toMatch(/^local_\d+_[0-9a-f-]+$/);
		expect(stored?.id).toBe(id);
		expect(stored?.source).toBe("local");
		expect(stored?.src).toBe("data:image/png;base64,aW1hZ2UgYnl0ZXM=");
		expect(stored?.fetchedAt).toBeGreaterThanOrEqual(before);
		expect(stored?.fetchedAt).toBeLessThanOrEqual(after);
	});

	test("deletes an existing wallpaper and tolerates an unknown ID", async () => {
		const id = await storeLocalWallpaper(
			new File(["image"], "wallpaper.png", { type: "image/png" }),
		);

		await deleteStoredWallpaper(id);
		expect(await readStoredImage(id)).toBeUndefined();
		await expect(deleteStoredWallpaper("missing")).resolves.toBeUndefined();
	});

	test("rejects when the selected file cannot be read", async () => {
		class FailingFileReader {
			error = new DOMException("file read failed");
			onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
			onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
			result: string | ArrayBuffer | null = null;

			readAsDataURL() {
				this.onerror?.(new ProgressEvent("error") as ProgressEvent<FileReader>);
			}
		}
		globalThis.FileReader = FailingFileReader as unknown as typeof FileReader;

		await expect(
			storeLocalWallpaper(new File(["image"], "wallpaper.png")),
		).rejects.toThrow("file read failed");
	});

	test("reports transaction errors and aborts while storing", async () => {
		const setupDb = await openImageDB();
		setupDb.close();
		let transactionSpy = failNextWriteTransaction("error");
		const file = new File(["image"], "wallpaper.png", { type: "image/png" });

		await expect(storeLocalWallpaper(file)).rejects.toThrow(
			"Failed to store the image",
		);
		transactionSpy.mockRestore();

		transactionSpy = failNextWriteTransaction(
			"abort",
			new DOMException("write aborted"),
		);
		await expect(storeLocalWallpaper(file)).rejects.toThrow("write aborted");
		transactionSpy.mockRestore();
	});

	test("reports transaction errors and aborts while deleting", async () => {
		const setupDb = await openImageDB();
		setupDb.close();
		let transactionSpy = failNextWriteTransaction("error");

		await expect(deleteStoredWallpaper("wallpaper")).rejects.toThrow(
			"Failed to delete the image",
		);
		transactionSpy.mockRestore();

		transactionSpy = failNextWriteTransaction("abort");
		await expect(deleteStoredWallpaper("wallpaper")).rejects.toThrow(
			"Deleting the image was aborted",
		);
		transactionSpy.mockRestore();
	});
});
