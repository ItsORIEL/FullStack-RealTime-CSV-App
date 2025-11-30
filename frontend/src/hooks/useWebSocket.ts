import { useEffect, useRef } from 'react';

export const useWebSocket = (onMessage: (data: string) => void) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);

  useEffect(() => {
    const connect = () => {
      if (ws.current) {
        ws.current.close();
      }

      const socketUrl = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000/ws";
      const socket = new WebSocket(socketUrl);
      ws.current = socket;

      socket.onopen = () => {
        console.log("✅ WebSocket Connected");
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
        reconnectTimeout.current = setTimeout(() => {
            connect();
        }, 3000);
      };

      socket.onerror = (err) => {
        console.error("❌ WebSocket Error:", err);
        socket.close();
      };
    };

    connect();

    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, []);
};