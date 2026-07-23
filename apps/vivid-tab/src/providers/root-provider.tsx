import type React from "react";
import { useLayoutEffect } from "react";
import { DEV_OVERRIDES } from "@/lib/dev-overrides";

import { SettingsProvider, useSettings } from "./settings-provider";

import "@/styles/index.css";

type Props = {
	children: React.ReactNode;
	ensureRootFolder?: boolean;
};

const AppearanceDataAttributes = () => {
	const {
		settings: {
			appearance: { radius, theme, visualEffect },
		},
	} = useSettings();
	const effectiveRadius = DEV_OVERRIDES.radius ?? radius;
	const effectiveTheme = DEV_OVERRIDES.theme ?? theme;
	const effectiveVisualEffect = DEV_OVERRIDES.visualEffect ?? visualEffect;

	useLayoutEffect(() => {
		const root = document.documentElement;

		root.classList.add("__vivid-container", "dark");
		root.dataset.theme = effectiveTheme;
		document.body.dataset.radius = effectiveRadius;
		document.body.dataset.visualEffect = effectiveVisualEffect;
	}, [effectiveRadius, effectiveTheme, effectiveVisualEffect]);

	return null;
};

const RootProvider = ({ children, ensureRootFolder }: Props) => {
	return (
		<SettingsProvider ensureRootFolder={ensureRootFolder}>
			<AppearanceDataAttributes />
			{children}
		</SettingsProvider>
	);
};

export { RootProvider };
