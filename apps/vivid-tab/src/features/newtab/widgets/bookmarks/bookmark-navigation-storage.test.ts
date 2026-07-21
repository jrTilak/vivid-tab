import { beforeEach, describe, expect, mock, test } from "@test/jest";
import {
	readActiveRootFolder,
	writeActiveRootFolder,
} from "./bookmark-navigation-storage";

const localGet = mock(async () => ({}));
const localSet = mock(async () => undefined);
const syncGet = mock(async () => ({}));
const syncRemove = mock(async () => undefined);

beforeEach(() => {
	localGet.mockReset();
	localGet.mockResolvedValue({});
	localSet.mockReset();
	localSet.mockResolvedValue(undefined);
	syncGet.mockReset();
	syncGet.mockResolvedValue({});
	syncRemove.mockReset();
	syncRemove.mockResolvedValue(undefined);

	globalThis.chrome = {
		storage: {
			local: { get: localGet, set: localSet },
			sync: { get: syncGet, remove: syncRemove },
		},
	} as unknown as typeof chrome;
});

describe("bookmark navigation storage", () => {
	test("prefers the profile-local root", async () => {
		localGet.mockResolvedValue({ activeRootFolder: "local-folder" });

		expect(await readActiveRootFolder()).toBe("local-folder");
		expect(syncGet).not.toHaveBeenCalled();
	});

	test("migrates the old sync root once", async () => {
		syncGet.mockResolvedValue({ activeRootFolder: "legacy-folder" });

		expect(await readActiveRootFolder()).toBe("legacy-folder");
		expect(localSet).toHaveBeenCalledWith({
			activeRootFolder: "legacy-folder",
		});
		expect(syncRemove).toHaveBeenCalledWith("activeRootFolder");
	});

	test("ignores invalid values in both storage areas", async () => {
		localGet.mockResolvedValue({ activeRootFolder: 10 });
		syncGet.mockResolvedValue({ activeRootFolder: null });

		expect(await readActiveRootFolder()).toBeUndefined();
		expect(localSet).not.toHaveBeenCalled();
		expect(syncRemove).not.toHaveBeenCalled();
	});

	test("writes only to local storage and forwards failures", async () => {
		await writeActiveRootFolder("folder");
		expect(localSet).toHaveBeenCalledWith({ activeRootFolder: "folder" });

		localGet.mockRejectedValueOnce(new Error("unavailable"));
		expect(readActiveRootFolder()).rejects.toThrow("unavailable");
	});
});
