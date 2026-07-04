"use client"

import { useAuth } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import type { BackendChatResponse, ChatMessage } from "@/features/chat/types"

const STORAGE_KEY = "cookwise-chat-session"

interface StoredChatSession {
  sessionId: string
  messages: ChatMessage[]
}

function buildMessage(role: ChatMessage["role"], content: string, extra?: Partial<ChatMessage>): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extra,
  }
}

export function useBackendChat() {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const [sessionId, setSessionId] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const raw = window.sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as StoredChatSession
          if (parsed.sessionId) {
            setSessionId(parsed.sessionId)
          }
          if (Array.isArray(parsed.messages)) {
            setMessages(parsed.messages)
          }
        } catch (storageError) {
          console.error("Failed to restore chat session", storageError)
        }
      }

      setSessionId((current) => current || crypto.randomUUID())
      setIsHydrated(true)
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated || !sessionId) {
      return
    }

    const payload: StoredChatSession = {
      sessionId,
      messages,
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [isHydrated, messages, sessionId])

  async function withToken<T>(callback: (token: string) => Promise<T>) {
    const token = await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }
    return callback(token)
  }

  async function sendMessage(query: string) {
    const trimmedQuery = query.trim()
    if (!trimmedQuery || isSending) {
      return
    }

    const nextUserMessage = buildMessage("user", trimmedQuery)
    setMessages((current) => [...current, nextUserMessage])
    setDraft("")
    setError(null)
    setIsSending(true)

    try {
      const response = await withToken(async (token) =>
        await apiRequest<BackendChatResponse>("/api/chat", {
          method: "POST",
          token,
          headers: {
            "x-session-id": sessionId,
          },
          body: JSON.stringify({ query: trimmedQuery }),
        })
      )

      setMessages((current) => [
        ...current,
        buildMessage("assistant", response.result, {
          route: response.route,
          toolCalls: response.tool_calls,
        }),
      ])
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to send message."
      setError(message)
      setMessages((current) => current.filter((messageItem) => messageItem.id !== nextUserMessage.id))
    } finally {
      setIsSending(false)
    }
  }

  async function clearConversation() {
    setMessages([])
    setDraft("")
    setError(null)

    if (!isAuthLoaded || !isSignedIn || !sessionId) {
      setSessionId(crypto.randomUUID())
      return
    }

    try {
      await withToken(async (token) =>
        await apiRequest<{ success: boolean }>("/api/chat/session", {
          method: "DELETE",
          token,
          headers: {
            "x-session-id": sessionId,
          },
        })
      )
    } catch (requestError) {
      console.error("Failed to clear chat session", requestError)
    } finally {
      setSessionId(crypto.randomUUID())
    }
  }

  return {
    draft,
    error,
    isHydrated,
    isSending,
    messages,
    clearConversation,
    sendMessage,
    setDraft,
  }
}
