"use client"

import { useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ShopList } from "@/components/shoplist-banner"
import type { FriendGroup, FriendUser } from "@/features/friends/types"
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
  availableFriends: FriendUser[]
  availableGroups: FriendGroup[]
  onShareWithFriend: (friendUserId: number) => Promise<void>
  onShareWithGroup: (groupId: number) => Promise<void>
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
  availableFriends,
  availableGroups,
  onShareWithFriend,
  onShareWithGroup,
}: ListDialogProps) {
  const state = useListDialogState()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedFriendId, setSelectedFriendId] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [shareError, setShareError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  const shareableFriends = useMemo(() => {
    if (!list) {
      return []
    }
    const memberIds = new Set([list.owner.id, ...list.collaborators.map((member) => member.id)])
    return availableFriends.filter((friend) => !memberIds.has(String(friend.id)))
  }, [availableFriends, list])
  const shareableGroups = useMemo(
    () => availableGroups.filter((group) => group.members.length > 0),
    [availableGroups]
  )

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

  async function handleShareList() {
    if (!selectedFriendId) {
      setShareError("Select a friend to invite.")
      return
    }

    setIsSharing(true)
    try {
      setShareError(null)
      await onShareWithFriend(Number(selectedFriendId))
      setSelectedFriendId("")
      setShareDialogOpen(false)
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Unable to share the list.")
    } finally {
      setIsSharing(false)
    }
  }

  async function handleShareGroup() {
    if (!selectedGroupId) {
      setShareError("Select a group to invite.")
      return
    }

    setIsSharing(true)
    try {
      setShareError(null)
      await onShareWithGroup(Number(selectedGroupId))
      setSelectedGroupId("")
      setShareDialogOpen(false)
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Unable to share the list.")
    } finally {
      setIsSharing(false)
    }
  }

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
            onShareClick={() => setShareDialogOpen(true)}
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

      <Dialog
        open={shareDialogOpen}
        onOpenChange={(nextOpen) => {
          setShareDialogOpen(nextOpen)
          if (!nextOpen) {
            setSelectedFriendId("")
            setSelectedGroupId("")
            setShareError(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share list</DialogTitle>
            <DialogDescription>
              Invite one of your friends to collaborate on this list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-sm font-medium">People with access</p>
              <div className="mt-3 space-y-2">
                {[list.owner, ...list.collaborators].map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">@{member.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {shareableFriends.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Invite a friend</p>
                <Select value={selectedFriendId} onValueChange={(value) => {
                  setSelectedFriendId(value)
                  setSelectedGroupId("")
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a friend" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareableFriends.map((friend) => (
                      <SelectItem key={friend.id} value={String(friend.id)}>
                        @{friend.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {shareableGroups.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Invite a group</p>
                <Select value={selectedGroupId} onValueChange={(value) => {
                  setSelectedGroupId(value)
                  setSelectedFriendId("")
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareableGroups.map((group) => (
                      <SelectItem key={group.id} value={String(group.id)}>
                        {group.name} ({group.members.length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {shareableFriends.length === 0 && shareableGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You do not have friends or groups available to invite.
              </p>
            ) : null}

            {shareError ? <p className="text-sm text-destructive">{shareError}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void (selectedGroupId ? handleShareGroup() : handleShareList())}
              disabled={isSharing || (shareableFriends.length === 0 && shareableGroups.length === 0)}
            >
              {isSharing ? "Inviting..." : "Invite"}
            </Button>
          </DialogFooter>
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
