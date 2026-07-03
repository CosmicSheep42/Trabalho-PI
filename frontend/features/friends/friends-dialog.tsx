"use client"

import { useEffect, useState } from "react"
import { Pencil, Search, Trash2, Users, UserRoundPlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FriendGroup, FriendSearchResult, FriendshipRequestSummary, FriendUser } from "@/features/friends/types"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

interface FriendsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  friends: FriendUser[]
  groups: FriendGroup[]
  incomingRequests: FriendshipRequestSummary[]
  outgoingRequests: FriendshipRequestSummary[]
  searchResults: FriendSearchResult[]
  isLoading?: boolean
  isSearching?: boolean
  isSaving?: boolean
  onSearch: (query: string) => Promise<unknown> | void
  onSendRequest: (username: string) => Promise<unknown> | void
  onAcceptRequest: (requestId: number) => Promise<unknown> | void
  onDeclineRequest: (requestId: number) => Promise<unknown> | void
  onCancelRequest: (requestId: number) => Promise<unknown> | void
  onRemoveFriend: (friendUserId: number) => Promise<unknown> | void
  onCreateGroup: (name: string, friendUserIds: number[]) => Promise<unknown> | void
  onUpdateGroup: (groupId: number, name: string, friendUserIds: number[]) => Promise<unknown> | void
  onDeleteGroup: (groupId: number) => Promise<unknown> | void
}

