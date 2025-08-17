import { useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Authenticate with the server
      const token = localStorage.getItem("token");
      if (token) {
        ws.send(JSON.stringify({ type: "authenticate", token }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const joinStream = (streamId: string) => {
    sendMessage({ type: "join_stream", streamId });
  };

  const leaveStream = () => {
    sendMessage({ type: "leave_stream" });
  };

  const sendChatMessage = (content: string) => {
    sendMessage({ type: "chat_message", content });
  };

  const sendWebRTCSignal = (signal: any, targetUserId: string) => {
    sendMessage({ type: "webrtc_signal", signal, targetUserId });
  };

  return {
    isConnected,
    messages,
    sendMessage,
    joinStream,
    leaveStream,
    sendChatMessage,
    sendWebRTCSignal,
  };
}
