"use client"

import { useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CalendarEvent } from "@/features/events/types"
import type { FriendGroup, FriendUser } from "@/features/friends/types"

interface EventShareDialogProps {
  currentUserId: number | null
  event: CalendarEvent | null
  open: boolean
  availableFriends: FriendUser[]
  availableGroups: FriendGroup[]
  onOpenChange: (open: boolean) => void
  onShareWithFriend: (friendUserId: number) => Promise<void>
  onShareWithGroup: (groupId: number) => Promise<void>
  onRemoveCollaborator: (memberUserId: string) => Promise<void>
}

export function EventShareDialog({
  currentUserId,
  event,
  open,
  availableFriends,
  availableGroups,
  onOpenChange,
  onShareWithFriend,
  onShareWithGroup,
  onRemoveCollaborator,
}: EventShareDialogProps) {
  const [selectedFriendId, setSelectedFriendId] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [shareError, setShareError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  const shareableFriends = useMemo(() => {
    if (!event) {
      return []
    }
    const memberIds = new Set([event.owner.id, ...event.collaborators.map((member) => member.id)])
    return availableFriends.filter((friend) => !memberIds.has(String(friend.id)))
  }, [availableFriends, event])
  const shareableGroups = useMemo(
    () => availableGroups.filter((group) => group.members.length > 0),
    [availableGroups]
  )

  if (!event) {
    return null
  }

  const isEventOwner = event.owner.id === String(currentUserId)

  async function handleShareFriend() {
    if (!selectedFriendId) {
      setShareError("Select a friend to invite.")
      return
    }

    setIsSharing(true)
    try {
      setShareError(null)
      await onShareWithFriend(Number(selectedFriendId))
      setSelectedFriendId("")
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Unable to share the event.")
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
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Unable to share the event.")
    } finally {
      setIsSharing(false)
    }
  }

  async function handleRemoveCollaborator(memberUserId: string) {
    setIsSharing(true)
    try {
      setShareError(null)
      await onRemoveCollaborator(memberUserId)
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Unable to remove collaborator.")
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
          setSelectedFriendId("")
          setSelectedGroupId("")
          setShareError(null)
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share event</DialogTitle>
          <DialogDescription>
            Invite one of your friends to collaborate on this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-sm font-medium">People with access</p>
            <div className="mt-3 space-y-2">
              {[event.owner, ...event.collaborators].map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
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
                  {isEventOwner && member.id !== event.owner.id ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/40 bg-destructive/8 text-destructive hover:border-destructive/60 hover:bg-destructive/14 active:bg-destructive/20"
                      onClick={() => void handleRemoveCollaborator(member.id)}
                      disabled={isSharing}
                    >
                      Remove
                    </Button>
                  ) : null}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void (selectedGroupId ? handleShareGroup() : handleShareFriend())}
            disabled={isSharing || (shareableFriends.length === 0 && shareableGroups.length === 0)}
          >
            {isSharing ? "Inviting..." : "Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
