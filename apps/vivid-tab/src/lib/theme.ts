export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = Exclude<Theme, "system">;

const THEME_VALUES: readonly Theme[] = ["dark", "light", "system"];

/**
 * Validates untrusted persisted or cross-tab values before they enter theme
 * state.
 */
export const isTheme = (value: unknown): value is Theme =>
	typeof value === "string" && THEME_VALUES.includes(value as Theme);

/**
 * Converts the system preference into the concrete class applied to the root
 * element while preserving an explicit light or dark selection.
 */
export const resolveTheme = (
	theme: Theme,
	prefersDark: boolean,
): ResolvedTheme =>
	theme === "system" ? (prefersDark ? "dark" : "light") : theme;

/**
 * Returns the opposite of the currently rendered theme. System mode is first
 * resolved so the keyboard shortcut always produces a visible change.
 */
export const getNextTheme = (
	theme: Theme,
	prefersDark: boolean,
): ResolvedTheme =>
	resolveTheme(theme, prefersDark) === "dark" ? "light" : "dark";

/**
 * Prevents the global theme shortcut from intercepting typing or selection in
 * editable controls, including descendants of contenteditable containers.
 */
export const isEditableThemeShortcutTarget = (
	target: EventTarget | null,
): boolean => {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;

	return Boolean(
		target.closest("input, textarea, select, [contenteditable='true']"),
	);
};
