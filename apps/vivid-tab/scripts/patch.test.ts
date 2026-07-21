import {
	chmodSync,
	existsSync,
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "@test/jest";

type MainDependencies = {
	findFiles?: () => string[];
	patch?: (filePath: string) => boolean;
	removeTsserverShim?: () => boolean;
	writeLog?: (message: string, color?: string) => void;
};

type PatchModule = {
	findPackageFiles: (options?: {
		currentWorkingDirectory?: string;
		scriptDirectory?: string;
	}) => string[];
	main: (dependencies?: MainDependencies) => boolean;
	patchFile: (filePath: string) => boolean;
	removeDanglingTsserverShim: (filePath?: string) => boolean;
};

const { findPackageFiles, main, patchFile, removeDanglingTsserverShim } =
	require("./patch.ts") as PatchModule;

const temporaryDirectories: string[] = [];
let consoleLog: ReturnType<typeof spyOn>;

const makeTemporaryDirectory = () => {
	const directory = mkdtempSync(join(tmpdir(), "vivid-tab-patch-"));
	temporaryDirectories.push(directory);
	return directory;
};

const writeFixture = (root: string, relativePath: string, content = "") => {
	const filePath = join(root, relativePath);
	mkdirSync(join(filePath, ".."), { recursive: true });
	writeFileSync(filePath, content, "utf8");
	return filePath;
};

beforeEach(() => {
	consoleLog = spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
	consoleLog.mockRestore();
	for (const directory of temporaryDirectories.splice(0)) {
		rmSync(directory, { force: true, recursive: true });
	}
});

describe("postinstall file patching", () => {
	test("patches both require quote styles and is idempotent", () => {
		const root = makeTemporaryDirectory();
		const target = writeFixture(
			root,
			"package.cjs",
			"const fs = require(\"node:fs\");\nconst path = require('node:path');\n",
		);

		expect(patchFile(target)).toBe(true);
		const patched = readFileSync(target, "utf8");
		expect(patched).toBe(
			"const fs = require(\"fs\");\nconst path = require('path');\n",
		);
		expect(patchFile(target)).toBe(true);
		expect(readFileSync(target, "utf8")).toBe(patched);
	});

	test("returns false for missing and unreadable targets", () => {
		const root = makeTemporaryDirectory();

		expect(patchFile(join(root, "missing.cjs"))).toBe(false);
		expect(patchFile(root)).toBe(false);
	});

	test("discovers direct and Bun-store package files without duplicates", () => {
		const root = makeTemporaryDirectory();
		const cwd = join(root, "packages", "extension");
		const scriptDirectory = join(root, "apps", "extension", "scripts");
		mkdirSync(cwd, { recursive: true });
		mkdirSync(scriptDirectory, { recursive: true });
		const directJiti = writeFixture(root, "node_modules/jiti/dist/jiti.cjs");
		const directOxide = writeFixture(
			root,
			"node_modules/@tailwindcss/oxide/index.js",
		);
		const storedJiti = writeFixture(
			root,
			"node_modules/.bun/jiti@2.0.0/node_modules/jiti/lib/jiti.cjs",
		);
		const storedOxide = writeFixture(
			root,
			"node_modules/.bun/@tailwindcss+oxide@4.0.0/node_modules/@tailwindcss/oxide/index.js",
		);
		mkdirSync(join(root, "node_modules/.bun/unrelated@1.0.0"), {
			recursive: true,
		});

		expect(
			findPackageFiles({ currentWorkingDirectory: cwd, scriptDirectory }),
		).toEqual(
			[directJiti, directOxide, storedJiti, storedOxide]
				.map((filePath) => realpathSync(filePath))
				.sort(),
		);
	});
});

describe("dangling tsserver cleanup", () => {
	test("removes only a dangling symlink and is safe to repeat", () => {
		const root = makeTemporaryDirectory();
		const shim = join(root, "tsserver");
		symlinkSync(join(root, "missing-target"), shim);

		expect(removeDanglingTsserverShim(shim)).toBe(true);
		expect(existsSync(shim)).toBe(false);
		expect(removeDanglingTsserverShim(shim)).toBe(true);
	});

	test("preserves regular files and valid symlinks", () => {
		const root = makeTemporaryDirectory();
		const target = writeFixture(root, "typescript/bin/tsserver", "executable");
		const shim = join(root, "tsserver");
		symlinkSync(target, shim);

		expect(removeDanglingTsserverShim(target)).toBe(true);
		expect(removeDanglingTsserverShim(shim)).toBe(true);
		expect(lstatSync(target).isFile()).toBe(true);
		expect(lstatSync(shim).isSymbolicLink()).toBe(true);
	});

	test("reports an unlink failure without throwing", () => {
		const root = makeTemporaryDirectory();
		const shim = join(root, "tsserver");
		symlinkSync(join(root, "missing-target"), shim);
		chmodSync(root, 0o555);

		try {
			expect(removeDanglingTsserverShim(shim)).toBe(false);
			expect(lstatSync(shim).isSymbolicLink()).toBe(true);
		} finally {
			chmodSync(root, 0o755);
		}
	});
});

describe("postinstall main", () => {
	test("treats an empty patch list as an idempotent success", () => {
		const patch = mock(() => true);
		const writeLog = mock(() => undefined);

		expect(
			main({
				findFiles: () => [],
				patch,
				removeTsserverShim: () => true,
				writeLog,
			}),
		).toBe(true);
		expect(patch).not.toHaveBeenCalled();
		expect(writeLog).toHaveBeenCalledWith(
			"⚠️  No files found to patch",
			"yellow",
		);
		expect(
			main({
				findFiles: () => [],
				removeTsserverShim: () => false,
				writeLog,
			}),
		).toBe(false);
	});

	test("reports complete and partial patch outcomes", () => {
		const successfulLog = mock(() => undefined);
		expect(
			main({
				findFiles: () => ["one", "two"],
				patch: () => true,
				removeTsserverShim: () => true,
				writeLog: successfulLog,
			}),
		).toBe(true);
		expect(successfulLog).toHaveBeenCalledWith(
			"🎉 All files patched successfully!",
			"green",
		);

		const failedLog = mock(() => undefined);
		expect(
			main({
				findFiles: () => ["one", "two"],
				patch: (filePath) => filePath === "one",
				removeTsserverShim: () => false,
				writeLog: failedLog,
			}),
		).toBe(false);
		expect(failedLog).toHaveBeenCalledWith("⚠️  1/2 files patched", "yellow");
	});

	test("handles package discovery failures", () => {
		const writeLog = mock(() => undefined);

		expect(
			main({
				findFiles: () => {
					throw new Error("permission denied");
				},
				removeTsserverShim: () => true,
				writeLog,
			}),
		).toBe(false);
		expect(writeLog).toHaveBeenCalledWith(
			"❌ Unable to find package files: permission denied",
			"red",
		);
	});

	test("suggests recovery when no package could be patched", () => {
		const writeLog = mock(() => undefined);

		expect(
			main({
				findFiles: () => ["one"],
				patch: () => false,
				removeTsserverShim: () => true,
				writeLog,
			}),
		).toBe(false);
		expect(writeLog).toHaveBeenCalledWith(
			"💡 Try running: bun install && bun run postinstall",
			"blue",
		);
	});
});
