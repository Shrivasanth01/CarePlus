import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { HealthCheck, Incident } from '../types';

export type ConnectionStatus = 'Connected' | 'Reconnecting' | 'Disconnected';

interface MonitoringContextType {
  status: ConnectionStatus;
  recentLiveChecks: HealthCheck[];
  lastEvent: any;
  unreadCount: number;
  triggerRefresh: () => void;
  refreshKey: number;
}

const MonitoringContext = createContext<MonitoringContextType>({
  status: 'Disconnected',
  recentLiveChecks: [],
  lastEvent: null,
  unreadCount: 0,
  triggerRefresh: () => {},
  refreshKey: 0,
});

export const MonitoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatus>('Disconnected');
  const [recentLiveChecks, setRecentLiveChecks] = useState<HealthCheck[]>([]);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(1);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const connectWebSocket = useCallback(() => {
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (e) {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use window.location.host or default port 8001 if dev server on 5173
    const host = window.location.port === '5173' ? 'localhost:8001' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/monitoring`;

    try {
      setStatus('Reconnecting');
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('Connected');
        // Setup ping keepalive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);

          if (data.type === 'HEALTH_CHECK_COMPLETED') {
            const newCheck: HealthCheck = {
              id: Date.now() + Math.random(),
              service_id: data.service_id,
              service_name: data.service_name,
              check_type: 'HTTP',
              status: data.status,
              response_time_ms: data.response_time_ms,
              http_status_code: data.http_status_code,
              checked_at: data.checked_at
            };
            setRecentLiveChecks(prev => [newCheck, ...prev.slice(0, 19)]);
          }

          if (data.type === 'INCIDENT_CREATED' || data.type === 'SERVICE_STATUS_CHANGED') {
            setUnreadCount(prev => prev + 1);
            triggerRefresh();
          }

          if (data.type === 'INCIDENT_RESOLVED' || data.type === 'DEMO_RESET') {
            triggerRefresh();
          }
        } catch (err) {
          // Non-JSON message
        }
      };

      ws.onclose = () => {
        setStatus('Disconnected');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Attempt auto reconnection after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = () => {
        setStatus('Disconnected');
        ws.close();
      };
    } catch (e) {
      setStatus('Disconnected');
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    }
  }, [triggerRefresh]);

  useEffect(() => {
    connectWebSocket();

    // Fallback polling interval every 15s to keep all views fresh regardless
    const pollInterval = setInterval(() => {
      triggerRefresh();
    }, 15000);

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      clearInterval(pollInterval);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket, triggerRefresh]);

  return (
    <MonitoringContext.Provider
      value={{
        status,
        recentLiveChecks,
        lastEvent,
        unreadCount,
        triggerRefresh,
        refreshKey
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = () => useContext(MonitoringContext);
