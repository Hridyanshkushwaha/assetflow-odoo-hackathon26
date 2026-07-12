import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card, { CardHeader } from '../components/Card';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui';

function KpiCard({ label, value }) {
  return (
    <Card className="text-center">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value ?? 0}</p>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/kpis')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const { kpis, overdueReturns, upcomingReturns, recentActivity } = data || {};
  const overdueCount = overdueReturns?.length || 0;

  return (
    <div>
      <PageHeader title="Today's Overview" subtitle="Real-time operational snapshot" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Assets Available" value={kpis?.assetsAvailable} />
        <KpiCard label="Assets Allocated" value={kpis?.assetsAllocated} />
        <KpiCard label="Maintenance Today" value={kpis?.maintenanceToday} />
        <KpiCard label="Active Bookings" value={kpis?.activeBookings} />
        <KpiCard label="Pending Transfers" value={kpis?.pendingTransfers} />
        <KpiCard label="Upcoming Returns" value={kpis?.upcomingReturnsCount} />
      </div>

      {overdueCount > 0 && (
        <div className="mb-6">
          <AlertBanner variant="danger">
            {overdueCount} asset{overdueCount > 1 ? 's' : ''} overdue for return — flagged for follow-up
          </AlertBanner>
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        <Link to="/assets"><Button>Register Asset</Button></Link>
        <Link to="/bookings"><Button variant="secondary">Book Resource</Button></Link>
        <Link to="/maintenance"><Button variant="secondary">Raise Maintenance Request</Button></Link>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Overdue Returns" subtitle="Past expected return date" />
          {overdueReturns?.length === 0 ? (
            <p className="text-sm text-slate-500">No overdue returns</p>
          ) : (
            <ul className="space-y-3">
              {overdueReturns.map((a) => (
                <li key={a._id} className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                  <p className="font-medium text-red-900">{a.asset?.assetTag} — {a.asset?.name}</p>
                  <p className="text-sm text-red-700">Held by {a.holder?.name}</p>
                  {a.expectedReturnDate && (
                    <p className="mt-1 text-xs text-red-600">Due {new Date(a.expectedReturnDate).toLocaleDateString()}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Upcoming Returns" subtitle="Due soon" />
          {upcomingReturns?.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming returns</p>
          ) : (
            <ul className="space-y-3">
              {upcomingReturns.map((a) => (
                <li key={a._id} className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium">{a.asset?.assetTag} — {a.asset?.name}</p>
                  <p className="text-sm text-slate-600">Held by {a.holder?.name}</p>
                  {a.expectedReturnDate && (
                    <p className="mt-1 text-xs text-slate-500">Due {new Date(a.expectedReturnDate).toLocaleDateString()}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent Activity" />
        {recentActivity?.length === 0 ? (
          <p className="text-sm text-slate-500">No recent activity yet</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentActivity.map((item, i) => (
              <li key={i} className="py-3 text-sm text-slate-700 first:pt-0 last:pb-0">{item.text}</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
