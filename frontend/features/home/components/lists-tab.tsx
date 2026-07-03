"use client"

import { memo } from "react"
import { CalendarSection } from "@/features/home/components/lists-tab/calendar-section"
import { EventDialogs } from "@/features/home/components/lists-tab/event-dialogs"
import { MyListsSection } from "@/features/home/components/lists-tab/my-lists-section"
import { ListsTabRecipeCard } from "@/features/home/components/lists-tab/recipe-card"
import { SavedRecipesSection } from "@/features/home/components/lists-tab/saved-recipes-section"
import type { ListsTabProps, RecipeCardOptions } from "@/features/home/components/lists-tab/types"
import { useListsTabActions } from "@/features/home/components/lists-tab/use-lists-tab-actions"
import { useListsTabData } from "@/features/home/components/lists-tab/use-lists-tab-data"
import { useListsTabState } from "@/features/home/components/lists-tab/use-lists-tab-state"
import { WeeklyMealPlannerSection } from "@/features/home/components/lists-tab/weekly-meal-planner-section"
import type { Recipe } from "@/features/recipes/types"

function ListsTabComponent(props: ListsTabProps) {
  const state = useListsTabState()
  const data = useListsTabData(props, {
    calendarMonth: state.calendarMonth,
    pinnedListIds: state.pinnedListIds,
    selectedDate: state.selectedDate,
    selectedSavedTab: state.selectedSavedTab,
  })
  const actions = useListsTabActions(props, state, {
    mealPlannerRecipes: data.mealPlannerRecipes,
    plannerEntriesByDay: data.plannerEntriesByDay,
  })

  function renderRecipeCard(recipe: Recipe, options?: RecipeCardOptions) {
    return (
      <ListsTabRecipeCard
        draggedRecipeId={state.draggedRecipeId}
        onOpenRecipe={props.onOpenRecipe}
        onPendingRemoval={(recipeId, recipeName, entryId) =>
          state.setPendingRemoval({
            source: entryId ? "planner" : "saved",
            recipeId,
            recipeName,
            entryId,
          })
        }
        onDragStateChange={state.setDraggedRecipeId}
        recipe={recipe}
        options={options}
      />
    )
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(420px,1.1fr)]">
        <MyListsSection
          lists={data.sortedVisibleLists}
          pinnedListIds={state.pinnedListIds}
          searchQuery={props.searchQuery}
          onCreateList={props.onCreateList}
          onDeleteList={props.onDeleteList}
          onEditList={props.onEditList}
          onOpenList={props.onOpenList}
          onSearchQueryChange={props.onSearchQueryChange}
          onTogglePin={(listId) =>
            state.setPinnedListIds((currentPinned) =>
              currentPinned.includes(listId)
                ? currentPinned.filter((id) => id !== listId)
                : [listId, ...currentPinned]
            )
          }
        />

        <CalendarSection
          calendarDays={data.calendarDays}
          calendarMonth={state.calendarMonth}
          eventsByDate={data.eventsByDate}
          selectedDate={state.selectedDate}
          onCalendarMonthChange={state.setCalendarMonth}
          onCalendarDayClick={actions.handleCalendarDayClick}
          onCreateEvent={() => actions.openEventDialog(state.selectedDate)}
        />
      </div>

      <SavedRecipesSection
        activeTabId={data.activeSavedTabId}
        draggedRecipeId={state.draggedRecipeId}
        savedRecipesExpanded={state.savedRecipesExpanded}
        savedRecipeTabs={data.savedRecipeTabs}
        savedTabsScrollRef={actions.savedTabsScrollRef}
        onDropToBank={actions.handleSavedBankDrop}
        onPointerCancel={actions.handleSavedTabsPointerEnd}
        onPointerDown={actions.handleSavedTabsPointerDown}
        onPointerMove={actions.handleSavedTabsPointerMove}
        onPointerUp={actions.handleSavedTabsPointerEnd}
        onRemoveSavedRecipe={(recipe) =>
          state.setPendingRemoval({
            source: "saved",
            recipeId: recipe.id,
            recipeName: recipe.name,
          })
        }
        onSavedTabChange={state.setSelectedSavedTab}
        onSavedRecipesExpandedChange={state.setSavedRecipesExpanded}
        renderRecipeCard={renderRecipeCard}
      />

      <WeeklyMealPlannerSection
        currentPlannerWeekDates={data.currentPlannerWeekDates}
        plannerEntriesByDay={data.plannerEntriesByDay}
        plannerEventSuggestionsByDay={data.plannerEventSuggestionsByDay}
        recipeMap={data.recipeMap}
        onDayDrop={actions.handlePlannerDayDrop}
        renderRecipeCard={renderRecipeCard}
      />

      <EventDialogs
        allLists={props.allLists}
        currentUserId={props.currentUserId}
        availableFriends={props.availableFriends}
        availableGroups={props.availableGroups}
        eventDialogOpen={state.eventDialogOpen}
        eventForm={state.eventForm}
        eventInlineListForm={state.eventInlineListForm}
        eventViewerOpen={state.eventViewerOpen}
        pendingRemoval={state.pendingRemoval}
        selectedDate={state.selectedDate}
        selectedDayEvents={data.selectedDayEvents}
        selectedEvent={state.selectedEvent}
        selectedEventForm={state.selectedEventForm}
        onCloseSelectedEvent={() => state.setSelectedEvent(null)}
        onConfirmRemoval={actions.confirmRemoval}
        onCreateEvent={actions.handleCreateEvent}
        onCreateInlineListForEvent={actions.handleCreateInlineListForEvent}
        onDeleteEvent={props.onDeleteEvent}
        onShareEventWithFriend={actions.handleShareSelectedEventWithFriend}
        onShareEventWithGroup={actions.handleShareSelectedEventWithGroup}
        onRemoveEventCollaborator={actions.handleRemoveSelectedEventCollaborator}
        onEventDialogOpenChange={state.setEventDialogOpen}
        onEventFormChange={(updater) => state.setEventForm(updater)}
        onEventInlineListFormChange={(updater) => state.setEventInlineListForm(updater)}
        onEventViewerOpenChange={state.setEventViewerOpen}
        onOpenEventDetail={actions.openEventDetail}
        onOpenList={props.onOpenList}
        onPendingRemovalChange={state.setPendingRemoval}
        onSelectedEventFormChange={(updater) => state.setSelectedEventForm(updater)}
        onToggleEventList={actions.toggleEventList}
        onToggleSelectedEventList={actions.toggleSelectedEventList}
        onUpdateSelectedEvent={actions.handleUpdateSelectedEvent}
      />
    </div>
  )
}

export const ListsTab = memo(ListsTabComponent)
