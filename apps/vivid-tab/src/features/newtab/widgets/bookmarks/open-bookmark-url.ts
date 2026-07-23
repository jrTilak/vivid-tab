const openBookmarkUrl = (url: string, newTab: boolean) => {
	if (newTab) {
		void chrome.tabs.create({ active: true, url });
		return;
	}

	void chrome.tabs.update({ active: true, url });
};

export { openBookmarkUrl };
