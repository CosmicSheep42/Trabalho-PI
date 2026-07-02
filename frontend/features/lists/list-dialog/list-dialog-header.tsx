"use client"

import { Calendar, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { ShopList } from "@/components/shoplist-banner"

export const colorOptions = [
  { value: "green", bg: "bg-green-600", label: "Green" },
  { value: "blue", bg: "bg-blue-600", label: "Blue" },
  { value: "purple", bg: "bg-purple-600", label: "Purple" },
  { value: "orange", bg: "bg-orange-600", label: "Orange" },
  { value: "red", bg: "bg-red-600", label: "Red" },
  { value: "pink", bg: "bg-pink-600", label: "Pink" },
  { value: "teal", bg: "bg-teal-600", label: "Teal" },
  { value: "yellow", bg: "bg-yellow-600", label: "Yellow" },
]

interface ListDialogHeaderProps {
  colorPickerOpen: boolean
  datePickerOpen: boolean
  list: ShopList
  onChangeColor: (color: string) => void
  onChangeDate?: (date: string | undefined) => void
  onColorPickerOpenChange: (open: boolean) => void
  onDatePickerOpenChange: (open: boolean) => void
}

export function ListDialogHeader({
  colorPickerOpen,
  datePickerOpen,
  list,
  onChangeColor,
  onChangeDate,
  onColorPickerOpenChange,
  onDatePickerOpenChange,
}: ListDialogHeaderProps) {
  const currentColorOption = colorOptions.find((color) => color.value === list.color) || colorOptions[0]

  return (
    <DialogHeader>
      <div className="flex items-center justify-between">
        <DialogTitle className="text-xl">{list.name}</DialogTitle>
        <div className="flex items-center gap-1">
          <Popover open={datePickerOpen} onOpenChange={onDatePickerOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                {list.date ? (
                  <span className="text-xs">
                    {new Date(list.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Add date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <p className="mb-2 text-sm font-medium">Event Date</p>
              <Input
                type="date"
                value={list.date || ""}
                onChange={(event) => {
                  onChangeDate?.(event.target.value || undefined)
                }}
                className="w-full"
              />
              {list.date ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-muted-foreground"
                  onClick={() => {
                    onChangeDate?.(undefined)
                    onDatePickerOpenChange(false)
                  }}
                >
                  Clear date
                </Button>
              ) : null}
            </PopoverContent>
          </Popover>

          <Popover open={colorPickerOpen} onOpenChange={onColorPickerOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className={cn("h-4 w-4 rounded-full", currentColorOption.bg)} />
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="end">
              <p className="mb-2 text-sm font-medium">List Color</p>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      onChangeColor(color.value)
                      onColorPickerOpenChange(false)
                    }}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      color.bg,
                      list.color === color.value
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                        : "hover:scale-110"
                    )}
                    title={color.label}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </DialogHeader>
  )
}
