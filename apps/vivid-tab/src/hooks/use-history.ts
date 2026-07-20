import { useCallback, useEffect, useState } from "react";
import type { HistoryItem } from "@/types/history";

const useHistory = () => {
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [hasPermission, setHasPermission] = useState(false);

	const fetchHistory = useCallback(() => {
		chrome.history.search(
			{ text: "", maxResults: 30, startTime: 0, endTime: Date.now() },
			(historyItems) => {
				setHistory(
					historyItems?.map((item) => ({
						id: item.id,
						title: item.title || item.url || "Untitled",
						url: item.url,
						lastVisitTime: item.lastVisitTime,
						visitCount: item.visitCount,
					})) || [],
				);
			},
		);
	}, []);

	useEffect(() => {
		chrome.permissions.contains({ permissions: ["history"] }, (granted) => {
			setHasPermission(granted);
			if (granted) fetchHistory();
		});
	}, [fetchHistory]);

	const requestPermission = () => {
		chrome.permissions.request({ permissions: ["history"] }, (granted) => {
			setHasPermission(granted);
			if (granted) fetchHistory();
		});
	};

	return { history, hasPermission, requestPermission };
};

export { useHistory };
