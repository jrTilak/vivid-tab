import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, mock, test } from "@test/jest";
import {
	EXPECTED_API_PERMISSIONS,
	EXPECTED_FIREFOX_DATA_PERMISSIONS,
	EXPECTED_FIREFOX_HOST_PERMISSIONS,
	EXPECTED_HOST_PERMISSIONS,
	EXPECTED_OPTIONAL_PERMISSIONS,
	inspectReleaseArchive,
	validateGeneratedManifest,
	validateReleaseSource,
} from "./validate-release";

const VERSION = "1.4.0";
const DISPLAY_NAME = "Vivid Tab";
const DESCRIPTION = "A customizable new tab dashboard.";

type TestManifest = {
	browser_specific_settings: {
		gecko: {
			data_collection_permissions: { required: string[] };
			id: string;
			strict_min_version: string;
		};
	};
	host_permissions: string[];
	overrides?: {
		firefox: { host_permissions: string[] };
	};
	optional_permissions: string[];
	permissions: string[];
	web_accessible_resources?: Array<{
		matches: string[];
		resources: string[];
	}>;
};

const makeManifest = (): TestManifest => ({
	host_permissions: [...EXPECTED_HOST_PERMISSIONS] as string[],
	optional_permissions: [...EXPECTED_OPTIONAL_PERMISSIONS] as string[],
	permissions: [...EXPECTED_API_PERMISSIONS] as string[],
	browser_specific_settings: {
		gecko: {
			id: "vividtab@jrtilak.dev",
			strict_min_version: "140.0",
			data_collection_permissions: {
				required: [...EXPECTED_FIREFOX_DATA_PERMISSIONS] as string[],
			},
		},
	},
});

const makeSourceManifest = (): TestManifest => ({
	...makeManifest(),
	overrides: {
		firefox: {
			host_permissions: [...EXPECTED_FIREFOX_HOST_PERMISSIONS] as string[],
		},
	},
});

const makePackage = () => ({
	description: DESCRIPTION,
	displayName: DISPLAY_NAME,
	manifest: makeSourceManifest(),
	scripts: {
		"package:all": "bun run package:c && bun run package:f",
		"package:c": "plasmo package --target=chrome-mv3",
		"package:f": "plasmo package --target=firefox-mv3",
		release: "bun run package:all && bun run release:validate",
		"release:validate": "bun scripts/validate-release.ts",
	},
	version: VERSION,
});

const makeGeneratedManifest = (target: "chrome" | "firefox" = "chrome") => ({
	...makeManifest(),
	host_permissions: [
		...(target === "firefox"
			? EXPECTED_FIREFOX_HOST_PERMISSIONS
			: EXPECTED_HOST_PERMISSIONS),
	] as string[],
	description: DESCRIPTION,
	manifest_version: 3,
	name: DISPLAY_NAME,
	version: VERSION,
});

describe("release source validation", () => {
	test("accepts complete, least-privilege release metadata", () => {
		expect(
			validateReleaseSource({
				changelog: `## [${VERSION}] - 2026-07-21`,
				packageJson: JSON.stringify(makePackage()),
				whatsNew: `# What's New in Vivid Tab ${VERSION}`,
			}),
		).toEqual([]);
	});

	test("accepts the checked-in release metadata", async () => {
		const appRoot = resolve(__dirname, "..");
		const repositoryRoot = resolve(appRoot, "../..");
		const [packageJson, changelog, whatsNew] = await Promise.all([
			readFile(resolve(appRoot, "package.json"), "utf8"),
			readFile(resolve(repositoryRoot, "CHANGELOG.md"), "utf8"),
			readFile(resolve(repositoryRoot, "WHATS_NEW.md"), "utf8"),
		]);

		expect(validateReleaseSource({ changelog, packageJson, whatsNew })).toEqual(
			[],
		);
	});

	test("reports malformed package metadata without throwing", () => {
		expect(
			validateReleaseSource({
				changelog: "",
				packageJson: "{",
				whatsNew: "",
			}),
		).toEqual(["package.json is not valid JSON"]);
	});

	test("rejects stale notes, incomplete metadata, and missing scripts", () => {
		const packageData = makePackage();
		packageData.description = "";
		packageData.displayName = "";
		packageData.version = "release";
		packageData.scripts = {} as typeof packageData.scripts;

		expect(
			validateReleaseSource({
				changelog: "",
				packageJson: JSON.stringify(packageData),
				whatsNew: "",
			}),
		).toEqual(
			expect.arrayContaining([
				"package.json must contain a release version such as 1.4.0",
				"package.json must contain displayName",
				"package.json must contain a user-facing description",
				"package.json is missing the package:c script",
				"package.json is missing the package:f script",
				"package.json is missing the package:all script",
				"package.json is missing the release script",
				"package.json is missing the release:validate script",
			]),
		);
	});

	test("rejects broad hosts, public assets, stale permissions, and none disclosure", () => {
		const packageData = makePackage();
		packageData.manifest = {
			...packageData.manifest,
			host_permissions: ["https://*/*"],
			permissions: ["storage", "tabs"],
			web_accessible_resources: [
				{ matches: ["<all_urls>"], resources: ["assets/*"] },
			],
			browser_specific_settings: {
				gecko: {
					id: "vividtab@jrtilak.dev",
					strict_min_version: "",
					data_collection_permissions: { required: ["none"] },
				},
			},
		};

		expect(
			validateReleaseSource({
				changelog: `## [${VERSION}]`,
				packageJson: JSON.stringify(packageData),
				whatsNew: `What's New in Vivid Tab ${VERSION}`,
			}),
		).toEqual(
			expect.arrayContaining([
				"manifest host permissions must match the approved providers",
				"manifest API permissions must match the audited feature set",
				"manifest must not expose packaged assets to websites",
				"Firefox must disclose transient location and search-term transmission",
				"Firefox 140 or newer is required for built-in data-transmission consent",
			]),
		);
	});
});

