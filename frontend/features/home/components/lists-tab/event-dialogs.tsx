"use client"

import { format } from "date-fns"
import { Trash2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ShopList } from "@/components/shoplist-banner"
import type { CalendarEvent } from "@/features/events/types"
import { eventIconOptions, getEventIcon, inlineListColorOptions } from "./constants"
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
      <Dialog open={eventDialogOpen} onOpenChange={onEventDialogOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Name</Label>
              <Input
                id="event-name"
                value={eventForm.name}
                onChange={(event) =>
                  onEventFormChange((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Birthday dinner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={eventForm.description}
                onChange={(event) =>
                  onEventFormChange((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Short notes about the event"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={eventForm.icon}
                  onValueChange={(value) => onEventFormChange((current) => ({ ...current, icon: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventIconOptions.map((option) => {
                      const Icon = option.icon

                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventForm.date}
                  onChange={(event) =>
                    onEventFormChange((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Associated Lists</Label>
                <span className="text-xs text-muted-foreground">Optional</span>
              </div>
              <ScrollArea className="max-h-48 rounded-xl border">
                <div className="space-y-2 p-3">
                  {allLists.length > 0 ? (
                    allLists.map((list) => (
                      <label
                        key={list.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 transition-colors hover:border-primary/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{list.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
                          </p>
                        </div>
                        <Checkbox
                          checked={eventForm.listIds.includes(list.id)}
                          onCheckedChange={(checked) => onToggleEventList(list.id, checked === true)}
                        />
                      </label>
                    ))
                  ) : (
                    <div className="px-1 py-2 text-sm text-muted-foreground">
                      Create a list before associating it with an event.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Create and attach a list</p>
                </div>
                <Badge variant="secondary">Quick add</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                <Input
                  value={eventInlineListForm.name}
                  onChange={(event) =>
                    onEventInlineListFormChange((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="List name"
                />
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-2">
                    {inlineListColorOptions.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() =>
                          onEventInlineListFormChange((current) => ({ ...current, color: color.name }))
                        }
                        className={`h-7 w-7 rounded-full transition-all ${color.className} ${
                          eventInlineListForm.color === color.name
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "hover:scale-110"
                        }`}
                        aria-label={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void onCreateInlineListForEvent()}
                disabled={!eventInlineListForm.name.trim()}
              >
                Create
              </Button>
            </div>

            <Button onClick={() => void onCreateEvent()} className="w-full" disabled={!eventForm.name.trim()}>
              Save Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={eventViewerOpen} onOpenChange={onEventViewerOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDate ? format(selectedDate, "EEEE, MMM d") : "Events"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((event) => {
                const EventIcon = getEventIcon(event.icon)

                return (
                  <div
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenEventDetail(event)}
                    onKeyDown={(keyboardEvent) => {
                      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                        keyboardEvent.preventDefault()
                        onOpenEventDetail(event)
                      }
                    }}
                    className="w-full rounded-xl border bg-muted/10 p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className="rounded-full bg-muted p-2 text-muted-foreground">
                          <EventIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          {event.description ? <p className="text-sm text-muted-foreground">{event.description}</p> : null}
                          <div className={`${event.description ? "mt-3" : ""} flex flex-wrap gap-2`}>
                            {event.listIds.length > 0 ? (
                              event.listIds
                                .map((listId) => allLists.find((list) => list.id === listId))
                                .filter((list): list is ShopList => list !== undefined)
                                .map((list) => (
                                  <button
                                    key={list.id}
                                    type="button"
                                    onClick={(clickEvent) => {
                                      clickEvent.stopPropagation()
                                      onOpenList(list)
                                    }}
                                    className="rounded-md bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                                  >
                                    {list.name}
                                  </button>
                                ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No lists attached</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation()
                          void onDeleteEvent(event.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                No events for this day.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && onCloseSelectedEvent()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>

          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border bg-muted/10 p-3">
                <div className="rounded-full bg-muted p-2 text-muted-foreground">
                  {(() => {
                    const EventIcon = getEventIcon(selectedEventForm.icon)
                    return <EventIcon className="h-5 w-5" />
                  })()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{selectedEventForm.name || "Untitled event"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedEventForm.date
                      ? format(new Date(selectedEventForm.date), "EEEE, MMM d, yyyy")
                      : "No date selected"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selected-event-name">Name</Label>
                <Input
                  id="selected-event-name"
                  value={selectedEventForm.name}
                  onChange={(event) =>
                    onSelectedEventFormChange((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selected-event-description">Description</Label>
                <Textarea
                  id="selected-event-description"
                  value={selectedEventForm.description}
                  onChange={(event) =>
                    onSelectedEventFormChange((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Short notes about the event"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select
                    value={selectedEventForm.icon}
                    onValueChange={(value) =>
                      onSelectedEventFormChange((current) => ({ ...current, icon: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventIconOptions.map((option) => {
                        const Icon = option.icon

                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selected-event-date">Date</Label>
                  <Input
                    id="selected-event-date"
                    type="date"
                    value={selectedEventForm.date}
                    onChange={(event) =>
                      onSelectedEventFormChange((current) => ({ ...current, date: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Linked Lists</Label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <ScrollArea className="max-h-48 rounded-xl border">
                  <div className="space-y-2 p-3">
                    {allLists.length > 0 ? (
                      allLists.map((list) => (
                        <label
                          key={list.id}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 transition-colors hover:border-primary/30"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{list.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
                            </p>
                          </div>
                          <Checkbox
                            checked={selectedEventForm.listIds.includes(list.id)}
                            onCheckedChange={(checked) => onToggleSelectedEventList(list.id, checked === true)}
                          />
                        </label>
                      ))
                    ) : (
                      <div className="px-1 py-2 text-sm text-muted-foreground">No lists available.</div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    void onDeleteEvent(selectedEvent.id)
                    onCloseSelectedEvent()
                    onEventViewerOpenChange(false)
                  }}
                >
                  Delete event
                </Button>
                <Button className="hover:bg-green-700" onClick={() => void onUpdateSelectedEvent()} disabled={!selectedEventForm.name.trim()}>
                  Save changes
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) {
            onPendingRemovalChange(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemoval
                ? `Removing "${pendingRemoval.recipeName}" will also remove it from linked lists. Please confirm to continue.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void onConfirmRemoval()
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
