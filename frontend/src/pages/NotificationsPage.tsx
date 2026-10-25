import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useMonitoring } from '../context/MonitoringContext';
import { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const { refreshKey, triggerRefresh } = useMonitoring();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getNotifications(unreadOnly).then(res => {
      if (isMounted) {
        setNotifications(res);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [unreadOnly, refreshKey]);

  const handleMarkRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    triggerRefresh();
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    triggerRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Notification History</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Outage alerts, recovery confirmations, and system observability notifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              unreadOnly
                ? 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {unreadOnly ? 'Showing Unread Only' : 'Show Unread Only'}
          </button>

          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-subtle overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No notifications recorded
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                n.is_read ? 'bg-white' : 'bg-emerald-50/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${
                  n.notification_type === 'service_down'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-[#DCFCE7] text-[#166534]'
                }`}>
                  {n.notification_type === 'service_down' ? (
                    <AlertOctagon className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{n.title}</span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <span className="mt-1 text-[10px] text-slate-400 block font-mono">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-[#16A34A] hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
