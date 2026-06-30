const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface ApiRequestOptions extends RequestInit {
  token?: string | null
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, ...init } = options
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    if (message) {
      try {
        const parsed = JSON.parse(message) as { detail?: string }
        if (parsed.detail) {
          throw new Error(parsed.detail)
        }
      } catch (error) {
        if (error instanceof Error && error.message !== message) {
          throw error
        }
      }
    }

    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}
