"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useSettings } from "@/providers/settings-provider"
import { PlusIcon, TrashIcon } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { Label } from "../ui/label"

interface Todo {
  id: number
  text: string
  completed: boolean
}

const Todos = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const {
    settings: {
      todos: { expireAfterCompleted },
    },
  } = useSettings()

  // get todos from local storage
  useEffect(() => {
    chrome.storage.sync.get("todos", (data) => {
      if (data.todos) {
        try {
          let todos = JSON.parse(data.todos)

          // remove expired todos
          const now = Date.now()
          todos = todos.filter((todo: Todo) => {
            if (todo.completed && expireAfterCompleted.enabled) {
              const expireTime =
                todo.id + expireAfterCompleted.durationInMinutes * 60 * 1000
              const shouldDelete = expireTime < now

              if (shouldDelete) {
                deleteTodo(todo.id)
              }

              return !shouldDelete
            }

            return true
          })

          setTodos(todos)
        } catch (e) {
          console.error(e)
        }
      }
    })
  }, [])

  const updateTodosInStorage = (todos: Todo[]) => {
    chrome.storage.sync.set({ todos: JSON.stringify(todos) })
  }

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault()

    if (newTodo.trim()) {
      const newTodos = [
        ...todos,
        { id: Date.now(), text: newTodo, completed: false },
      ]
      setTodos(newTodos)
      updateTodosInStorage(newTodos)
      setNewTodo("")
    }
  }

  const toggleTodo = (id: number) => {
    const newTodo = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    )

    newTodo.forEach((todo) => {
      if (todo.completed && expireAfterCompleted.enabled) {
        setTimeout(
          () => {
            deleteTodo(todo.id)
          },
          expireAfterCompleted.durationInMinutes * 60 * 1000,
        ) // convert minutes to milliseconds
      }
    })

    setTodos(newTodo)
    updateTodosInStorage(newTodo)
  }

  const deleteTodo = (id: number) => {
    const newTodo = todos.filter((todo) => todo.id !== id)
    setTodos(newTodo)
    updateTodosInStorage(newTodo)
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Todo:</h3>
      <ul className="space-y-0">
        {
          // sort the todos by latest at the top and then put the completed todos at the bottom

          todos
            .sort((a, b) => {
              if (a.completed && !b.completed) return 1
              if (!a.completed && b.completed) return -1

              return b.id - a.id
            })
            .map((todo) => (
              <li
                key={todo.id}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    tabIndex={-1}
                    id={`todo-${todo.id}`}
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                  />
                  <Label
                    htmlFor={`todo-${todo.id}`}
                    className={`text-sm ${todo.completed ? "line-through" : ""}`}
                  >
                    {todo.text}
                  </Label>
                </div>
                <button
                  tabIndex={-1}
                  onClick={() => deleteTodo(todo.id)}
                  className="text-destructive scale-0 group-hover:scale-100 transition-transform"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))
        }
      </ul>
      <form onSubmit={addTodo} className="mt-4 flex items-center">
        <Input
          tabIndex={-1}
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add new todo"
          className="mr-2 bg-background/10 border-none"
        />
        <Button
          tabIndex={-1}
          disabled={!newTodo.trim()}
          size="sm"
          variant="secondary"
          type="submit"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  )
}

export default Todos
