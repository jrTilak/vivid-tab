#!/usr/bin/env bun

import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

export type ReleaseTarget = "chrome" | "firefox";

type JsonObject = Record<string, unknown>;

type ReleaseSource = {
	changelog: string;
	packageJson: string;
	whatsNew: string;
};

type CommandResult = {
	stdout: string;
};

type CommandRunner = (
	command: string,
	arguments_: readonly string[],
) => Promise<CommandResult>;

type ArchiveInspectorOptions = {
	archivePath: string;
	getFileSize?: (path: string) => Promise<number>;
	runCommand?: CommandRunner;
};

export const EXPECTED_HOST_PERMISSIONS = [
	"https://suggestqueries.google.com/*",
	"https://ipapi.co/*",
	"https://api.weatherapi.com/*",
	"https://cdn.weatherapi.com/*",
	"https://wallhaven.cc/*",
	"https://w.wallhaven.cc/*",
	"https://th.wallhaven.cc/*",
] as const;

export const EXPECTED_FIREFOX_HOST_PERMISSIONS = [
	"https://ipapi.co/*",
	"https://api.weatherapi.com/*",
	"https://cdn.weatherapi.com/*",
	"https://wallhaven.cc/*",
	"https://w.wallhaven.cc/*",
	"https://th.wallhaven.cc/*",
] as const;

export const EXPECTED_API_PERMISSIONS = [
	"bookmarks",
	"storage",
	"unlimitedStorage",
	"search",
	"topSites",
	"geolocation",
	"alarms",
] as const;

export const EXPECTED_FIREFOX_DATA_PERMISSIONS = [
	"locationInfo",
	"searchTerms",
] as const;

export const EXPECTED_OPTIONAL_PERMISSIONS = ["history"] as const;

const MINIMUM_ARCHIVE_BYTES = 1_024;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

const isJsonObject = (value: unknown): value is JsonObject =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const parseJsonObject = (source: string, label: string): JsonObject => {
	let parsed: unknown;

	try {
		parsed = JSON.parse(source);
	} catch (error) {
		throw new Error(`${label} is not valid JSON`, { cause: error });
	}

	if (!isJsonObject(parsed)) {
		throw new Error(`${label} must contain a JSON object`);
	}

	return parsed;
};

const toStringArray = (value: unknown): string[] | null =>
	Array.isArray(value) && value.every((item) => typeof item === "string")
		? value
		: null;

const sameMembers = (actual: readonly string[], expected: readonly string[]) =>
	actual.length === expected.length &&
	[...actual]
		.sort()
		.every((value, index) => value === [...expected].sort()[index]);

const getFirefoxDataPermissions = (manifest: JsonObject): string[] | null => {
	const browserSettings = manifest.browser_specific_settings;
	if (!isJsonObject(browserSettings)) return null;

	const gecko = browserSettings.gecko;
	if (!isJsonObject(gecko)) return null;

	const dataPermissions = gecko.data_collection_permissions;
	if (!isJsonObject(dataPermissions)) return null;

	return toStringArray(dataPermissions.required);
};

const getFirefoxMinimumVersion = (manifest: JsonObject): unknown => {
	const browserSettings = manifest.browser_specific_settings;
	if (!isJsonObject(browserSettings)) return undefined;

	const gecko = browserSettings.gecko;
	return isJsonObject(gecko) ? gecko.strict_min_version : undefined;
};

const getFirefoxId = (manifest: JsonObject): unknown => {
	const browserSettings = manifest.browser_specific_settings;
	if (!isJsonObject(browserSettings)) return undefined;

	const gecko = browserSettings.gecko;
	return isJsonObject(gecko) ? gecko.id : undefined;
};

const getFirefoxHostOverride = (manifest: JsonObject): string[] | null => {
	const overrides = manifest.overrides;
	if (!isJsonObject(overrides)) return null;

	const firefox = overrides.firefox;
	return isJsonObject(firefox) ? toStringArray(firefox.host_permissions) : null;
};

/**
 * Validates the checked-in release metadata before inspecting generated files.
 * Keeping this independent of Plasmo makes incorrect versions, permissions, and
 * release notes fail quickly without rebuilding the extension.
 */
