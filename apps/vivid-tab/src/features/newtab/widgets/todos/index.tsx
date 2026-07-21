import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { useSettings } from "@/providers/settings-provider";
import { useTodos } from "./use-todos";

const Todos = () => {
	const {
		settings: {
			widgets: {
				todos: { expireAfterCompleted },
			},
		},
	} = useSettings();
	const { addTodo, removeTodo, todoDraft, todos, toggleTodo, updateTodoDraft } =
		useTodos(expireAfterCompleted);

	return (
		<Card className="p-6 gap-2">
			<h3 className="text-lg font-semibold">Todo:</h3>
			{todos.length > 0 && (
				<ul className="space-y-0">
					{todos.map((todo) => (
						<li
							key={todo.id}
							className="group flex items-center justify-between"
						>
							<div className="flex items-center space-x-2">
								<Checkbox
									id={`todo-${todo.id}`}
									checked={todo.completed}
									onCheckedChange={() => toggleTodo(todo.id)}
								/>
								<Label
									htmlFor={`todo-${todo.id}`}
									className={cn("text-sm", todo.completed && "line-through")}
								>
									{todo.text}
								</Label>
							</div>
							<button
								aria-label={`Delete ${todo.text}`}
								type="button"
								onClick={() => removeTodo(todo.id)}
								className="scale-0 cursor-pointer text-destructive transition-transform group-hover:scale-100 focus-visible:scale-100 disabled:cursor-default"
							>
								<IconTrash className="size-4" />
							</button>
						</li>
					))}
				</ul>
			)}
			<form onSubmit={addTodo} className="mt-4 flex items-center">
				<Input
					type="text"
					value={todoDraft}
					onChange={updateTodoDraft}
					placeholder="Add new todo"
					className="mr-2 border-none bg-background/10"
				/>
				<Button
					disabled={!todoDraft.trim()}
					size="sm"
					variant="secondary"
					type="submit"
				>
					<IconPlus className="size-4" />
				</Button>
			</form>
		</Card>
	);
};

export { Todos };
