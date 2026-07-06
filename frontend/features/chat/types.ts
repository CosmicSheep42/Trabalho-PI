"use client"

export interface ChatToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ExecutedChatToolCall extends ChatToolCall {
  success: boolean
  message: string
  data: Record<string, unknown>
  error?: string | null
}

export interface ChatRecipeCardData {
  id: number
  name: string
  description: string
  image: string
  prep_time_minutes: number
  servings: number | null
  average_rating: number | null
  ratings_count: number
  is_favorite: boolean
  is_saved: boolean
  vegan: boolean
  vegetarian: boolean
  lactose_free: boolean
  egg_free: boolean
  gluten_free: boolean
  nut_free: boolean
  shellfish_free: boolean
  soy_free: boolean
  sesame_free: boolean
  sulfite_free: boolean
  tags: Array<{ id: number; name: string; slug: string; category: string }>
  holidays: Array<{ id: number; name: string; slug: string }>
}

export interface BackendChatResponse {
  result: string
  tool_calls: ChatToolCall[]
  executed_tool_calls: ExecutedChatToolCall[]
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  toolCalls?: ChatToolCall[]
  executedToolCalls?: ExecutedChatToolCall[]
}
