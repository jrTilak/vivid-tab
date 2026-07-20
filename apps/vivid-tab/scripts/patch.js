#!/usr/bin/env node

/**
 * Plasmo + Tailwind v4 Compatibility Patch
 *
 * Automatically fixes "node:" import issues in jiti and @tailwindcss/oxide
 * that cause Plasmo builds to fail when using Tailwind CSS v4.
 *
 * @see https://github.com/PlasmoHQ/plasmo/issues/1188
 */

const fs = require("node:fs");
const path = require("node:path");

// Console colors
const c = {
	reset: "\x1b[0m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
};

const log = (msg, color = "reset") =>
	console.log(`${c[color]}${msg}${c.reset}`);

/**
 * TypeScript 7 no longer ships tsserver. Bun can leave the old TypeScript 5
 * executable symlink behind after an upgrade, and Parcel fails while scanning
 * that dangling entry. Remove only the broken legacy shim.
 */
const removeDanglingTsserverShim = () => {
	const tsserverPath = path.resolve(
		__dirname,
		"..",
		"node_modules",
		".bin",
		"tsserver",
	);

	try {
		const file = fs.lstatSync(tsserverPath);

		if (!file.isSymbolicLink() || fs.existsSync(tsserverPath)) {
			return true;
		}

		fs.unlinkSync(tsserverPath);
		log(`✅ ${tsserverPath} - removed dangling legacy shim`, "green");

		return true;
	} catch (error) {
		if (error.code === "ENOENT") return true;

		log(`❌ ${tsserverPath} - error: ${error.message}`, "red");

		return false;
	}
};

const addNodeModulesFromAncestors = (startPath, directories) => {
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
const findPackageFiles = () => {
	const nodeModulesDirectories = new Set();
	addNodeModulesFromAncestors(process.cwd(), nodeModulesDirectories);
	addNodeModulesFromAncestors(
		path.resolve(__dirname, ".."),
		nodeModulesDirectories,
	);

	const files = new Set();

	// Helper to check file exists
	const fileExists = (filePath) => {
		try {
			return fs.existsSync(filePath);
		} catch {
			return false;
		}
	};

	// Find jiti files
	const addJitiFiles = (basePath) => {
		const jitiPath = path.join(basePath, "jiti");
		if (!fileExists(jitiPath)) return;

		const targets = ["dist/jiti.cjs", "dist/babel.cjs", "lib/jiti.cjs"];

		for (const target of targets) {
			const filePath = path.join(jitiPath, target);

			if (fileExists(filePath)) {
				files.add(fs.realpathSync(filePath));
			}
		}
	};

	// Find oxide files
	const addOxideFile = (basePath) => {
		const oxidePath = path.join(basePath, "@tailwindcss", "oxide", "index.js");

		if (fileExists(oxidePath)) {
			files.add(fs.realpathSync(oxidePath));
		}
	};

	for (const nodeModules of nodeModulesDirectories) {
		addJitiFiles(nodeModules);
		addOxideFile(nodeModules);

		const bunStore = path.join(nodeModules, ".bun");

		if (!fileExists(bunStore)) continue;

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
const patchFile = (filePath) => {
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
		log(`❌ ${filePath} - error: ${error.message}`, "red");
		return false;
	}
};

/**
 * Main execution
 */
const main = () => {
	log("🔧 Plasmo + Tailwind v4 compatibility patch", "cyan");
	const tsserverReady = removeDanglingTsserverShim();

	const files = findPackageFiles();

	if (files.length === 0) {
		log("⚠️  No files found to patch", "yellow");
		log(
			"   This might mean packages are not installed or using different structure",
			"yellow",
		);
		return;
	}

	log(`   Found ${files.length} files to check`, "blue");

	const results = files.map(patchFile);
	const successful = results.filter(Boolean).length;

	log(""); // Empty line

	if (successful === files.length && tsserverReady) {
		log("🎉 All files patched successfully!", "green");
		log("   Tailwind v4 should now work with Plasmo", "green");
	} else {
		log(`⚠️  ${successful}/${files.length} files patched`, "yellow");
	}

	if (successful === 0) {
		log("💡 Try running: bun install && bun run postinstall", "blue");
	}
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
