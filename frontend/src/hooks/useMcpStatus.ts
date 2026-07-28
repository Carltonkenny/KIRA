/**
 * Custom hook for WebSocket-based MCP server status tracking with polling fallback.
 */

import { useState, useEffect } from 'react';
import type { MCPServer } from '../types';

const API_BASE = 'http://localhost:8090';

export function useMcpStatus() {
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let isMounted = true;

    const startPolling = () => {
      if (pollInterval) return;
      const fetchStatus = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/v1/mcp/status`);
          if (res.ok && isMounted) {
            const data = await res.json();
            setMcpServers(data.servers);
          }
        } catch {
          // Silently retry on next tick
        }
      };
      fetchStatus();
      pollInterval = setInterval(fetchStatus, 4000);
    };

    const connectWebSocket = () => {
      try {
        socket = new WebSocket('ws://localhost:8090/api/v1/mcp/status/ws');

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data?.servers) {
              setMcpServers(data.servers);
            }
          } catch {
            // Ignore parse errors
          }
        };

        socket.onerror = () => startPolling();
        socket.onclose = () => { if (isMounted) startPolling(); };
      } catch {
        startPolling();
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (socket) socket.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  return mcpServers;
}
