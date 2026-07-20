import type React from "react";
import { useLayoutEffect } from "react";
import { DEV_OVERRIDES } from "@/lib/dev-overrides";
import { type Theme, ThemeProvider } from "@/providers/theme-provider";

import { SettingsProvider, useSettings } from "./settings-provider";

import "@/styles/index.css";

type Props = {
	children: React.ReactNode;
	ensureRootFolder?: boolean;
	theme?: Theme;
};

const AppearanceDataAttributes = () => {
	const {
		settings: {
			appearance: { radius, visualEffect },
		},
	} = useSettings();
	const effectiveRadius = DEV_OVERRIDES.radius ?? radius;
	const effectiveVisualEffect = DEV_OVERRIDES.visualEffect ?? visualEffect;

	useLayoutEffect(() => {
		document.body.dataset.radius = effectiveRadius;
		document.body.dataset.visualEffect = effectiveVisualEffect;
	}, [effectiveRadius, effectiveVisualEffect]);

	return null;
};

const RootProvider = ({ children, ensureRootFolder, theme }: Props) => {
	useLayoutEffect(() => {
		document.documentElement.classList.add("__vivid-container");
	}, []);

	return (
		<SettingsProvider ensureRootFolder={ensureRootFolder}>
			<AppearanceDataAttributes />
			<ThemeProvider defaultTheme={theme} forcedTheme={DEV_OVERRIDES.theme}>
				{children}
			</ThemeProvider>
		</SettingsProvider>
	);
};

export { RootProvider };
