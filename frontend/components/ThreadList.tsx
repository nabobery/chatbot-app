'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import Thread from '@/types/Thread'


interface ThreadListProps {
  selectedThread: Thread | null
  onSelectThread: (thread: Thread) => void
}

export default function ThreadList({
  selectedThread,
  onSelectThread,
}: ThreadListProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creatingThread, setCreatingThread] = useState(false)

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true)
        const data = await api.getUserThreads()
        setThreads(data)
      } catch (error) {
        console.error('Error loading threads:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchThreads()
  }, [])

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim()) return
    try {
      setCreatingThread(true)
      const thread = await api.createThread(newThreadTitle)
      setThreads([thread, ...threads])
      setNewThreadTitle('')
      setIsCreating(false)
      onSelectThread(thread)
    } catch (error) {
      console.error('Error creating thread:', error)
    } finally {
      setCreatingThread(false)
    }
  }

  return (
    <div className="flex flex-col w-64 h-full bg-gray-900 text-white border-r border-gray-700">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Chats</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCreating(!isCreating)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {isCreating && (
        <div className="p-4 border-b border-gray-700 space-y-2">
          <Input
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            placeholder="New chat title"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateThread()}
            disabled={creatingThread}
          />
          <Button
            className="w-full"
            onClick={handleCreateThread}
            disabled={creatingThread || !newThreadTitle.trim()}
          >
            {creatingThread ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              'Create Chat'
            )}
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : threads.length > 0 ? (
          <ScrollArea className="h-full">
            {threads.map((thread) => (
              <Button
                key={thread.id}
                variant={
                  selectedThread?.id === thread.id ? 'secondary' : 'ghost'
                }
                className={`w-full justify-start px-4 py-2 text-left ${
                  selectedThread?.id === thread.id
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={() => onSelectThread(thread)}
              >
                {thread.title}
              </Button>
            ))}
          </ScrollArea>
        ) : (
          <div className="p-4 text-center text-gray-400">
            No chats available. Create a new chat to get started.
          </div>
        )}
      </div>
    </div>
  )
}