"use client"

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
  const { lists, profile, recipes, shell, social } = screen

  return (
    <>
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
