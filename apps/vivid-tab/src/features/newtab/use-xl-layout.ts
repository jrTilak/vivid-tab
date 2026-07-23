import { useSyncExternalStore } from "react";

const XL_LAYOUT_QUERY = "(min-width: 80rem)";

const getXlLayoutSnapshot = () => window.matchMedia(XL_LAYOUT_QUERY).matches;

const subscribeToXlLayout = (onChange: () => void) => {
	const mediaQuery = window.matchMedia(XL_LAYOUT_QUERY);
	mediaQuery.addEventListener("change", onChange);

	return () => mediaQuery.removeEventListener("change", onChange);
};

/** Matches Tailwind's default `xl` breakpoint without mounting hidden widgets. */
const useXlLayout = () =>
	useSyncExternalStore(subscribeToXlLayout, getXlLayoutSnapshot, () => false);

export { useXlLayout };