export const validateReleaseSource = ({
	changelog,
	packageJson,
	whatsNew,
}: ReleaseSource): string[] => {
	const errors: string[] = [];
	let packageData: JsonObject;

	try {
		packageData = parseJsonObject(packageJson, "package.json");
	} catch (error) {
		return [error instanceof Error ? error.message : String(error)];
	}

	const version = packageData.version;
	const displayName = packageData.displayName;
	const description = packageData.description;

	if (typeof version !== "string" || !SEMVER_PATTERN.test(version)) {
		errors.push("package.json must contain a release version such as 1.4.0");
	}

	if (typeof displayName !== "string" || displayName.trim().length === 0) {
		errors.push("package.json must contain displayName");
	}

	if (typeof description !== "string" || description.trim().length === 0) {
		errors.push("package.json must contain a user-facing description");
	}

	if (typeof version === "string" && SEMVER_PATTERN.test(version)) {
		if (!changelog.includes(`## [${version}]`)) {
			errors.push(`CHANGELOG.md is missing the ${version} release`);
		}
		if (!whatsNew.includes(`What's New in Vivid Tab ${version}`)) {
			errors.push(`WHATS_NEW.md is missing the ${version} release`);
		}
	}

	const scripts = packageData.scripts;
	if (!isJsonObject(scripts)) {
		errors.push("package.json must contain release scripts");
	} else {
		for (const script of [
			"package:all",
			"package:c",
			"package:f",
			"release",
			"release:validate",
		]) {
			if (typeof scripts[script] !== "string") {
				errors.push(`package.json is missing the ${script} script`);
			}
		}
	}

	const manifest = packageData.manifest;
	if (!isJsonObject(manifest)) {
		errors.push("package.json must contain a manifest object");
		return errors;
	}

	const hostPermissions = toStringArray(manifest.host_permissions);
	if (
		!hostPermissions ||
		!sameMembers(hostPermissions, EXPECTED_HOST_PERMISSIONS)
	) {
		errors.push("manifest host permissions must match the approved providers");
	}

	const firefoxHostPermissions = getFirefoxHostOverride(manifest);
	if (
		!firefoxHostPermissions ||
		!sameMembers(firefoxHostPermissions, EXPECTED_FIREFOX_HOST_PERMISSIONS)
	) {
		errors.push(
			"Firefox host permissions must omit the remote suggestion provider",
		);
	}

	const apiPermissions = toStringArray(manifest.permissions);
	if (
		!apiPermissions ||
		!sameMembers(apiPermissions, EXPECTED_API_PERMISSIONS)
	) {
		errors.push("manifest API permissions must match the audited feature set");
	}

	if (manifest.web_accessible_resources !== undefined) {
		errors.push("manifest must not expose packaged assets to websites");
	}

	const optionalPermissions = toStringArray(manifest.optional_permissions);
	if (
		!optionalPermissions ||
		!sameMembers(optionalPermissions, EXPECTED_OPTIONAL_PERMISSIONS)
	) {
		errors.push("manifest optional permissions must contain only history");
	}

	const firefoxDataPermissions = getFirefoxDataPermissions(manifest);
	if (
		!firefoxDataPermissions ||
		!sameMembers(firefoxDataPermissions, EXPECTED_FIREFOX_DATA_PERMISSIONS)
	) {
		errors.push(
			"Firefox must disclose transient location and search-term transmission",
		);
	}
	if (getFirefoxMinimumVersion(manifest) !== "140.0") {
		errors.push(
			"Firefox 140 or newer is required for built-in data-transmission consent",
		);
	}
	if (getFirefoxId(manifest) !== "vividtab@jrtilak.dev") {
		errors.push("Firefox manifest must retain the published add-on ID");
	}

	return errors;
};

/** Validates metadata and privacy-sensitive fields in one generated manifest. */
export const validateGeneratedManifest = ({
	description,
	displayName,
	manifest,
	target,
	version,
}: {
	description: string;
	displayName: string;
	manifest: JsonObject;
	target: ReleaseTarget;
	version: string;
}): string[] => {
	const errors: string[] = [];

	if (manifest.manifest_version !== 3) {
		errors.push(`${target} manifest must use Manifest V3`);
	}
	if (manifest.version !== version) {
		errors.push(`${target} manifest version must be ${version}`);
	}
	if (manifest.name !== displayName) {
		errors.push(`${target} manifest name must be ${displayName}`);
	}
	if (manifest.description !== description) {
		errors.push(`${target} manifest description is missing or stale`);
	}

	const hostPermissions = toStringArray(manifest.host_permissions);
	const expectedHostPermissions =
		target === "firefox"
			? EXPECTED_FIREFOX_HOST_PERMISSIONS
			: EXPECTED_HOST_PERMISSIONS;
	if (
		!hostPermissions ||
		!sameMembers(hostPermissions, expectedHostPermissions)
	) {
		errors.push(`${target} manifest contains unexpected host permissions`);
	}

	const apiPermissions = toStringArray(manifest.permissions);
	if (
		!apiPermissions ||
		!sameMembers(apiPermissions, EXPECTED_API_PERMISSIONS)
	) {
		errors.push(`${target} manifest contains unexpected API permissions`);
	}

	const optionalPermissions = toStringArray(manifest.optional_permissions);
	if (
		!optionalPermissions ||
		!sameMembers(optionalPermissions, EXPECTED_OPTIONAL_PERMISSIONS)
	) {
		errors.push(`${target} manifest contains unexpected optional permissions`);
	}

	if (manifest.web_accessible_resources !== undefined) {
		errors.push(
			`${target} manifest exposes unexpected web-accessible resources`,
		);
	}
	if (
		Array.isArray(manifest.content_scripts) &&
		manifest.content_scripts.length > 0
	) {
		errors.push(`${target} manifest must not inject scripts into websites`);
	}

	if (target === "firefox") {
		const dataPermissions = getFirefoxDataPermissions(manifest);
		if (
			!dataPermissions ||
			!sameMembers(dataPermissions, EXPECTED_FIREFOX_DATA_PERMISSIONS)
		) {
			errors.push(`${target} manifest has an inaccurate data-use disclosure`);
		}
		if (getFirefoxMinimumVersion(manifest) !== "140.0") {
			errors.push(`${target} manifest must require Firefox 140 or newer`);
		}
		if (getFirefoxId(manifest) !== "vividtab@jrtilak.dev") {
			errors.push(`${target} manifest has an unexpected add-on ID`);
		}
	}

	return errors;
};