export function FriendsDialog({
  open,
  onOpenChange,
  friends,
  groups,
  incomingRequests,
  outgoingRequests,
  searchResults,
  isLoading = false,
  isSearching = false,
  isSaving = false,
  onSearch,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveFriend,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
}: FriendsDialogProps) {
  const [query, setQuery] = useState("")
  const [searchError, setSearchError] = useState<string | null>(null)
  const [requestsTab, setRequestsTab] = useState<"received" | "sent">("received")
  const [groupName, setGroupName] = useState("")
  const [selectedGroupFriendIds, setSelectedGroupFriendIds] = useState<number[]>([])
  const [groupError, setGroupError] = useState<string | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [isGroupComposerOpen, setIsGroupComposerOpen] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 300)
  const isEditingGroup = editingGroupId !== null
  const isGroupComposerVisible = isGroupComposerOpen || isEditingGroup

  useEffect(() => {
    let isCancelled = false

    async function runSearch() {
      try {
        setSearchError(null)
        await onSearch(debouncedQuery)
      } catch (error) {
        if (!isCancelled) {
          setSearchError(error instanceof Error ? error.message : "Unable to search users.")
        }
      }
    }

    void runSearch()

    return () => {
      isCancelled = true
    }
  }, [debouncedQuery, onSearch])

  async function handleSendRequest(username: string) {
    try {
      setSearchError(null)
      await onSendRequest(username)
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Unable to send request.")
    }
  }

  function toggleGroupFriend(friendUserId: number) {
    setSelectedGroupFriendIds((current) =>
      current.includes(friendUserId)
        ? current.filter((id) => id !== friendUserId)
        : [...current, friendUserId]
    )
  }

  function startEditingGroup(group: FriendGroup) {
    setEditingGroupId(group.id)
    setGroupName(group.name)
    setSelectedGroupFriendIds(group.members.map((member) => member.id))
    setGroupError(null)
    setIsGroupComposerOpen(true)
  }

  function startCreatingGroup() {
    setEditingGroupId(null)
    setGroupName("")
    setSelectedGroupFriendIds([])
    setGroupError(null)
    setIsGroupComposerOpen(true)
  }

  function resetGroupForm() {
    setEditingGroupId(null)
    setGroupName("")
    setSelectedGroupFriendIds([])
    setGroupError(null)
    setIsGroupComposerOpen(false)
  }

  async function handleSaveGroup() {
    try {
      setGroupError(null)
      if (!groupName.trim()) {
        setGroupError("Group name is required.")
        return
      }

      if (editingGroupId !== null) {
        await onUpdateGroup(editingGroupId, groupName.trim(), selectedGroupFriendIds)
      } else {
        await onCreateGroup(groupName.trim(), selectedGroupFriendIds)
      }
      resetGroupForm()
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : "Unable to save group.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Friends</DialogTitle>
          <DialogDescription>
            Manage connections, groups, and requests in one place.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-5rem)]">
          <div className="space-y-6 px-6 pb-6">
            <div className="space-y-3 rounded-xl border p-4">
              <Label htmlFor="friend-search">Find by username</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="friend-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search username"
                  className="pl-9 pr-24"
                />
                {isSearching ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Searching...
                  </span>
                ) : null}
              </div>
              {searchError ? <p className="text-sm text-destructive">{searchError}</p> : null}
              {searchResults.length > 0 ? (
                <ScrollArea className="h-56 rounded-xl border">
                  <div className="space-y-2 p-3">
                    {searchResults.map((result) => (
                      <div key={result.user.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={result.user.avatar ?? undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {result.user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">@{result.user.username}</p>
                          </div>
                        </div>
                        {result.relation_status === "none" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleSendRequest(result.user.username)}
                            disabled={isSaving}
                          >
                            Add friend
                          </Button>
                        ) : (
                          <span className="text-right text-xs text-muted-foreground">
                            {result.relation_status === "friends"
                              ? "Already connected"
                              : result.relation_status === "incoming_request"
                                ? "Sent you a request"
                                : "Request sent"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : null}
            </div>

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Connections</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your current friend list lives here.
                  </p>
                </div>
              </div>
              <ScrollArea className="h-56 rounded-xl border p-3">
                <div className="space-y-2">
                  {friends.length > 0 ? friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={friend.avatar ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {friend.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="truncate text-sm font-medium">@{friend.username}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => void onRemoveFriend(friend.id)} disabled={isSaving}>
                        Remove
                      </Button>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">
                      {isLoading ? "Loading connections..." : "No connections yet."}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </section>

            <section className="space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <UserRoundPlus className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Groups</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create reusable circles from your connections.
                  </p>
                </div>
                <Button
                  variant={isGroupComposerVisible ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (!isGroupComposerVisible) {
                      startCreatingGroup()
                    }
                  }}
                  disabled={isSaving || isGroupComposerVisible}
                >
                  New group
                </Button>
              </div>

              {isGroupComposerVisible ? (
                <div className="space-y-3 rounded-xl bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">
                        {isEditingGroup ? "Edit group" : "Create group"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Choose a name and the friends that belong in this group.
                      </p>
                    </div>
                    {isEditingGroup ? (
                      <Button variant="ghost" size="sm" onClick={resetGroupForm} disabled={isSaving}>
                        Cancel edit
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group-name">{isEditingGroup ? "Group name" : "New group name"}</Label>
                    <Input
                      id="group-name"
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      placeholder="e.g. Family"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Members</p>
                      <span className="text-xs text-muted-foreground">
                        {selectedGroupFriendIds.length} selected
                      </span>
                    </div>
                    <ScrollArea className="h-40 rounded-lg border bg-background p-2">
                      <div className="space-y-2">
                        {friends.length > 0 ? friends.map((friend) => {
                          const selected = selectedGroupFriendIds.includes(friend.id)
                          return (
                            <button
                              key={friend.id}
                              type="button"
                              onClick={() => toggleGroupFriend(friend.id)}
                              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${selected ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/20"}`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={friend.avatar ?? undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {friend.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-sm font-medium">@{friend.username}</span>
                            </button>
                          )
                        }) : (
                          <p className="text-sm text-muted-foreground">Add friends first to build groups.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {groupError ? <p className="text-sm text-destructive">{groupError}</p> : null}

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => void handleSaveGroup()} disabled={isSaving}>
                      {isEditingGroup ? "Save group" : "Create group"}
                    </Button>
                    <Button variant="outline" onClick={resetGroupForm} disabled={isSaving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}

              <Separator />

              <div className="space-y-3">
  
                <ScrollArea className="h-52 pr-2">
                  <div className="space-y-3">
                    {groups.length > 0 ? groups.map((group) => (
                      <div key={group.id} className="rounded-xl border bg-background px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{group.name}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => startEditingGroup(group)} disabled={isSaving}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => void onDeleteGroup(group.id)} disabled={isSaving}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {group.members.map((member) => (
                            <div key={member.id} className="flex max-w-full items-center gap-2 rounded-full bg-muted/30 px-2 py-1">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.avatar ?? undefined} />
                                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                  {member.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-xs font-medium">@{member.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-xl border border-dashed px-4 py-6 text-center">
                        <p className="text-sm font-medium">No groups created yet.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Start with a group for family, roommates, or close friends.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </section>

            <section className="space-y-3 rounded-xl border p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Requests</h3>
                </div>
              </div>

              <Tabs value={requestsTab} onValueChange={(value) => setRequestsTab(value as "received" | "sent")} className="gap-3">
                <TabsList className="h-auto gap-2 bg-transparent p-0">
                  <TabsTrigger value="received" className="gap-2 border data-[state=active]:border-transparent">Received</TabsTrigger>
                  <TabsTrigger value="sent" className="gap-2 border data-[state=active]:border-transparent">Sent</TabsTrigger>
                </TabsList>

                <TabsContent value="received" className="mt-0">
                  <ScrollArea className="h-56 pr-2">
                    <div className="space-y-3">
                      {incomingRequests.length > 0 ? incomingRequests.map((request) => (
                        <div key={request.id} className="rounded-xl border bg-background px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={request.user.avatar ?? undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {request.user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">@{request.user.username}</p>
                                <p className="text-xs text-muted-foreground">
                                  Wants to connect with you.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => void onAcceptRequest(request.id)} disabled={isSaving}>
                              Accept
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => void onDeclineRequest(request.id)} disabled={isSaving}>
                              Decline
                            </Button>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-xl border border-dashed px-4 py-6 text-center">
                          <p className="text-sm font-medium">No incoming requests.</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            New connection requests will appear here.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="sent" className="mt-0">
                  <ScrollArea className="h-56 pr-2">
                    <div className="space-y-3">
                      {outgoingRequests.length > 0 ? outgoingRequests.map((request) => (
                        <div key={request.id} className="rounded-xl border bg-background px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={request.user.avatar ?? undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {request.user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">@{request.user.username}</p>
                                <p className="text-xs text-muted-foreground">
                                  Waiting for a response.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Button variant="outline" size="sm" onClick={() => void onCancelRequest(request.id)} disabled={isSaving}>
                              Cancel request
                            </Button>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-xl border border-dashed px-4 py-6 text-center">
                          <p className="text-sm font-medium">No outgoing requests.</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Requests you send will stay here until they are accepted or canceled.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
