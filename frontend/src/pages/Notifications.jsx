import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('notifications');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const n = await api.get('/notifications');
      setNotifications(n.data);
      if (['admin', 'asset_manager'].includes(user?.role)) {
        const l = await api.get('/notifications/activity-logs');
        setLogs(l.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    load();
  };

  if (loading) return <LoadingSpinner />;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications & Activity</h1>
          <p className="text-slate-500">{unread} unread notifications</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            Mark all read
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2 border-b">
        <button
          onClick={() => setTab('notifications')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'notifications' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500'}`}
        >
          Notifications
        </button>
        {['admin', 'asset_manager'].includes(user?.role) && (
          <button
            onClick={() => setTab('logs')}
            className={`px-4 py-2 text-sm font-medium ${tab === 'logs' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500'}`}
          >
            Activity Logs
          </button>
        )}
      </div>

      {tab === 'notifications' && (
        <div className="rounded-xl border bg-white">
          {notifications.length === 0 ? (
            <p className="p-8 text-center text-slate-500">No notifications</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n._id}
                  className={`flex items-start justify-between border-b border-slate-100 p-4 ${!n.read ? 'bg-primary-50' : ''}`}
                >
                  <div>
                    <p className="text-sm font-medium capitalize">{n.type?.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-slate-600">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.read && (
                    <button onClick={() => markRead(n._id)} className="text-xs text-primary-600 hover:underline">
                      Mark read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500">
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-b border-slate-100">
                  <td className="p-4">{l.user?.name} <span className="text-slate-400">({l.user?.role})</span></td>
                  <td className="p-4 capitalize">{l.action?.replace(/_/g, ' ')}</td>
                  <td className="p-4">{l.entity}</td>
                  <td className="p-4 text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
