"use client"

import { format } from "date-fns"
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
import { eventIconOptions, getEventIcon } from "@/features/home/components/lists-tab/constants"
import type { EventFormState } from "@/features/home/components/lists-tab/types"

interface EditEventDialogProps {
  allLists: ShopList[]
  selectedEvent: CalendarEvent | null
  selectedEventForm: EventFormState
  onCloseSelectedEvent: () => void
  onDeleteEvent: (eventId: string) => Promise<void>
  onEventViewerOpenChange: (open: boolean) => void
  onSelectedEventFormChange: (updater: (current: EventFormState) => EventFormState) => void
  onToggleSelectedEventList: (listId: string, checked: boolean) => void
  onUpdateSelectedEvent: () => Promise<void>
}

export function EditEventDialog({
  allLists,
  selectedEvent,
  selectedEventForm,
  onCloseSelectedEvent,
  onDeleteEvent,
  onEventViewerOpenChange,
  onSelectedEventFormChange,
  onToggleSelectedEventList,
  onUpdateSelectedEvent,
}: EditEventDialogProps) {
  return (
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
                onChange={(event) => onSelectedEventFormChange((current) => ({ ...current, name: event.target.value }))}
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
                  onValueChange={(value) => onSelectedEventFormChange((current) => ({ ...current, icon: value }))}
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
                  onChange={(event) => onSelectedEventFormChange((current) => ({ ...current, date: event.target.value }))}
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
  )
}
