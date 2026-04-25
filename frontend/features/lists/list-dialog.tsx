"use client"

import { useState } from "react"
import { Plus, Trash2, BookOpen, ChevronDown, ChevronUp, X, Check, Pencil, Palette, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ShopList } from "@/components/shoplist-banner"
import type { Recipe } from "@/components/recipe-card"
import { DietaryBadge } from "@/components/dietary-badge"
import { StarRating } from "@/components/star-rating"
import Image from "next/image"
import type { ListItem } from "@/features/lists/types"

const colorOptions = [
  { value: "green", bg: "bg-green-600", label: "Green" },
  { value: "blue", bg: "bg-blue-600", label: "Blue" },
  { value: "purple", bg: "bg-purple-600", label: "Purple" },
  { value: "orange", bg: "bg-orange-600", label: "Orange" },
  { value: "red", bg: "bg-red-600", label: "Red" },
  { value: "pink", bg: "bg-pink-600", label: "Pink" },
  { value: "teal", bg: "bg-teal-600", label: "Teal" },
  { value: "yellow", bg: "bg-yellow-600", label: "Yellow" },
]

interface ListDialogProps {
  list: ShopList | null
  items: ListItem[]
  linkedRecipes: Recipe[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleItem: (itemId: string) => void
  onAddItem: (name: string, amount: string) => void
  onDeleteItem: (itemId: string) => void
  onDeleteItems: (itemIds: string[]) => void
  onUpdateItem: (itemId: string, name: string, amount: string) => void
  onViewRecipe: (recipe: Recipe) => void
  onRemoveRecipe: (recipeId: string) => void
  onChangeColor: (color: string) => void
  onChangeDate?: (date: string | undefined) => void
}

export function ListDialog({
  list,
  items,
  linkedRecipes,
  open,
  onOpenChange,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onDeleteItems,
  onUpdateItem,
  onViewRecipe,
  onRemoveRecipe,
  onChangeColor,
  onChangeDate,
}: ListDialogProps) {
  const [newItemName, setNewItemName] = useState("")
  const [newItemAmount, setNewItemAmount] = useState("")
  const [recipesExpanded, setRecipesExpanded] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  if (!list) return null

  const handleAddItem = () => {
    if (newItemName.trim()) {
      onAddItem(newItemName.trim(), newItemAmount.trim())
      setNewItemName("")
      setNewItemAmount("")
    }
  }

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map((item) => item.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedItems.size > 0) {
      setDeleteConfirmOpen(true)
    }
  }

  const confirmDeleteSelected = () => {
    onDeleteItems(Array.from(selectedItems))
    setSelectedItems(new Set())
    setDeleteConfirmOpen(false)
  }

  const startEditing = (item: ListItem) => {
    setEditingItemId(item.id)
    setEditName(item.name)
    setEditAmount(item.amount)
  }

  const saveEdit = () => {
    if (editingItemId && editName.trim()) {
      onUpdateItem(editingItemId, editName.trim(), editAmount.trim())
      setEditingItemId(null)
      setEditName("")
      setEditAmount("")
    }
  }

  const cancelEdit = () => {
    setEditingItemId(null)
    setEditName("")
    setEditAmount("")
  }

  const checkedCount = items.filter((item) => item.checked).length
  const isSelectionMode = selectedItems.size > 0

  const currentColorOption = colorOptions.find((c) => c.value === list.color) || colorOptions[0]