describe("generated manifest validation", () => {
	test.each([
		"chrome",
		"firefox",
	] as const)("accepts the %s release manifest", (target) => {
		expect(
			validateGeneratedManifest({
				description: DESCRIPTION,
				displayName: DISPLAY_NAME,
				manifest: makeGeneratedManifest(target),
				target,
				version: VERSION,
			}),
		).toEqual([]);
	});

	test("reports stale core Chrome metadata and permissions", () => {
		const manifest = {
			...makeGeneratedManifest(),
			content_scripts: [{ js: ["content.js"], matches: ["<all_urls>"] }],
			description: "Old description",
			host_permissions: ["<all_urls>"],
			manifest_version: 2,
			name: "Old name",
			optional_permissions: ["history", "cookies"],
			permissions: ["storage", "tabs"],
			version: "1.3.0",
			web_accessible_resources: [
				{ matches: ["<all_urls>"], resources: ["assets/*"] },
			],
		};

		expect(
			validateGeneratedManifest({
				description: DESCRIPTION,
				displayName: DISPLAY_NAME,
				manifest,
				target: "chrome",
				version: VERSION,
			}),
		).toEqual(
			expect.arrayContaining([
				"chrome manifest must use Manifest V3",
				"chrome manifest version must be 1.4.0",
				"chrome manifest name must be Vivid Tab",
				"chrome manifest description is missing or stale",
				"chrome manifest contains unexpected host permissions",
				"chrome manifest contains unexpected API permissions",
				"chrome manifest contains unexpected optional permissions",
				"chrome manifest exposes unexpected web-accessible resources",
				"chrome manifest must not inject scripts into websites",
			]),
		);
	});

	test("rejects an inaccurate or unsupported Firefox disclosure", () => {
		const manifest = makeGeneratedManifest("firefox");
		manifest.browser_specific_settings.gecko.strict_min_version = "128.0";
		manifest.browser_specific_settings.gecko.data_collection_permissions = {
			required: ["none"],
		};

		expect(
			validateGeneratedManifest({
				description: DESCRIPTION,
				displayName: DISPLAY_NAME,
				manifest,
				target: "firefox",
				version: VERSION,
			}),
		).toEqual([
			"firefox manifest has an inaccurate data-use disclosure",
			"firefox manifest must require Firefox 140 or newer",
		]);
	});
});

describe("release archive inspection", () => {
	test("checks ZIP integrity and reads the top-level manifest", async () => {
		const manifest = makeGeneratedManifest();
		const runCommand = mock(
			async (_command: string, arguments_: readonly string[]) => {
				switch (arguments_[0]) {
					case "-Z1":
						return { stdout: "manifest.json\nnewtab.html\n" };
					case "-p":
						return { stdout: JSON.stringify(manifest) };
					default:
						return { stdout: "" };
				}
			},
		);

		await expect(
			inspectReleaseArchive({
				archivePath: "/tmp/vivid-tab.zip",
				getFileSize: async () => 10_000,
				runCommand,
			}),
		).resolves.toEqual(manifest);
		expect(runCommand).toHaveBeenNthCalledWith(1, "unzip", [
			"-tqq",
			"/tmp/vivid-tab.zip",
		]);
		expect(runCommand).toHaveBeenNthCalledWith(2, "unzip", [
			"-Z1",
			"/tmp/vivid-tab.zip",
		]);
		expect(runCommand).toHaveBeenNthCalledWith(3, "unzip", [
			"-p",
			"/tmp/vivid-tab.zip",
			"manifest.json",
		]);
	});

	test("rejects empty archives before invoking unzip", async () => {
		const runCommand = mock(async () => ({ stdout: "" }));

		await expect(
			inspectReleaseArchive({
				archivePath: "/tmp/empty.zip",
				getFileSize: async () => 22,
				runCommand,
			}),
		).rejects.toThrow("empty or too small");
		expect(runCommand).not.toHaveBeenCalled();
	});

	test("rejects archives without a top-level manifest", async () => {
		const runCommand = mock(
			async (_command: string, arguments_: readonly string[]) => ({
				stdout:
					arguments_[0] === "-Z1" ? "nested/manifest.json\nnewtab.html\n" : "",
			}),
		);

		await expect(
			inspectReleaseArchive({
				archivePath: "/tmp/nested.zip",
				getFileSize: async () => 10_000,
				runCommand,
			}),
		).rejects.toThrow("does not contain a top-level manifest.json");
	});

	test("rejects an invalid manifest inside an otherwise valid ZIP", async () => {
		const runCommand = mock(
			async (_command: string, arguments_: readonly string[]) => ({
				stdout: arguments_[0] === "-Z1" ? "manifest.json\n" : "not json",
			}),
		);

		await expect(
			inspectReleaseArchive({
				archivePath: "/tmp/invalid.zip",
				getFileSize: async () => 10_000,
				runCommand,
			}),
		).rejects.toThrow("manifest.json is not valid JSON");
	});
});
