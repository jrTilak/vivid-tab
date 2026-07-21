import { afterEach, beforeEach, describe, expect, test } from "@test/jest";
import {
	deleteWallpaperDatabase,
	openImageDB,
	type StoredImage,
} from "./database";

const fakeIndexedDB = globalThis.indexedDB;

const finishTransaction = (transaction: IDBTransaction) =>
	new Promise<void>((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
		transaction.onabort = () => reject(transaction.error);
	});

beforeEach(async () => {
	globalThis.indexedDB = fakeIndexedDB;
	await deleteWallpaperDatabase();
});

afterEach(async () => {
	globalThis.indexedDB = fakeIndexedDB;
	await deleteWallpaperDatabase();
});

describe("wallpaper database", () => {
	test("creates the image store and preserves records between connections", async () => {
		const firstDb = await openImageDB();
		expect(firstDb.version).toBe(2);
		expect(firstDb.objectStoreNames.contains("images")).toBe(true);

		const image: StoredImage = {
			fetchedAt: 1,
			id: "local-1",
			source: "local",
			src: "data:image/png;base64,AA==",
		};
		const write = firstDb.transaction("images", "readwrite");
		write.objectStore("images").put(image);
		await finishTransaction(write);
		firstDb.close();

		const secondDb = await openImageDB();
		const read = secondDb.transaction("images", "readonly");
		const request = read.objectStore("images").get(image.id);
		await finishTransaction(read);

		expect(request.result).toEqual(image);
		secondDb.close();
	});

	test("upgrades an existing database without recreating its image store", async () => {
		const request = indexedDB.open("ImageDB", 1);
		request.onupgradeneeded = () => {
			request.result.createObjectStore("images", { keyPath: "id" });
		};
		const legacyDatabase = await new Promise<IDBDatabase>((resolve, reject) => {
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
		legacyDatabase.close();

		const upgradedDatabase = await openImageDB();
		expect(upgradedDatabase.version).toBe(2);
		expect(upgradedDatabase.objectStoreNames.contains("images")).toBe(true);
		upgradedDatabase.close();
	});

	test("deletes every stored record", async () => {
		const db = await openImageDB();
		const write = db.transaction("images", "readwrite");
		write.objectStore("images").put({
			fetchedAt: 1,
			id: "remote-1",
			source: "wallhaven",
			src: "https://example.com/image.jpg",
		});
		await finishTransaction(write);
		db.close();

		await deleteWallpaperDatabase();

		const reopened = await openImageDB();
		const read = reopened.transaction("images", "readonly");
		const count = read.objectStore("images").count();
		await finishTransaction(read);
		expect(count.result).toBe(0);
		reopened.close();
	});

	test("reports database open failures", async () => {
		const request = {
			error: new DOMException("open failed"),
			onerror: null as ((event: Event) => void) | null,
			onsuccess: null,
			onupgradeneeded: null,
		};
		globalThis.indexedDB = {
			open: () => {
				queueMicrotask(() => request.onerror?.(new Event("error")));
				return request;
			},
		} as unknown as IDBFactory;

		await expect(openImageDB()).rejects.toThrow(
			"Failed to open ImageDB: open failed",
		);
	});

	test("reports a stable fallback when IndexedDB omits its open error", async () => {
		const request = {
			error: null,
			onerror: null as ((event: Event) => void) | null,
			onsuccess: null,
			onupgradeneeded: null,
		};
		globalThis.indexedDB = {
			open: () => {
				queueMicrotask(() => request.onerror?.(new Event("error")));
				return request;
			},
		} as unknown as IDBFactory;

		await expect(openImageDB()).rejects.toThrow(
			"Failed to open ImageDB: unknown error",
		);
	});

	test("reports database deletion failures", async () => {
		const error = new DOMException("delete failed");
		const request = {
			error,
			onerror: null as ((event: Event) => void) | null,
			onsuccess: null,
		};
		globalThis.indexedDB = {
			deleteDatabase: () => {
				queueMicrotask(() => request.onerror?.(new Event("error")));
				return request;
			},
		} as unknown as IDBFactory;

		await expect(deleteWallpaperDatabase()).rejects.toBe(error);
	});

	test("reports a stable fallback when IndexedDB omits its deletion error", async () => {
		const request = {
			error: null,
			onerror: null as ((event: Event) => void) | null,
			onsuccess: null,
		};
		globalThis.indexedDB = {
			deleteDatabase: () => {
				queueMicrotask(() => request.onerror?.(new Event("error")));
				return request;
			},
		} as unknown as IDBFactory;

		await expect(deleteWallpaperDatabase()).rejects.toThrow(
			"Failed to delete the wallpaper database",
		);
	});
});
