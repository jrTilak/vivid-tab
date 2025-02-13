import { SearchIcon } from "lucide-react"
import React, { useState } from "react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"

const Searchbar1 = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    window.location.href = `https://www.google.com/search?q=${searchQuery}`
  }
  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <div className="flex-grow">
        <Input
          type="text"
          placeholder="Search Google..."
          className="w-full rounded-full px-4 py-2 border-2 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        className="rounded-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2">
        <SearchIcon className="h-5 w-5" />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  )
}

export default Searchbar1
