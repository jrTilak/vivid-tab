import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

export default defineConfig({
	build: {
		format: "directory",
	},
	integrations: [
		sitemap(),
		icon({
			include: {
				tabler: ["*"],
			},
		}),
	],
	output: "static",
	site: "https://vividtab.jrtilak.dev",
	vite: {
		plugins: [tailwindcss()],
	},
});
