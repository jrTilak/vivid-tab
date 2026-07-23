export const SITE = {
	name: "Vivid Tab",
	tagline: "A new tab, a new vibe.",
	description:
		"Customize your new tab with bookmarks, bang search, weather, to-dos, notes, themes, and wallpapers.",
	url: "https://vividtab.jrtilak.dev",
	githubUrl: "https://github.com/jrtilak/vivid-tab",
	contactUrl: "https://www.jrtilak.dev/contact",
	portfolioUrl: "https://www.jrtilak.dev",
	chromeStoreUrl:
		"https://chromewebstore.google.com/detail/vivid-tab/hchlkclbagoklpnijoadpghhcjpeoeim",
	chromeReviewUrl:
		"https://chromewebstore.google.com/detail/vivid-tab/hchlkclbagoklpnijoadpghhcjpeoeim/reviews",
	demoUrl: "https://youtu.be/vqRNO5dKZdg",
	firefoxStoreUrl: "https://addons.mozilla.org/en-US/firefox/addon/vivid-tab/",
	firefoxReviewUrl:
		"https://addons.mozilla.org/en-US/firefox/addon/vivid-tab/reviews/",
} as const;

export const NAV_ITEMS = [
	{ external: false, href: "/", label: "Home" },
	{ external: false, href: "/privacy", label: "Privacy Policy" },
	{ external: false, href: "/terms", label: "Terms of Service" },
	{ external: true, href: SITE.contactUrl, label: "Contact Us" },
] as const;

export const HIGHLIGHTS = [
	{
		eyebrow: "Your links, your way",
		title: "Unlimited bookmarks",
		description:
			"Choose any bookmark folder and turn it into a fast, flexible grid or list of shortcuts.",
		image: "/preview.png",
		imageAlt: "Vivid Tab showing bookmarks and productivity widgets",
	},
	{
		eyebrow: "Search with less friction",
		title: "Bang search",
		description:
			"Type shortcuts such as !yt, !g, or !gh to jump directly to the service you need.",
		image: null,
		imageAlt: "",
	},
	{
		eyebrow: "Make every tab yours",
		title: "Fully customizable",
		description:
			"Reorder widgets, switch themes and surfaces, tune corners, and use uploaded or online wallpapers.",
		image: "/custom-bg-preview.png",
		imageAlt: "Vivid Tab with a customized wallpaper and widget layout",
	},
] as const;

export const FEATURES = [
	{
		icon: "tabler:bookmarks",
		title: "Unlimited Bookmarks",
		description:
			"Display the bookmark shortcuts you need without an artificial limit.",
	},
	{
		icon: "tabler:brand-open-source",
		title: "Free & Open Source",
		description:
			"Use Vivid Tab for free, inspect the source, and contribute improvements on GitHub.",
	},
	{
		icon: "tabler:palette",
		title: "Fully Customizable",
		description:
			"Arrange widgets, select themes, adjust visual effects, and personalize wallpapers.",
	},
	{
		icon: "tabler:bolt",
		title: "Bang Search",
		description:
			"Search supported services directly with memorable shortcuts such as !yt and !gh.",
	},
	{
		icon: "tabler:list-check",
		title: "To-Dos & Notes",
		description:
			"Keep lightweight tasks and quick notes within reach on every new tab.",
	},
	{
		icon: "tabler:cloud",
		title: "Weather Insights",
		description:
			"See current local weather with a cache that remains useful when you are offline.",
	},
] as const;

export const FAQS = [
	{
		question: "Is Vivid Tab free to use?",
		answer:
			"Yes. Vivid Tab is free and open source, with no paid tier or advertising.",
	},
	{
		question: "Can I customize the layout?",
		answer:
			"Yes. You can reorder widgets, change the wallpaper, choose a theme, and adjust radius and surface effects.",
	},
	{
		question: "How do I add bookmarks as shortcuts?",
		answer:
			"Choose an existing bookmark folder during setup or create a Vivid Tab folder. Its links become your new-tab shortcuts.",
	},
	{
		question: "How does bang search work?",
		answer:
			"Start a query with a supported bang such as !yt, !g, or !gh. Vivid Tab opens the matching service with your search.",
	},
	{
		question: "Is my data private?",
		answer:
			"Vivid Tab has no analytics or advertising and does not operate a data-collection server. Features that need remote data contact only the providers described in the Privacy Policy.",
	},
	{
		question: "Can I contribute to the project?",
		answer:
			"Absolutely. Issues and contributions are welcome in the public GitHub repository.",
	},
	{
		question: "Which themes are included?",
		answer:
			"Vivid Tab includes Dark, Catppuccin Mocha, and Tokyo Night themes.",
	},
	{
		question: "Can my new tab feel like a desktop?",
		answer:
			"Yes. Combine a wallpaper with repositioned bookmarks, notes, tasks, weather, quotes, and a clock to build your preferred workspace.",
	},
	{
		question: "Which browsers are supported?",
		answer:
			"Vivid Tab supports Firefox and Chromium-based browsers such as Chrome, Brave, Vivaldi, Edge, and Helium.",
	},
] as const;
