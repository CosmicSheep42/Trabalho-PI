"use client"

export interface ChatToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface BackendChatResponse {
  result: string
  route: string
  reason: string
  matched_category: string | null
  matched_intent: string | null
  score: number | null
  tool_calls: ChatToolCall[]
  tool_calling_used: boolean
  tool_calling_available: boolean
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  route?: string
  toolCalls?: ChatToolCall[]
}
