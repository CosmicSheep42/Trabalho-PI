"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Calendar, X } from "lucide-react"

const colors = [
  { name: "green", className: "bg-emerald-500" },
  { name: "blue", className: "bg-sky-500" },
  { name: "purple", className: "bg-violet-500" },
  { name: "orange", className: "bg-orange-500" },
  { name: "pink", className: "bg-pink-400" },
  { name: "cyan", className: "bg-teal-500" },
  { name: "amber", className: "bg-amber-500" },
  { name: "rose", className: "bg-rose-400" },
]

interface CreateListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, color: string, date?: string) => void
  editingList?: { id: string; name: string; color: string; date?: string } | null
}

export function CreateListDialog({
  open,
  onOpenChange,
  onCreate,
  editingList,
}: CreateListDialogProps) {
  const [name, setName] = useState("")
  const [selectedColor, setSelectedColor] = useState("green")
  const [date, setDate] = useState<string>("")

  useEffect(() => {
    if (editingList) {
      setName(editingList.name)
      setSelectedColor(editingList.color)
      setDate(editingList.date || "")
    } else {
      setName("")
      setSelectedColor("green")
      setDate("")
    }
  }, [editingList, open])

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate(name.trim(), selectedColor, date || undefined)
      setName("")
      setSelectedColor("green")
      setDate("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editingList ? "Edit List" : "Create New List"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>List Name</Label>
            <Input
              placeholder="e.g., Weekly Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="space-y-2">
            <Label>Event Date (optional)</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-9"
                />
              </div>
              {date && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDate("")}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Add a date if this list is for a specific event
            </p>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    color.className,
                    selectedColor === color.name
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary"
                      : "hover:scale-110"
                  )}
                />
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full">
            {editingList ? "Save Changes" : "Create List"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
