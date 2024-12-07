'use client'

import { useState, useEffect, useRef } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { api } from '@/lib/api'
import { Loader2, Send } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { marked } from 'marked'

interface Message {
  id: number
  content: string
  is_bot: boolean
  timestamp: string
}

interface ChatThreadProps {
  threadId: number
}

export default function ChatThread({ threadId }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const { sendMessage, getMessages } = useWebSocket()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [initialFetchComplete, setInitialFetchComplete] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const renderMarkdown = (content: string) => {
    return { __html: marked(content) }
  }

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true)
        const data = await api.getThreadMessages(threadId);
        setMessages(data);
        setInitialFetchComplete(true)
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      } finally {
        setLoadingMessages(false)
      }
    }
    fetchMessages()
  }, [threadId])

  useEffect(() => {
    const wsMessages = getMessages(threadId);
    console.log(wsMessages);
    if (wsMessages.length > 0 && initialFetchComplete) {
      setMessages(prev => {
        const newMessages = [...prev]
        for (const wsMsg of wsMessages) {
          // Check if message already exists
          const existingIndex = newMessages.findIndex(m => m.id === wsMsg.message_id)
          if (existingIndex === -1) {
            newMessages.push({
              id: wsMsg.message_id,
              content: wsMsg.content,
              is_bot: wsMsg.is_bot,
              timestamp: wsMsg.timestamp
            })
          }
        }
        return newMessages
      })
    }
  }, [getMessages, threadId, initialFetchComplete])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (input.trim() === '') return;
    sendMessage(threadId, input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <ScrollArea className="flex-1 p-4 space-y-4">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.is_bot ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                key={message.id}
                className={`max-w-xl px-4 py-2 rounded-lg ${
                  message.is_bot
                    ? 'bg-gray-800 text-gray-200'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {message.is_bot ? (
                  <div 
                    dangerouslySetInnerHTML={renderMarkdown(message.content)}
                    className="prose prose-invert max-w-none"
                  />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </ScrollArea>

      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={input.trim() === ''}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}