"use client"

export interface FriendUser {
  id: number
  username: string
}

export interface FriendshipRequestSummary {
  id: number
  status: string
  created_at: string
  user: FriendUser
}

export interface FriendsOverview {
  friends: FriendUser[]
  incoming_requests: FriendshipRequestSummary[]
  outgoing_requests: FriendshipRequestSummary[]
}

export interface FriendSearchResult {
  user: FriendUser
  relation_status: "none" | "friends" | "incoming_request" | "outgoing_request"
}
