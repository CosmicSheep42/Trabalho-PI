"use client"

import { MessageCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { Button } from "@/components/ui/button"
import { ChatSheet } from "@/features/chat/chat-sheet"
import { FriendsDialog } from "@/features/friends/friends-dialog"
import { CreateListDialog } from "@/features/lists/create-list-dialog"
import { ListDialog } from "@/features/lists/list-dialog"
import { ProfileDialog } from "@/features/profile/profile-dialog"
import { RecipeDialog } from "@/features/recipes/recipe-dialog"
import { SettingsDialog } from "@/features/settings/settings-dialog"
import { UsernamePromptDialog } from "@/features/settings/username-prompt-dialog"
import type { HomeScreenModel } from "@/features/home/model/types"

interface UsernamePromptState {
  open: boolean
  onSkip: () => void
}

export function MainPageDialogs({
  screen,
  usernamePrompt,
}: { screen: HomeScreenModel; usernamePrompt: UsernamePromptState }) {
  const { chat, lists, profile, recipes, shell, social } = screen
  const chatButtonSize = 56
  const chatButtonMargin = 24
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    moved: false,
  })
  const [chatButtonPosition, setChatButtonPosition] = useState({ x: 0, y: 0 })
  const [isPositionReady, setIsPositionReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    setChatButtonPosition({
      x: window.innerWidth - chatButtonSize - chatButtonMargin,
      y: window.innerHeight - chatButtonSize - chatButtonMargin,
    })
    setIsPositionReady(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !isPositionReady) {
      return
    }

    const clampPosition = () => {
      setChatButtonPosition((current) => ({
        x: Math.min(Math.max(current.x, chatButtonMargin), window.innerWidth - chatButtonSize - chatButtonMargin),
        y: Math.min(Math.max(current.y, chatButtonMargin), window.innerHeight - chatButtonSize - chatButtonMargin),
      }))
    }

    window.addEventListener("resize", clampPosition)
    return () => window.removeEventListener("resize", clampPosition)
  }, [chatButtonMargin, chatButtonSize, isPositionReady])

  const resetDragState = () => {
    dragStateRef.current = {
      pointerId: -1,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      moved: false,
    }
  }

  const handleChatButtonPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) {
      return
    }

    const rect = buttonRef.current.getBoundingClientRect()
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleChatButtonPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current
    if (dragState.pointerId !== event.pointerId || typeof window === "undefined") {
      return
    }

    const nextX = event.clientX - dragState.offsetX
    const nextY = event.clientY - dragState.offsetY
    const clampedX = Math.min(
      Math.max(nextX, chatButtonMargin),
      window.innerWidth - chatButtonSize - chatButtonMargin
    )
    const clampedY = Math.min(
      Math.max(nextY, chatButtonMargin),
      window.innerHeight - chatButtonSize - chatButtonMargin
    )

    if (!dragState.moved) {
      const deltaX = event.clientX - dragState.startX
      const deltaY = event.clientY - dragState.startY
      dragState.moved = Math.hypot(deltaX, deltaY) > 6
    }

    setChatButtonPosition({ x: clampedX, y: clampedY })
  }

  const handleChatButtonPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current
    if (dragState.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const shouldOpenChat = !dragState.moved
    resetDragState()

    if (shouldOpenChat) {
      shell.setChatOpen(true)
    }
  }

  const handleChatButtonPointerCancel = () => {
    resetDragState()
  }

  return (
    <>
      {!shell.chatOpen && isPositionReady ? (
        <Button
          ref={buttonRef}
          type="button"
          size="icon"
          className="fixed z-40 h-14 w-14 rounded-full bg-green-600 text-white shadow-lg shadow-green-900/25 transition-colors hover:bg-green-500 active:bg-green-500 touch-none"
          aria-label="Open chat"
          style={{
            left: `${chatButtonPosition.x}px`,
            top: `${chatButtonPosition.y}px`,
          }}
          onPointerDown={handleChatButtonPointerDown}
          onPointerMove={handleChatButtonPointerMove}
          onPointerUp={handleChatButtonPointerUp}
          onPointerCancel={handleChatButtonPointerCancel}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : null}

      <ChatSheet
        open={shell.chatOpen}
        draft={chat.draft}
        error={chat.error}
        isHydrated={chat.isHydrated}
        isSending={chat.isSending}
        messages={chat.messages}
        onOpenChange={shell.setChatOpen}
        onDraftChange={chat.setDraft}
        onSendMessage={chat.sendMessage}
      />

      <RecipeDialog
        key={`${recipes.selectedRecipe?.id ?? "recipe-dialog"}:${recipes.selectedRecipe?.servings ?? "default"}:${shell.recipeDialogOpen ? "open" : "closed"}`}
        recipe={recipes.selectedRecipe}
        open={shell.recipeDialogOpen}
        onOpenChange={shell.setRecipeDialogOpen}
        lists={lists.lists}
        servingsContext={recipes.selectedRecipeContext}
        onAddToList={recipes.actions.addToList}
        onSaveRecipe={recipes.actions.saveRecipe}
        onSaveNotes={recipes.actions.saveRecipeNotes}
        onUpdateServings={recipes.actions.persistRecipeServings}
        onServingsPersisted={recipes.updateSelectedRecipeServings}
        onRateRecipe={recipes.actions.rateRecipe}
        onRemoveRating={recipes.actions.removeRating}
      />

      <ListDialog
        list={lists.selectedList}
        items={lists.selectedList ? lists.listItems[lists.selectedList.id] || [] : []}
        linkedRecipes={lists.selectedList ? lists.linkedRecipes(lists.selectedList) : []}
        currentUserId={profile.user.id}
        availableFriends={social.friends}
        availableGroups={social.friendGroups}
        open={shell.listDialogOpen}
        onOpenChange={shell.setListDialogOpen}
        onToggleItem={lists.actions.toggleItem}
        onAddItem={lists.actions.addItem}
        onDeleteItem={lists.actions.deleteItem}
        onDeleteItems={lists.actions.deleteItems}
        onUpdateItem={lists.actions.updateItem}
        onViewRecipe={lists.actions.viewRecipeFromList}
        onRemoveRecipe={lists.actions.removeRecipeFromList}
        onChangeColor={lists.actions.changeListColor}
        onChangeDate={lists.actions.changeListDate}
        onShareWithFriend={lists.actions.shareListWithFriend}
        onShareWithGroup={lists.actions.shareListWithGroup}
        onRemoveCollaborator={lists.actions.removeListCollaborator}
      />

      <ProfileDialog
        key={`profile:${shell.profileOpen ? "open" : "closed"}:${profile.user.username ?? "none"}:${profile.user.usernameUpdatedAt ?? "never"}`}
        open={shell.profileOpen}
        onOpenChange={shell.setProfileOpen}
        user={profile.user}
        onSave={profile.saveUserAllergies}
        onSaveUsername={profile.saveUsername}
        isSavingUser={profile.isSavingUser}
        isSavingUsername={profile.isSavingUsername}
      />

      <FriendsDialog
        open={shell.friendsOpen}
        onOpenChange={shell.setFriendsOpen}
        friends={social.friends}
        groups={social.friendGroups}
        incomingRequests={social.incomingFriendRequests}
        outgoingRequests={social.outgoingFriendRequests}
        searchResults={social.searchResults}
        isLoading={social.isLoadingFriends}
        isSearching={social.isSearchingFriends}
        isSaving={social.isSavingFriendAction}
        onSearch={social.searchFriends}
        onSendRequest={social.sendFriendRequest}
        onAcceptRequest={social.acceptFriendRequest}
        onDeclineRequest={social.declineFriendRequest}
        onCancelRequest={social.cancelFriendRequest}
        onRemoveFriend={social.removeFriend}
        onCreateGroup={social.createFriendGroup}
        onUpdateGroup={social.updateFriendGroup}
        onDeleteGroup={social.deleteFriendGroup}
      />

      <SettingsDialog
        key={`settings:${shell.settingsOpen ? "open" : "closed"}:${profile.user.username ?? "none"}`}
        open={shell.settingsOpen}
        onOpenChange={shell.setSettingsOpen}
        user={profile.user}
        onSaveUsername={profile.saveUsername}
        isSavingUsername={profile.isSavingUsername}
      />

      <UsernamePromptDialog
        key={`username-prompt:${usernamePrompt.open ? profile.user.clerkUserId : "closed"}`}
        open={usernamePrompt.open}
        onSkip={usernamePrompt.onSkip}
        onSave={async (username) => { await profile.saveUsername(username) }}
        isSaving={profile.isSavingUsername}
      />

      <CreateListDialog
        open={shell.createListOpen}
        onOpenChange={(open) => {
          shell.setCreateListOpen(open)
          if (!open) {
            shell.setEditingList(null)
          }
        }}
        onCreate={lists.actions.createList}
        editingList={shell.editingList}
      />
    </>
  )
}
