import { existsSync } from "node:fs";

const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

/**
 * Reads a conventional boolean environment flag. Missing flags use the
 * supplied default, while `0`, `false`, `no`, and `off` disable the option.
 */
export const readBooleanEnvironment = (
	name: string,
	defaultValue: boolean,
): boolean => {
	const value = process.env[name]?.trim().toLowerCase();
	if (!value) return defaultValue;

	return !FALSE_VALUES.has(value);
};

/** Uses an explicit binary path first and a known system path when available. */
export const resolveBinary = (
	environmentName: string,
	systemPath: string,
): string | undefined => {
	const configuredPath = process.env[environmentName]?.trim();
	if (configuredPath) return configuredPath;

	return existsSync(systemPath) ? systemPath : undefined;
};

export const E2E_HEADLESS = readBooleanEnvironment("E2E_HEADLESS", true);

export const E2E_TIMEOUT_MS = Number.parseInt(
	process.env.E2E_TIMEOUT_MS ?? "20000",
	10,
);
