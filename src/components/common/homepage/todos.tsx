import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PlusIcon } from 'lucide-react'
import React, { useState } from 'react'

const Todos = () => {
  const [todos, setTodos] = useState<string[]>([
    "Finish all tasks today",
    "Meet my family",
  ])
  const [newTodo, setNewTodo] = useState("")
  const addTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTodo.trim()) {
      setTodos([...todos, newTodo])
      setNewTodo("")
    }
  }
  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Todo:</h3>
      <ul className="space-y-2">
        {todos.map((todo, index) => (
          <li key={index} className="text-sm">
            • {todo}
          </li>
        ))}
      </ul>
      <form onSubmit={addTodo} className="mt-4 flex items-center">
        <Input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add new todo"
          className="mr-2 bg-white/10 text-white"
        />
        <Button size="sm" variant="secondary">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  )
}

export default Todos