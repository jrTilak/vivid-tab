import { useCallback, useSyncExternalStore } from "react";
import {
	getBookmarkIconSnapshot,
	subscribeBookmarkIcon,
} from "@/lib/bookmark-icon-store";

type Props = {
	id?: string;
	defaultIcon?: string;
};

const useIcon = (props: Props) => {
	const subscribe = useCallback(
		(listener: () => void) => subscribeBookmarkIcon(props.id, listener),
		[props.id],
	);
	const getSnapshot = useCallback(
		() => getBookmarkIconSnapshot(props.id, props.defaultIcon),
		[props.defaultIcon, props.id],
	);
	const icon = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	return { icon };
};

export { useIcon };
