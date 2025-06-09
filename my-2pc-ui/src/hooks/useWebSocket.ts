import { useEffect, useState } from 'react';

const useWebSocket = (url: string) => {
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const wsRef = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!url) return;

    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      setReadyState(WebSocket.OPEN);
      console.log('WebSocket connected:', url);
    };

    wsRef.current.onmessage = (event) => {
      setLastMessage(event);
    };

    wsRef.current.onclose = () => {
      setReadyState(WebSocket.CLOSED);
      console.log('WebSocket disconnected:', url);
      // Optional: implement reconnect logic here
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setReadyState(WebSocket.CLOSED);
    };

    return () => {
      wsRef.current?.close();
    };
  }, [url]);

  return { lastMessage, readyState, sendMessage: wsRef.current?.send.bind(wsRef.current) };
};

export default useWebSocket;