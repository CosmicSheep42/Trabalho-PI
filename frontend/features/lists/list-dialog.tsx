"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { ShopList } from "@/components/shoplist-banner"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"
import type { ListItem } from "@/features/lists/types"
import { DeleteItemsDialog } from "@/features/lists/list-dialog/delete-items-dialog"
import { ItemsSection } from "@/features/lists/list-dialog/items-section"
import { LinkedRecipesSection } from "@/features/lists/list-dialog/linked-recipes-section"
import { ListDialogHeader } from "@/features/lists/list-dialog/list-dialog-header"
import { useListDialogState } from "@/features/lists/list-dialog/use-list-dialog-state"

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
  onViewRecipe: (recipe: Recipe, context?: RecipeServingsContext) => void
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
  const state = useListDialogState()

  if (!list) return null

  const handleAddItem = () => {
    if (state.newItemName.trim()) {
      onAddItem(state.newItemName.trim(), state.newItemAmount.trim())
      state.setNewItemName("")
      state.setNewItemAmount("")
    }
  }

  const handleSelectAll = () => {
    if (state.selectedItems.size === items.length) {
      state.setSelectedItems(new Set())
    } else {
      state.setSelectedItems(new Set(items.map((item) => item.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (state.selectedItems.size > 0) {
      state.setDeleteConfirmOpen(true)
    }
  }

  const confirmDeleteSelected = () => {
    onDeleteItems(Array.from(state.selectedItems))
    state.setSelectedItems(new Set())
    state.setDeleteConfirmOpen(false)
  }

  const saveEdit = () => {
    if (state.editingItemId && state.editName.trim()) {
      onUpdateItem(state.editingItemId, state.editName.trim(), state.editAmount.trim())
      state.cancelEdit()
    }
  }

  const checkedCount = items.filter((item) => item.checked).length
  const isSelectionMode = state.selectedItems.size > 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <ListDialogHeader
            colorPickerOpen={state.colorPickerOpen}
            datePickerOpen={state.datePickerOpen}
            list={list}
            onChangeColor={onChangeColor}
            onChangeDate={onChangeDate}
            onColorPickerOpenChange={state.setColorPickerOpen}
            onDatePickerOpenChange={state.setDatePickerOpen}
          />

          <div className="text-sm text-muted-foreground mb-4">
            {checkedCount} of {items.length} items checked
          </div>

          <LinkedRecipesSection
            linkedRecipes={linkedRecipes}
            listId={list.id}
            recipesExpanded={state.recipesExpanded}
            onRemoveRecipe={onRemoveRecipe}
            onToggleExpanded={() => state.setRecipesExpanded((current) => !current)}
            onViewRecipe={onViewRecipe}
          />

          <ItemsSection
            editAmount={state.editAmount}
            editName={state.editName}
            editingItemId={state.editingItemId}
            isSelectionMode={isSelectionMode}
            items={items}
            newItemAmount={state.newItemAmount}
            newItemName={state.newItemName}
            selectedItems={state.selectedItems}
            onAddItem={handleAddItem}
            onDeleteSelected={handleDeleteSelected}
            onEditAmountChange={state.setEditAmount}
            onEditNameChange={state.setEditName}
            onNewItemAmountChange={state.setNewItemAmount}
            onNewItemNameChange={state.setNewItemName}
            onSaveEdit={saveEdit}
            onSelectAll={handleSelectAll}
            onStartEditing={state.startEditing}
            onToggleItem={onToggleItem}
            onToggleSelectItem={state.toggleSelectItem}
            onCancelEdit={state.cancelEdit}
          />
        </DialogContent>
      </Dialog>

      <DeleteItemsDialog
        open={state.deleteConfirmOpen}
        selectedItemsCount={state.selectedItems.size}
        onConfirm={confirmDeleteSelected}
        onOpenChange={state.setDeleteConfirmOpen}
      />
    </>
  )
}
