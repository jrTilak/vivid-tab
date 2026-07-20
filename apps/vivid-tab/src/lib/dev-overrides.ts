const RADII = ["rounded", "none", "sm"] as const;
const VISUAL_EFFECTS = ["opaque", "translucent"] as const;
const THEMES = ["dark", "light", "system"] as const;

export type DevRadius = (typeof RADII)[number];
export type DevVisualEffect = (typeof VISUAL_EFFECTS)[number];
export type DevTheme = (typeof THEMES)[number];

type DevEnvironment = {
	NODE_ENV?: string;
	PLASMO_PUBLIC_DEV_RADIUS?: string;
	PLASMO_PUBLIC_DEV_VISUAL_EFFECT?: string;
	PLASMO_PUBLIC_DEV_THEME?: string;
};

export type DevOverrides = {
	radius?: DevRadius;
	visualEffect?: DevVisualEffect;
	theme?: DevTheme;
};

const readAllowedValue = <T extends string>(
	value: string | undefined,
	allowedValues: readonly T[],
): T | undefined =>
	allowedValues.includes(value as T) ? (value as T) : undefined;

/**
 * Resolves development-only appearance overrides without mutating saved settings.
 * Unknown values are deliberately ignored so a typo cannot corrupt the UI state.
 */
export const resolveDevOverrides = (
	environment: DevEnvironment,
): DevOverrides => {
	if (environment.NODE_ENV !== "development") return {};

	return {
		radius: readAllowedValue(environment.PLASMO_PUBLIC_DEV_RADIUS, RADII),
		visualEffect: readAllowedValue(
			environment.PLASMO_PUBLIC_DEV_VISUAL_EFFECT,
			VISUAL_EFFECTS,
		),
		theme: readAllowedValue(environment.PLASMO_PUBLIC_DEV_THEME, THEMES),
	};
};

/* Keep direct process.env access so Plasmo can replace public values at build time. */
export const DEV_OVERRIDES = resolveDevOverrides({
	NODE_ENV: process.env.NODE_ENV,
	PLASMO_PUBLIC_DEV_RADIUS: process.env.PLASMO_PUBLIC_DEV_RADIUS,
	PLASMO_PUBLIC_DEV_VISUAL_EFFECT: process.env.PLASMO_PUBLIC_DEV_VISUAL_EFFECT,
	PLASMO_PUBLIC_DEV_THEME: process.env.PLASMO_PUBLIC_DEV_THEME,
});
