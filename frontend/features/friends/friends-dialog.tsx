"use client"

import { useEffect, useState } from "react"
import { Search, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FriendSearchResult, FriendshipRequestSummary, FriendUser } from "@/features/friends/types"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

interface FriendsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  friends: FriendUser[]
  incomingRequests: FriendshipRequestSummary[]
  outgoingRequests: FriendshipRequestSummary[]
  searchResults: FriendSearchResult[]
  isLoading?: boolean
  isSearching?: boolean
  isSaving?: boolean
  onSearch: (query: string) => Promise<void> | void
  onSendRequest: (username: string) => Promise<void> | void
  onAcceptRequest: (requestId: number) => Promise<void> | void
  onDeclineRequest: (requestId: number) => Promise<void> | void
  onCancelRequest: (requestId: number) => Promise<void> | void
  onRemoveFriend: (friendUserId: number) => Promise<void> | void
}

export function FriendsDialog({
  open,
  onOpenChange,
  friends,
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
}: FriendsDialogProps) {
  const [query, setQuery] = useState("")
  const [searchError, setSearchError] = useState<string | null>(null)
  const [requestsTab, setRequestsTab] = useState<"received" | "sent">("received")
  const debouncedQuery = useDebouncedValue(query, 300)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Friends</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
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
              <div className="space-y-2 rounded-xl border p-3">
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
                      <span className="text-xs text-muted-foreground">
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
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Your connections</h3>
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
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Requests</h3>
            <Tabs value={requestsTab} onValueChange={(value) => setRequestsTab(value as "received" | "sent")} className="gap-3">
              <TabsList className="bg-secondary">
                <TabsTrigger value="received">Received</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
              </TabsList>

              <TabsContent value="received" className="mt-0">
                <ScrollArea className="h-56 rounded-xl border p-3">
                  <div className="space-y-2">
                    {incomingRequests.length > 0 ? incomingRequests.map((request) => (
                      <div key={request.id} className="rounded-lg bg-muted/20 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={request.user.avatar ?? undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {request.user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">@{request.user.username}</p>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" onClick={() => void onAcceptRequest(request.id)} disabled={isSaving}>
                            Accept
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => void onDeclineRequest(request.id)} disabled={isSaving}>
                            Decline
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">No incoming requests.</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="sent" className="mt-0">
                <ScrollArea className="h-56 rounded-xl border p-3">
                  <div className="space-y-2">
                    {outgoingRequests.length > 0 ? outgoingRequests.map((request) => (
                      <div key={request.id} className="rounded-lg bg-muted/20 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={request.user.avatar ?? undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {request.user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">@{request.user.username}</p>
                        </div>
                        <div className="mt-2">
                          <Button variant="outline" size="sm" onClick={() => void onCancelRequest(request.id)} disabled={isSaving}>
                            Cancel request
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">No outgoing requests.</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
