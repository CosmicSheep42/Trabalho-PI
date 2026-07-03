"use client"

import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ListItem } from "@/features/lists/types"

interface ItemsSectionProps {
  editAmount: string
  editName: string
  editingItemId: string | null
  isSelectionMode: boolean
  items: ListItem[]
  newItemAmount: string
  newItemName: string
  selectedItems: Set<string>
  onAddItem: () => void
  onDeleteSelected: () => void
  onEditAmountChange: (value: string) => void
  onEditNameChange: (value: string) => void
  onNewItemAmountChange: (value: string) => void
  onNewItemNameChange: (value: string) => void
  onSaveEdit: () => void
  onSelectAll: () => void
  onStartEditing: (item: ListItem) => void
  onToggleItem: (itemId: string) => void
  onToggleSelectItem: (itemId: string) => void
  onCancelEdit: () => void
}

export function ItemsSection({
  editAmount,
  editName,
  editingItemId,
  isSelectionMode,
  items,
  newItemAmount,
  newItemName,
  selectedItems,
  onAddItem,
  onDeleteSelected,
  onEditAmountChange,
  onEditNameChange,
  onNewItemAmountChange,
  onNewItemNameChange,
  onSaveEdit,
  onSelectAll,
  onStartEditing,
  onToggleItem,
  onToggleSelectItem,
  onCancelEdit,
}: ItemsSectionProps) {
  return (
    <>
      <div className="mb-4 flex gap-2 border-b border-border pb-4">
        <Input
          placeholder="Item name..."
          value={newItemName}
          onChange={(event) => onNewItemNameChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onAddItem()}
          className="flex-1"
        />
        <Input
          placeholder="Amount"
          value={newItemAmount}
          onChange={(event) => onNewItemAmountChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onAddItem()}
          className="w-24"
        />
        <Button onClick={onAddItem} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="mb-3 flex items-center justify-between">
          <Button variant={isSelectionMode ? "secondary" : "ghost"} size="sm" onClick={onSelectAll} className="text-sm">
            {selectedItems.size === items.length ? "Deselect all" : "Select all"}
          </Button>
          {isSelectionMode ? (
            <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedItems.size})
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No items yet. Add some above!</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex items-center gap-3 rounded-lg bg-secondary/50 p-3 transition-all",
                item.checked && "opacity-60",
                selectedItems.has(item.id) && "bg-primary/10 ring-2 ring-primary"
              )}
            >
              {editingItemId === item.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(event) => onEditNameChange(event.target.value)}
                    className="h-9 flex-1"
                    placeholder="Item name"
                    autoFocus
                  />
                  <Input
                    value={editAmount}
                    onChange={(event) => onEditAmountChange(event.target.value)}
                    className="h-9 w-24"
                    placeholder="Amount"
                  />
                  <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={onSaveEdit}>
                    <Check className="h-4 w-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={onCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onToggleItem(item.id)}
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      item.checked
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40 hover:border-primary"
                    )}
                  >
                    {item.checked ? <Check className="h-3.5 w-3.5 text-primary-foreground" /> : null}
                  </button>

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                    <span className={cn("truncate", item.checked && "line-through text-muted-foreground")}>
                      {item.text}
                    </span>
                    {item.amount ? <span className="shrink-0 text-sm text-muted-foreground">{item.amount}</span> : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => onStartEditing(item)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <button
                      onClick={() => onToggleSelectItem(item.id)}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded border-2 transition-colors",
                        selectedItems.has(item.id)
                          ? "border-destructive bg-destructive/20"
                          : "border-muted-foreground/30 opacity-0 hover:border-destructive/60 group-hover:opacity-100"
                      )}
                      title="Select for deletion"
                    >
                      {selectedItems.has(item.id) ? <Check className="h-3.5 w-3.5 text-destructive" /> : null}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}
