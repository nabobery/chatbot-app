const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface User {
  id: number
  email: string
  name: string
  image_url?: string
  auth_provider: string
}

interface ThreadResponse {
  id: number
  title: string
  created_at: string
}

async function fetchWithRefresh(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let res = await fetch(input, { ...init, credentials: 'include' })

  if (res.status === 401) {
    // Attempt to refresh the access token
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (refreshResponse.ok) {
      // Retry the original request
      res = await fetch(input, { ...init, credentials: 'include' })
    } else {
      // Refresh failed, throw an error to handle logout
      throw new Error('Authentication expired')
    }
  }

  return res
}

export const api = {
  async getCurrentUser(): Promise<User> {
    const res = await fetchWithRefresh(`${API_URL}/user/me`)
    if (!res.ok) throw new Error('Failed to fetch user')
    return res.json()
  },

  async createThread(title: string) {
    const res = await fetchWithRefresh(`${API_URL}/chat/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({"title": title}),
    })
    if (!res.ok) throw new Error('Failed to create thread')
    return res.json()
  },

  async getUserThreads(): Promise<ThreadResponse[]> {
    const res = await fetchWithRefresh(`${API_URL}/chat/threads`)
    if (!res.ok) throw new Error('Failed to fetch threads')
    return res.json()
  },

  async deleteAccount(): Promise<{ message: string }> {
    const res = await fetchWithRefresh(`${API_URL}/user/me`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete account')
    return res.json()
  },

  async getMessages(threadId: number) {
    const res = await fetchWithRefresh(`${API_URL}/chat/threads/${threadId}/messages`)
    if (!res.ok) throw new Error('Failed to fetch messages')
    return res.json()
  },

  async googleAuth(idToken: string): Promise<void> {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to authenticate')
  },

  async logout(): Promise<void> {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  },

  async getWebSocketToken(): Promise<{ ws_token: string }> {
    const res = await fetch(`${API_URL}/auth/ws-token`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to fetch WebSocket token')
    return res.json()
  },
}