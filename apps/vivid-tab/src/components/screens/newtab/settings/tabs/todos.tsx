import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/providers/settings-provider";

const TodosSettings = () => {
	const {
		settings: { todos },
		setSettings,
	} = useSettings();

	const handleSettingsChange = useCallback(
		(key: string, value: unknown) => {
			setSettings((prevSettings) => ({
				...prevSettings,
				todos: {
					...prevSettings.todos,
					[key]: value,
				},
			}));
		},
		[setSettings],
	);

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label className="text-sm font-medium">
						Automatic Deletion of Completed Todos
					</Label>
				</div>
				<Switch
					checked={todos.expireAfterCompleted.enabled}
					onCheckedChange={(checked) =>
						handleSettingsChange("expireAfterCompleted", {
							...todos.expireAfterCompleted,
							enabled: checked,
						})
					}
				/>
			</div>
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label className="text-sm font-medium">
						In above case, delete after (in minutes)
					</Label>
				</div>
				<Input
					type="number"
					min={0}
					disabled={!todos.expireAfterCompleted.enabled}
					value={todos.expireAfterCompleted.durationInMinutes}
					onChange={(e) =>
						handleSettingsChange("expireAfterCompleted", {
							...todos.expireAfterCompleted,
							durationInMinutes:
								parseInt(e.target.value, 10) < 0
									? 0
									: parseInt(e.target.value, 10),
						})
					}
					className="w-16"
				/>
			</div>
		</div>
	);
};

export default TodosSettings;
