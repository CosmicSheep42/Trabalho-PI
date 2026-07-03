import { CreateEventDialog } from "@/features/home/components/event-dialogs/create-event-dialog"
import { DayEventsDialog } from "@/features/home/components/event-dialogs/day-events-dialog"
import { EditEventDialog } from "@/features/home/components/event-dialogs/edit-event-dialog"
import { RecipeRemovalAlert } from "@/features/home/components/event-dialogs/recipe-removal-alert"
import type { ShopList } from "@/components/shoplist-banner"
import type { CalendarEvent } from "@/features/events/types"
import type { EventFormState, EventInlineListFormState, PendingRemoval } from "./types"

interface EventDialogsProps {
  allLists: ShopList[]
  eventDialogOpen: boolean
  eventForm: EventFormState
  eventInlineListForm: EventInlineListFormState
  eventViewerOpen: boolean
  pendingRemoval: PendingRemoval | null
  selectedDate?: Date
  selectedDayEvents: CalendarEvent[]
  selectedEvent: CalendarEvent | null
  selectedEventForm: EventFormState
  onCloseSelectedEvent: () => void
  onConfirmRemoval: () => Promise<void>
  onCreateEvent: () => Promise<void>
  onCreateInlineListForEvent: () => Promise<void>
  onDeleteEvent: (eventId: string) => Promise<void>
  onEventDialogOpenChange: (open: boolean) => void
  onEventFormChange: (updater: (current: EventFormState) => EventFormState) => void
  onEventInlineListFormChange: (updater: (current: EventInlineListFormState) => EventInlineListFormState) => void
  onEventViewerOpenChange: (open: boolean) => void
  onOpenEventDetail: (event: CalendarEvent) => void
  onOpenList: (list: ShopList) => void
  onPendingRemovalChange: (value: PendingRemoval | null) => void
  onSelectedEventFormChange: (updater: (current: EventFormState) => EventFormState) => void
  onToggleEventList: (listId: string, checked: boolean) => void
  onToggleSelectedEventList: (listId: string, checked: boolean) => void
  onUpdateSelectedEvent: () => Promise<void>
}

export function EventDialogs({
  allLists,
  eventDialogOpen,
  eventForm,
  eventInlineListForm,
  eventViewerOpen,
  pendingRemoval,
  selectedDate,
  selectedDayEvents,
  selectedEvent,
  selectedEventForm,
  onCloseSelectedEvent,
  onConfirmRemoval,
  onCreateEvent,
  onCreateInlineListForEvent,
  onDeleteEvent,
  onEventDialogOpenChange,
  onEventFormChange,
  onEventInlineListFormChange,
  onEventViewerOpenChange,
  onOpenEventDetail,
  onOpenList,
  onPendingRemovalChange,
  onSelectedEventFormChange,
  onToggleEventList,
  onToggleSelectedEventList,
  onUpdateSelectedEvent,
}: EventDialogsProps) {
  return (
    <>
      <CreateEventDialog
        allLists={allLists}
        eventDialogOpen={eventDialogOpen}
        eventForm={eventForm}
        eventInlineListForm={eventInlineListForm}
        onCreateEvent={onCreateEvent}
        onCreateInlineListForEvent={onCreateInlineListForEvent}
        onEventDialogOpenChange={onEventDialogOpenChange}
        onEventFormChange={onEventFormChange}
        onEventInlineListFormChange={onEventInlineListFormChange}
        onToggleEventList={onToggleEventList}
      />

      <DayEventsDialog
        allLists={allLists}
        eventViewerOpen={eventViewerOpen}
        selectedDate={selectedDate}
        selectedDayEvents={selectedDayEvents}
        onDeleteEvent={onDeleteEvent}
        onEventViewerOpenChange={onEventViewerOpenChange}
        onOpenEventDetail={onOpenEventDetail}
        onOpenList={onOpenList}
      />

      <EditEventDialog
        allLists={allLists}
        selectedEvent={selectedEvent}
        selectedEventForm={selectedEventForm}
        onCloseSelectedEvent={onCloseSelectedEvent}
        onDeleteEvent={onDeleteEvent}
        onEventViewerOpenChange={onEventViewerOpenChange}
        onSelectedEventFormChange={onSelectedEventFormChange}
        onToggleSelectedEventList={onToggleSelectedEventList}
        onUpdateSelectedEvent={onUpdateSelectedEvent}
      />

      <RecipeRemovalAlert
        pendingRemoval={pendingRemoval}
        onConfirmRemoval={onConfirmRemoval}
        onPendingRemovalChange={onPendingRemovalChange}
      />
    </>
  )
}
