import { useEffect, useState } from "react";

/**
 * Custom hook to fetch and manage browser top sites items.
 */
const useTopSites = (enabled = true) => {
	const [topSites, setTopSites] = useState<chrome.topSites.MostVisitedURL[]>(
		[],
	);

	useEffect(() => {
		if (!enabled) return;

		chrome.topSites.get((topSitesItems) => {
			setTopSites(topSitesItems?.slice(0, 30) || []);
		});
	}, [enabled]);

	return topSites;
};

export { useTopSites };
