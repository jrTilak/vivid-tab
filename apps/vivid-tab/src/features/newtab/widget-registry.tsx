import type { ComponentType } from "react";
import { Bookmarks } from "./widgets/bookmarks";
import { Clock } from "./widgets/clock";
import { Notes } from "./widgets/notes";
import { Quote } from "./widgets/quote";
import { Searchbar } from "./widgets/searchbar";
import { Todos } from "./widgets/todos";
import { Weather } from "./widgets/weather";

const WIDGETS: Record<string, ComponentType> = {
	bookmarks: Bookmarks,
	clock: Clock,
	notes: Notes,
	quotes: Quote,
	searchbar: Searchbar,
	todos: Todos,
	weather: Weather,
};

const NewtabWidget = ({ id }: { id?: string }) => {
	if (!id) return null;

	const Widget = WIDGETS[id];

	return Widget ? <Widget /> : null;
};

export { NewtabWidget };
