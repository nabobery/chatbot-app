// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useToast } from '@/hooks/use-toast'

interface Message {
  type: string
  thread_id: number
  message_id: number
  content: string
  is_bot: boolean
  timestamp: string
}

interface UseWebSocketReturn {
  isConnected: boolean
  sendMessage: (threadId: number, content: string) => void
  getMessages: (threadId: number) => Message[]
  clearMessages: (threadId: number) => void
}

export function useWebSocket(): UseWebSocketReturn {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Record<number, Message[]>>({})
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!token || ws.current?.readyState === WebSocket.OPEN) return

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/${token}`
    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      setIsConnected(true)
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
        reconnectTimeout.current = null
      }
    }

    socket.onmessage = (event) => {
      const data: Message = JSON.parse(event.data)

      if (data.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong' }))
        return
      }

      if (data.type === 'error') {
        toast({
          title: 'Error',
          description: data.content || 'An error occurred.',
          variant: 'destructive',
        })
        return
      }

      if (data.type === 'message') {
        setMessages((prev) => ({
          ...prev,
          [data.thread_id]: [...(prev[data.thread_id] || []), data],
        }))
      }
    }

    socket.onclose = () => {
      setIsConnected(false)
      if (!reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          connect()
        }, 1000)
      }
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      socket.close()
    }

    ws.current = socket
  }, [token, toast])

  useEffect(() => {
    connect()

    return () => {
      ws.current?.close()
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
    }
  }, [connect])

  const sendMessage = useCallback(
    (threadId: number, content: string) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        toast({
          title: 'Connection Error',
          description: 'Not connected to the chat server. Trying to reconnect...',
          variant: 'destructive',
        })
        connect()
        return
      }

      const messageData: Partial<Message> = {
        type: 'message',
        thread_id: threadId,
        content,
        is_bot: false,
        timestamp: new Date().toISOString(),
      }

      try {
        ws.current.send(JSON.stringify(messageData))

        // Optimistically add message to state
        setMessages((prev) => ({
          ...prev,
          [threadId]: [
            ...(prev[threadId] || []),
            {
              ...messageData,
              message_id: Date.now(), // Temporary ID
            } as Message,
          ],
        }))
      } catch (error) {
        console.error('Failed to send message:', error)
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive',
        })
      }
    },
    [connect, toast]
  )

  const getMessages = useCallback(
    (threadId: number) => {
      return messages[threadId] || []
    },
    [messages]
  )

  const clearMessages = useCallback((threadId: number) => {
    setMessages((prev) => {
      const newMessages = { ...prev }
      delete newMessages[threadId]
      return newMessages
    })
  }, [])

  return {
    isConnected,
    sendMessage,
    getMessages,
    clearMessages,
  }
}