const runProcess: CommandRunner = (command, arguments_) =>
	new Promise((resolvePromise, reject) => {
		const processHandle = spawn(command, [...arguments_], {
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";

		processHandle.stdout.setEncoding("utf8");
		processHandle.stderr.setEncoding("utf8");
		processHandle.stdout.on("data", (chunk: string) => {
			stdout += chunk;
		});
		processHandle.stderr.on("data", (chunk: string) => {
			stderr += chunk;
		});
		processHandle.on("error", reject);
		processHandle.on("close", (exitCode) => {
			if (exitCode === 0) {
				resolvePromise({ stdout });
				return;
			}

			reject(
				new Error(
					`${command} exited with code ${String(exitCode)}${stderr ? `: ${stderr.trim()}` : ""}`,
				),
			);
		});
	});

/**
 * Checks that a ZIP is non-empty and structurally valid, then reads its
 * top-level manifest. `unzip` is deliberately used instead of a package-time
 * dependency so release validation does not increase the extension toolchain.
 */
export const inspectReleaseArchive = async ({
	archivePath,
	getFileSize = async (path) => (await stat(path)).size,
	runCommand = runProcess,
}: ArchiveInspectorOptions): Promise<JsonObject> => {
	const archiveSize = await getFileSize(archivePath);
	if (archiveSize < MINIMUM_ARCHIVE_BYTES) {
		throw new Error(`${archivePath} is empty or too small to be a release`);
	}

	await runCommand("unzip", ["-tqq", archivePath]);
	const { stdout: entriesOutput } = await runCommand("unzip", [
		"-Z1",
		archivePath,
	]);
	const entries = entriesOutput.split(/\r?\n/).filter(Boolean);

	if (!entries.includes("manifest.json")) {
		throw new Error(
			`${archivePath} does not contain a top-level manifest.json`,
		);
	}

	const { stdout: manifestSource } = await runCommand("unzip", [
		"-p",
		archivePath,
		"manifest.json",
	]);

	return parseJsonObject(manifestSource, `${archivePath}/manifest.json`);
};

const APP_ROOT = resolve(__dirname, "..");
const REPOSITORY_ROOT = resolve(APP_ROOT, "../..");

/** Validates both store archives without rebuilding or modifying them. */
export const validateRelease = async () => {
	const [packageJson, changelog, whatsNew] = await Promise.all([
		readFile(resolve(APP_ROOT, "package.json"), "utf8"),
		readFile(resolve(REPOSITORY_ROOT, "CHANGELOG.md"), "utf8"),
		readFile(resolve(REPOSITORY_ROOT, "WHATS_NEW.md"), "utf8"),
	]);
	const sourceErrors = validateReleaseSource({
		changelog,
		packageJson,
		whatsNew,
	});

	if (sourceErrors.length > 0) {
		throw new Error(sourceErrors.join("\n"));
	}

	const packageData = parseJsonObject(packageJson, "package.json");
	const version = String(packageData.version);
	const displayName = String(packageData.displayName);
	const description = String(packageData.description);
	const targets: readonly [ReleaseTarget, string][] = [
		["chrome", "chrome-mv3-prod.zip"],
		["firefox", "firefox-mv3-prod.zip"],
	];

	for (const [target, archiveName] of targets) {
		const manifest = await inspectReleaseArchive({
			archivePath: resolve(APP_ROOT, "build", archiveName),
		});
		const errors = validateGeneratedManifest({
			description,
			displayName,
			manifest,
			target,
			version,
		});

		if (errors.length > 0) {
			throw new Error(errors.join("\n"));
		}
	}
};

if (require.main === module) {
	validateRelease()
		.then(() => {
			console.log("Chrome and Firefox release archives are valid.");
		})
		.catch((error: unknown) => {
			console.error(error instanceof Error ? error.message : String(error));
			process.exitCode = 1;
		});
}
