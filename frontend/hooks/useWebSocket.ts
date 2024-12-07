import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Message {
  type: string;
  thread_id: number;
  message_id: number;
  content: string;
  is_bot: boolean;
  timestamp: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (threadId: number, content: string) => void;
  getMessages: (threadId: number) => Message[];
  clearMessages: (threadId: number) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async () => {
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      // Fetch the WebSocket token from the backend
      const { ws_token } = await api.getWebSocketToken();

      // Ensure NEXT_PUBLIC_WS_URL is defined
      if (!process.env.NEXT_PUBLIC_WS_URL) {
        throw new Error('NEXT_PUBLIC_WS_URL is not defined');
      }

      // Construct the WebSocket URL using the token
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/chat/ws/${ws_token}`;

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      socket.onmessage = (event) => {
        const data: Message = JSON.parse(event.data);

        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (data.type === 'error') {
          toast({
            title: 'Error',
            description: data.content || 'An error occurred.',
            variant: 'destructive',
          });
          return;
        }

        if (data.type === 'message') {
          setMessages((prev) => ({
            ...prev,
            [data.thread_id]: [...(prev[data.thread_id] || []), data],
          }));
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        if (!reconnectTimeout.current) {
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, 5000); // Reconnect after 5 seconds
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close();
      };

      ws.current = socket;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the server.',
        variant: 'destructive',
      });
      // Retry connection after some time
      if (!reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 5000); // Retry after 5 seconds
      }
    }
  }, [toast]);

  useEffect(() => {
    connect();

    return () => {
      ws.current?.close();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    (threadId: number, content: string) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        toast({
          title: 'Connection Error',
          description: 'Not connected to the server. Trying to reconnect...',
          variant: 'destructive',
        });
        connect();
        return;
      }

      const messageData = {
        type: 'message',
        thread_id: threadId,
        content,
        is_bot: false,
        timestamp: new Date().toISOString(),
        message_id: Date.now(),
      };

      try {
        ws.current.send(JSON.stringify(messageData));
      } catch (error) {
        console.error('Failed to send message:', error);
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive',
        });
      }

      // setMessages((prev) => ({
      //   ...prev,
      //   [threadId]: [...(prev[threadId] || []), messageData],
      // }));

      // Fetch latest messages from API after sending
      // try {
      //   const response = await api.getMessages(threadId);
      //     setMessages((prev) => ({
      //       ...prev,
      //       [threadId]: response.messages,
      //     }));
      //   } catch (error) {
      //     console.error('Failed to fetch messages after send:', error);
      //   }
    },
    [connect, toast]
  );

  const getMessages = useCallback(
    (threadId: number) => {
      return messages[threadId] || [];
    },
    [messages]
  );

  const clearMessages = useCallback((threadId: number) => {
    setMessages((prev) => ({
      ...prev,
      [threadId]: [],
    }));
  }, []);

  return {
    isConnected,
    sendMessage,
    getMessages,
    clearMessages,
  };
}