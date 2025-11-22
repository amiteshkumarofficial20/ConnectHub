import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './auth';
import { queryClient } from './queryClient';

interface WebSocketContextType {
  sendMessage: (data: any) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host || "localhost:5000";
        if (!host || host.includes("undefined")) {
          console.error("Invalid host for WebSocket:", host);
          return;
        }
        const wsUrl = `${protocol}//${host}/ws`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          isConnectedRef.current = true;
          const token = localStorage.getItem('token');
          ws.send(JSON.stringify({
            type: 'authenticate',
            userId: user.id,
            token,
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'new_message') {
              queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
              queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
              queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
              const message = data.message;
              if (message.receiverId || message.senderId) {
                const otherUserId = message.receiverId === user.id ? message.senderId : message.receiverId;
                if (otherUserId) {
                  queryClient.invalidateQueries({ queryKey: ['/api/messages', otherUserId] });
                }
              }
            } else if (data.type === 'user_online' || data.type === 'user_offline') {
              queryClient.invalidateQueries({ queryKey: ['/api/users/online'] });
            }
          } catch (error) {
            console.error('WebSocket message error:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          isConnectedRef.current = false;
          wsRef.current = null;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user]);

  const sendMessage = (data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage, isConnected: isConnectedRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
