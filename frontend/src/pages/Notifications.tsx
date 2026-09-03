import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { Notification } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Notifications: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    if (!user) { setLoading(false); return; }
    api.getNotifications()
      .then((res) => {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {}
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Campus Notifications</h2>
        <p className="text-xs text-gray-500">Log in to view alerts.</p>
        <button onClick={openAuthModal} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
          Campus Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campus Alerts</h1>
            <p className="text-xs text-gray-500">Messages, reservations, match alerts & claim updates</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" /> Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">No notifications found.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
              className={`p-4 transition flex items-start justify-between gap-4 ${
                n.isRead ? 'bg-white' : 'bg-blue-50/50 font-medium'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-gray-900">{n.title}</span>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <p className="text-xs text-gray-600">{n.message}</p>
                <span className="text-[10px] text-gray-400 block">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>

              {n.linkUrl && (
                <Link
                  to={n.linkUrl}
                  className="p-2 text-blue-600 hover:bg-blue-100/50 rounded-lg transition shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