  const handleRecipeRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, recipe: Recipe) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onViewRecipe(recipe)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{list.name}</DialogTitle>
              <div className="flex items-center gap-1">
                {/* Date Picker */}
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
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
                    <p className="text-sm font-medium mb-2">Event Date</p>
                    <Input
                      type="date"
                      value={list.date || ""}
                      onChange={(e) => {
                        onChangeDate?.(e.target.value || undefined)
                      }}
                      className="w-full"
                    />
                    {list.date && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-muted-foreground"
                        onClick={() => {
                          onChangeDate?.(undefined)
                          setDatePickerOpen(false)
                        }}
                      >
                        Clear date
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Color Picker */}
                <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className={cn("h-4 w-4 rounded-full", currentColorOption.bg)} />
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-3" align="end">
                    <p className="text-sm font-medium mb-2">List Color</p>
                    <div className="grid grid-cols-4 gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => {
                            onChangeColor(color.value)
                            setColorPickerOpen(false)
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

          <div className="text-sm text-muted-foreground mb-4">
            {checkedCount} of {items.length} items checked
          </div>

          {/* Linked Recipes Section */}
          {linkedRecipes.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setRecipesExpanded(!recipesExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <BookOpen className="h-4 w-4" />
                <span>Recipes in this list ({linkedRecipes.length})</span>
                {recipesExpanded ? (
                  <ChevronUp className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                )}
              </button>

              {recipesExpanded && (
                <div className="mt-3 space-y-2">
                  {linkedRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 group"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onViewRecipe(recipe)}
                        onKeyDown={(e) => handleRecipeRowKeyDown(e, recipe)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                      >
                        <div className="relative h-12 w-12 rounded overflow-hidden shrink-0">
                          <Image
                            src={recipe.image}
                            alt={recipe.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">{recipe.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StarRating rating={recipe.rating} size="sm" />
                            <div className="flex gap-1">
                              {recipe.tags.slice(0, 1).map((tag) => (
                                <DietaryBadge key={tag} type={tag as any} size="sm" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => onRemoveRecipe(recipe.id)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Item Input - Now at top below recipes */}
          <div className="flex gap-2 mb-4 pb-4 border-b border-border">
            <Input
              placeholder="Item name..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              className="flex-1"
            />
            <Input
              placeholder="Amount"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              className="w-24"
            />
            <Button onClick={handleAddItem} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Selection Controls */}
          {items.length > 0 && (
            <div className="flex items-center justify-between mb-3">
              <Button
                variant={isSelectionMode ? "secondary" : "ghost"}
                size="sm"
                onClick={handleSelectAll}
                className="text-sm"
              >
                {selectedItems.size === items.length ? "Deselect all" : "Select all"}
              </Button>
              {isSelectionMode && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedItems.size})
                </Button>
              )}
            </div>
          )}

          {/* Items Section */}
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No items yet. Add some above!
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg bg-secondary/50 group transition-all",
                    item.checked && "opacity-60",
                    selectedItems.has(item.id) && "ring-2 ring-primary bg-primary/10"
                  )}
                >
                  {editingItemId === item.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-9"
                        placeholder="Item name"
                        autoFocus
                      />
                      <Input
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-24 h-9"
                        placeholder="Amount"
                      />
                      <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={saveEdit}>
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Check button - rounded green check mark style */}
                      <button
                        onClick={() => onToggleItem(item.id)}
                        className={cn(
                          "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          item.checked
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/40 hover:border-primary"
                        )}
                      >
                        {item.checked && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                      </button>

                      {/* Item name and amount - always side by side */}
                      <div className="flex-1 flex items-center justify-between min-w-0 gap-4">
                        <span className={cn("truncate", item.checked && "line-through text-muted-foreground")}>
                          {item.name}
                        </span>
                        {item.amount && (
                          <span className="text-sm text-muted-foreground shrink-0">
                            {item.amount}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEditing(item)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>

                        {/* Selection button - square checkbox style */}
                        <button
                          onClick={() => toggleSelectItem(item.id)}
                          className={cn(
                            "h-6 w-6 rounded border-2 flex items-center justify-center transition-colors",
                            selectedItems.has(item.id)
                              ? "bg-destructive/20 border-destructive"
                              : "border-muted-foreground/30 hover:border-destructive/60 opacity-0 group-hover:opacity-100"
                          )}
                          title="Select for deletion"
                        >
                          {selectedItems.has(item.id) && <Check className="h-3.5 w-3.5 text-destructive" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.size} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected items will be permanently removed from this list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
