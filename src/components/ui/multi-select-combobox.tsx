"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/cn"
import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

export interface Option {
  value: string
  label: string
}

interface MultiSelectComboboxProps {
  options: Option[]
  placeholder?: string
  emptyMessage?: string
  selectedValues: string[]
  onSelectedValuesChange: (values: string[]) => void
  className?: string
  disabled?: boolean
}

export function MultiSelectCombobox({
  options,
  placeholder = "Select items...",
  emptyMessage = "No item found.",
  selectedValues,
  onSelectedValuesChange,
  className,
  disabled,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    onSelectedValuesChange(
      selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value],
    )
  }

  const handleRemove = (value: string) => {
    onSelectedValuesChange(selectedValues.filter((v) => v !== value))
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger disabled={disabled} asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedValues.length > 0
              ? `${selectedValues.length} selected`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder={`Search ${placeholder.toLowerCase()}...`}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValues.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="mt-3">
        {selectedValues.map((value) => {
          const option = options.find((o) => o.value === value)

          return option ? (
            <Badge key={value} variant="secondary" className="mr-1 mb-1">
              {option.label}
              <button
                className="ml-1 ring-offset-background rounded-full outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRemove(value)
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={() => handleRemove(value)}
              >
                ✕
              </button>
            </Badge>
          ) : null
        })}
      </div>
    </div>
  )
}
