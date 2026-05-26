import type React from "react";
import { useEffect } from "react";
import { type Theme, ThemeProvider } from "@/providers/theme-provider";

import { SettingsProvider } from "./settings-provider";

import "@/styles/index.css";

type Props = {
	children: React.ReactNode;
	theme?: Theme;
};

const RootProvider = ({ children, theme }: Props) => {
	useEffect(() => {
		document.querySelector("html").classList.add("__vivid-container");
	}, []);

	return (
		<SettingsProvider>
			<ThemeProvider theme={theme}>{children}</ThemeProvider>
		</SettingsProvider>
	);
};

export { RootProvider };
