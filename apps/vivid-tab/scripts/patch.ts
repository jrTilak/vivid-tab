#!/usr/bin/env bun

/**
 * Plasmo + Tailwind v4 Compatibility Patch
 *
 * Automatically fixes "node:" import issues in jiti and @tailwindcss/oxide
 * that cause Plasmo builds to fail when using Tailwind CSS v4.
 *
 * @see https://github.com/PlasmoHQ/plasmo/issues/1188
 */

const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

// Console colors
const c = {
	reset: "\x1b[0m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
};

type Color = keyof typeof c;

const log = (msg: string, color: Color = "reset") =>
	console.log(`${c[color]}${msg}${c.reset}`);

const getErrorMessage = (error: unknown) =>
	typeof error === "object" &&
	error !== null &&
	"message" in error &&
	typeof error.message === "string"
		? error.message
		: String(error);

/**
 * TypeScript 7 no longer ships tsserver. Bun can leave the old TypeScript 5
 * executable symlink behind after an upgrade, and Parcel fails while scanning
 * that dangling entry. Remove only the broken legacy shim.
 */
const removeDanglingTsserverShim = (
	tsserverPath: string = path.resolve(
		__dirname,
		"..",
		"node_modules",
		".bin",
		"tsserver",
	),
) => {
	try {
		const file = fs.lstatSync(tsserverPath);

		if (!file.isSymbolicLink() || fs.existsSync(tsserverPath)) {
			return true;
		}

		fs.unlinkSync(tsserverPath);
		log(`✅ ${tsserverPath} - removed dangling legacy shim`, "green");

		return true;
	} catch (error) {
		if (
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			error.code === "ENOENT"
		) {
			return true;
		}

		log(`❌ ${tsserverPath} - error: ${getErrorMessage(error)}`, "red");

		return false;
	}
};

const addNodeModulesFromAncestors = (
	startPath: string,
	directories: Set<string>,
) => {
	let currentPath = path.resolve(startPath);

	while (true) {
		const nodeModules = path.join(currentPath, "node_modules");

		if (fs.existsSync(nodeModules)) {
			directories.add(nodeModules);
		}

		const parentPath = path.dirname(currentPath);

		if (parentPath === currentPath) break;

		currentPath = parentPath;
	}
};

/**
 * Find package files that need patching
 */
type FindPackageFilesOptions = {
	currentWorkingDirectory?: string;
	scriptDirectory?: string;
};

const findPackageFiles = ({
	currentWorkingDirectory = process.cwd(),
	scriptDirectory = __dirname,
}: FindPackageFilesOptions = {}) => {
	const nodeModulesDirectories = new Set<string>();
	addNodeModulesFromAncestors(currentWorkingDirectory, nodeModulesDirectories);
	addNodeModulesFromAncestors(
		path.resolve(scriptDirectory, ".."),
		nodeModulesDirectories,
	);

	const files = new Set<string>();

	// Find jiti files
	const addJitiFiles = (basePath: string) => {
		const jitiPath = path.join(basePath, "jiti");
		if (!fs.existsSync(jitiPath)) return;

		const targets = ["dist/jiti.cjs", "dist/babel.cjs", "lib/jiti.cjs"];

		for (const target of targets) {
			const filePath = path.join(jitiPath, target);

			if (fs.existsSync(filePath)) {
				files.add(fs.realpathSync(filePath));
			}
		}
	};

	// Find oxide files
	const addOxideFile = (basePath: string) => {
		const oxidePath = path.join(basePath, "@tailwindcss", "oxide", "index.js");

		if (fs.existsSync(oxidePath)) {
			files.add(fs.realpathSync(oxidePath));
		}
	};

	for (const nodeModules of nodeModulesDirectories) {
		addJitiFiles(nodeModules);
		addOxideFile(nodeModules);

		const bunStore = path.join(nodeModules, ".bun");

		if (!fs.existsSync(bunStore)) continue;

		for (const entry of fs.readdirSync(bunStore, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;

			const packageNodeModules = path.join(
				bunStore,
				entry.name,
				"node_modules",
			);

			if (entry.name.startsWith("jiti@")) {
				addJitiFiles(packageNodeModules);
			}

			if (entry.name.startsWith("@tailwindcss+oxide@")) {
				addOxideFile(packageNodeModules);
			}
		}
	}

	return [...files].sort();
};

/**
 * Patch a single file
 */
const patchFile = (filePath: string) => {
	try {
		if (!fs.existsSync(filePath)) {
			log(`⚠️  File not found: ${filePath}`, "yellow");
			return false;
		}

		const content = fs.readFileSync(filePath, "utf8");
		const hasNodeImports =
			content.includes('require("node:') || content.includes("require('node:");

		if (!hasNodeImports) {
			log(`✅ ${filePath} - already patched`, "green");
			return true;
		}

		// Apply patches for both quote styles
		const patched = content
			.replace(/require\("node:([^"]+)"\)/g, 'require("$1")')
			.replace(/require\('node:([^']+)'\)/g, "require('$1')");

		fs.writeFileSync(filePath, patched, "utf8");
		log(`✅ ${filePath} - patched successfully`, "green");
		return true;
	} catch (error) {
		log(`❌ ${filePath} - error: ${getErrorMessage(error)}`, "red");
		return false;
	}
};

type MainDependencies = {
	findFiles?: () => string[];
	patch?: (filePath: string) => boolean;
	removeTsserverShim?: () => boolean;
	writeLog?: (message: string, color?: Color) => void;
};

/**
 * Main execution
 */
const main = ({
	findFiles = findPackageFiles,
	patch = patchFile,
	removeTsserverShim = removeDanglingTsserverShim,
	writeLog = log,
}: MainDependencies = {}) => {
	writeLog("🔧 Plasmo + Tailwind v4 compatibility patch", "cyan");
	const tsserverReady = removeTsserverShim();
	let files: string[];

	try {
		files = findFiles();
	} catch (error) {
		writeLog(
			`❌ Unable to find package files: ${getErrorMessage(error)}`,
			"red",
		);
		return false;
	}

	if (files.length === 0) {
		writeLog("⚠️  No files found to patch", "yellow");
		writeLog(
			"   This might mean packages are not installed or using different structure",
			"yellow",
		);
		return tsserverReady;
	}

	writeLog(`   Found ${files.length} files to check`, "blue");

	const results = files.map(patch);
	const successful = results.filter(Boolean).length;

	writeLog(""); // Empty line

	if (successful === files.length && tsserverReady) {
		writeLog("🎉 All files patched successfully!", "green");
		writeLog("   Tailwind v4 should now work with Plasmo", "green");
	} else {
		writeLog(`⚠️  ${successful}/${files.length} files patched`, "yellow");
	}

	if (successful === 0) {
		writeLog("💡 Try running: bun install && bun run postinstall", "blue");
	}

	return successful === files.length && tsserverReady;
};

// Execute if run directly
if (require.main === module) {
	main();
}

module.exports = {
	findPackageFiles,
	main,
	patchFile,
	removeDanglingTsserverShim,
};

// Credit: https://github.com/PlasmoHQ/plasmo/issues/1188#issuecomment-3392816850
