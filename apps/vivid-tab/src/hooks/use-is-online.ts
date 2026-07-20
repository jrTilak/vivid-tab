import { useCallback, useEffect, useState } from "react";

/**
 * A custom hook to track the online/offline status of the user.
 */
const useIsOnline = () => {
	const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

	const updateOnlineStatus = useCallback(() => {
		setIsOnline(true);
	}, []);

	const updateOfflineStatus = useCallback(() => {
		setIsOnline(false);
	}, []);

	useEffect(() => {
		// Listen to the online and offline events
		window.addEventListener("online", updateOnlineStatus);
		window.addEventListener("offline", updateOfflineStatus);

		// Cleanup the event listeners when the component unmounts
		return () => {
			window.removeEventListener("online", updateOnlineStatus);
			window.removeEventListener("offline", updateOfflineStatus);
		};
	}, [updateOnlineStatus, updateOfflineStatus]);

	return isOnline;
};

export { useIsOnline };
