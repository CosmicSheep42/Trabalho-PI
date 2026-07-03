"use client"

import { useState } from "react"
import type { ListItem } from "@/features/lists/types"

export function useListDialogState() {
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

  function startEditing(item: ListItem) {
    setEditingItemId(item.id)
    setEditName(item.text)
    setEditAmount(item.amount)
  }

  function cancelEdit() {
    setEditingItemId(null)
    setEditName("")
    setEditAmount("")
  }

  function toggleSelectItem(itemId: string) {
    setSelectedItems((current) => {
      const next = new Set(current)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  return {
    colorPickerOpen,
    datePickerOpen,
    deleteConfirmOpen,
    editAmount,
    editName,
    editingItemId,
    newItemAmount,
    newItemName,
    recipesExpanded,
    selectedItems,
    setColorPickerOpen,
    setDatePickerOpen,
    setDeleteConfirmOpen,
    setEditAmount,
    setEditName,
    setEditingItemId,
    setNewItemAmount,
    setNewItemName,
    setRecipesExpanded,
    setSelectedItems,
    cancelEdit,
    startEditing,
    toggleSelectItem,
  }
}
