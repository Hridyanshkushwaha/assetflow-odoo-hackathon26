import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { canApproveMaintenance } from '../utils/roles';
import Card, { CardHeader } from '../components/Card';
import PageHeader from '../components/PageHeader';
import TabPills from '../components/TabPills';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui';
import { relativeTime } from '../utils/format';

const NOTIF_FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'bookings', label: 'Bookings' },
];

const PAGE_TABS = [
  { id: 'notifications', label: 'Notifications' },
  { id: 'logs', label: 'Activity Logs' },
];

function getNotificationColor(type) {
  if (type?.includes('overdue') || type?.includes('audit') || type?.includes('discrepancy')) return 'bg-orange-500';
  if (type?.includes('maintenance') && type?.includes('approved')) return 'bg-emerald-500';
  if (type?.includes('transfer')) return 'bg-red-500';
  if (type?.includes('booking')) return 'bg-blue-500';
  if (type?.includes('assign')) return 'bg-blue-500';
  return 'bg-slate-400';
}

function matchesFilter(type, filter) {
  if (filter === 'all') return true;
  if (filter === 'alerts') return type?.includes('overdue') || type?.includes('audit') || type?.includes('discrepancy');
  if (filter === 'approvals') return type?.includes('approved') || type?.includes('transfer');
  if (filter === 'bookings') return type?.includes('booking');
  return true;
}

export default function Notifications() {
  const { user } = useAuth();
  const [pageTab, setPageTab] = useState('notifications');
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const showLogs = canApproveMaintenance(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const n = await api.get('/notifications');
      setNotifications(n.data);
      if (showLogs) {
        const l = await api.get('/notifications/activity-logs');
        setLogs(l.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;

  const filtered = notifications.filter((n) => matchesFilter(n.type, filter));
  const unread = notifications.filter((n) => !n.isRead).length;
  const pageTabs = showLogs ? PAGE_TABS : PAGE_TABS.filter((t) => t.id === 'notifications');

  return (
    <div>
      <PageHeader
        title="Activity Logs & Notifications"
        subtitle={pageTab === 'notifications' ? `${unread} unread` : `${logs.length} audit entries`}
        action={pageTab === 'notifications' && unread > 0 && (
          <Button variant="secondary" onClick={() => api.put('/notifications/read-all').then(load)}>Mark all read</Button>
        )}
      />

      {showLogs && (
        <TabPills tabs={pageTabs} active={pageTab} onChange={setPageTab} />
      )}

      {pageTab === 'notifications' && (
        <>
          <TabPills tabs={NOTIF_FILTER_TABS} active={filter} onChange={setFilter} />
          <Card padding={false}>
            {filtered.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No notifications in this category</p>
            ) : filtered.map((n) => (
              <div key={n._id} className={`flex items-start gap-4 border-b border-slate-100 px-5 py-4 last:border-0 ${!n.isRead ? 'bg-primary-50/30' : ''}`}>
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm ${getNotificationColor(n.type)}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">{n.message}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{relativeTime(n.createdAt)}</span>
              </div>
            ))}
          </Card>
        </>
      )}

      {pageTab === 'logs' && showLogs && (
        <Card>
          <CardHeader title="Audit Trail" subtitle="Who did what, when" />
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">No activity logged yet</p>
          ) : (
            <div className="space-y-3">
              {logs.map((l) => (
                <div key={l._id} className="rounded-xl bg-slate-50 p-4 text-sm">
                  <p>
                    <span className="font-medium">{l.user?.name}</span>
                    <span className="text-slate-400"> ({l.user?.role?.replace(/([A-Z])/g, ' $1').trim()})</span>
                  </p>
                  <p className="text-slate-600">{l.action?.replace(/_/g, ' ')} · {l.entityType}</p>
                  <p className="text-xs text-slate-400">{new Date(l.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
