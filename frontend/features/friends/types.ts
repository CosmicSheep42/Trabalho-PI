"use client"

export interface FriendUser {
  id: number
  username: string
  clerk_user_id: string
  avatar?: string | null
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
  groups: FriendGroup[]
}

export interface FriendSearchResult {
  user: FriendUser
  relation_status: "none" | "friends" | "incoming_request" | "outgoing_request"
}

export interface FriendGroup {
  id: number
  name: string
  members: FriendUser[]
}
