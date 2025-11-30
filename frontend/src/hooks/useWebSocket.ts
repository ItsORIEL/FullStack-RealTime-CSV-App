// --- START OF FILE src/hooks/useWebSocket.ts ---
import { useEffect, useRef } from 'react';

export const useWebSocket = (onMessage: (data: string) => void) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);

  useEffect(() => {
    const connect = () => {
      // 1. Close existing connection if any
      if (ws.current) {
        ws.current.close();
      }

      // 2. Create new connection
      const socketUrl = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000/ws";
      const socket = new WebSocket(socketUrl);
      ws.current = socket;

      // 3. Setup Listeners
      socket.onopen = () => {
        console.log("✅ WebSocket Connected");
        // Clear any pending reconnection timers
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      socket.onmessage = (event) => {
        onMessage(event.data);
      };

      socket.onclose = () => {
        console.log("⚠️ WebSocket Disconnected. Retrying in 3s...");
        // 4. Try to reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(() => {
            connect();
        }, 3000);
      };

      socket.onerror = (err) => {
        console.error("❌ WebSocket Error:", err);
        socket.close(); // This will trigger onclose, which triggers reconnect
      };
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, []); // Run once on mount
};