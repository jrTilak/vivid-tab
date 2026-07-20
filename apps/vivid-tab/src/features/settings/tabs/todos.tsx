import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/providers/settings-provider";
import { SettingsPage, SettingsRow, SettingsSection } from "../settings-ui";
import { parseNonNegativeInteger } from "../settings-values";

const TodosSettings = () => {
	const {
		settings: {
			widgets: { todos },
		},
		setSettings,
	} = useSettings();
	const { expireAfterCompleted } = todos;

	const updateExpiration = (updates: Partial<typeof expireAfterCompleted>) => {
		setSettings((current) => ({
			...current,
			widgets: {
				...current.widgets,
				todos: {
					expireAfterCompleted: {
						...current.widgets.todos.expireAfterCompleted,
						...updates,
					},
				},
			},
		}));
	};

	return (
		<SettingsPage>
			<SettingsSection title="Completed todos">
				<SettingsRow
					controlId="settings-expire-todos"
					description="Automatically remove completed items after a delay."
					label="Automatic deletion"
				>
					<Switch
						checked={expireAfterCompleted.enabled}
						id="settings-expire-todos"
						onCheckedChange={(enabled) => updateExpiration({ enabled })}
					/>
				</SettingsRow>

				<SettingsRow
					controlId="settings-todo-expiration"
					label="Delete after (minutes)"
				>
					<Input
						className="w-24"
						disabled={!expireAfterCompleted.enabled}
						id="settings-todo-expiration"
						min={0}
						onChange={(event) => {
							const durationInMinutes = parseNonNegativeInteger(
								event.target.value,
							);

							if (durationInMinutes !== undefined) {
								updateExpiration({ durationInMinutes });
							}
						}}
						type="number"
						value={expireAfterCompleted.durationInMinutes}
					/>
				</SettingsRow>
			</SettingsSection>
		</SettingsPage>
	);
};

export default TodosSettings;
