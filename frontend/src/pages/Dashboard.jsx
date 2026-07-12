import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card, { CardHeader } from '../components/Card';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui';

const KPI_ACCENTS = ['from-teal-500', 'from-sky-500', 'from-amber-500', 'from-violet-500', 'from-rose-500', 'from-emerald-500'];

function KpiCard({ label, value, accentIndex = 0 }) {
  return (
    <div className="kpi-strip">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight text-ink">{value ?? 0}</p>
      <div className={`absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r ${KPI_ACCENTS[accentIndex % KPI_ACCENTS.length]} to-transparent opacity-70`} />
    </div>
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

  const kpiItems = [
    { label: 'Assets Available', value: kpis?.assetsAvailable },
    { label: 'Assets Allocated', value: kpis?.assetsAllocated },
    { label: 'Maintenance Today', value: kpis?.maintenanceToday },
    { label: 'Active Bookings', value: kpis?.activeBookings },
    { label: 'Pending Transfers', value: kpis?.pendingTransfers },
    { label: 'Upcoming Returns', value: kpis?.upcomingReturnsCount },
  ];

  return (
    <div>
      <PageHeader subtitle="Real-time operational snapshot — allocations, bookings, and returns at a glance" />

      <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiItems.map((k, i) => (
          <KpiCard key={k.label} {...k} accentIndex={i} />
        ))}
      </div>

      {overdueCount > 0 && (
        <div className="mb-7">
          <AlertBanner variant="danger">
            {overdueCount} asset{overdueCount > 1 ? 's' : ''} overdue for return — flagged for follow-up
          </AlertBanner>
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-2">
        <Link to="/assets"><Button>Register asset</Button></Link>
        <Link to="/bookings"><Button variant="secondary">Book resource</Button></Link>
        <Link to="/maintenance"><Button variant="secondary">Raise request</Button></Link>
      </div>

      <div className="mb-8 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Overdue returns" subtitle="Past expected return date" />
          {overdueReturns?.length === 0 ? (
            <p className="text-sm text-ink-faint">Nothing overdue</p>
          ) : (
            <ul className="space-y-2">
              {overdueReturns.map((a) => (
                <li key={a._id} className="rounded-lg border border-red-100 bg-red-50/50 px-4 py-3">
                  <p className="text-sm font-medium text-ink">{a.asset?.assetTag} · {a.asset?.name}</p>
                  <p className="text-xs text-ink-muted">Held by {a.holder?.name}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Upcoming returns" subtitle="Due soon" />
          {upcomingReturns?.length === 0 ? (
            <p className="text-sm text-ink-faint">No upcoming returns</p>
          ) : (
            <ul className="space-y-2">
              {upcomingReturns.map((a) => (
                <li key={a._id} className="rounded-lg bg-surface-sunken px-4 py-3">
                  <p className="text-sm font-medium text-ink">{a.asset?.assetTag} · {a.asset?.name}</p>
                  <p className="text-xs text-ink-muted">Held by {a.holder?.name}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent activity" />
        {recentActivity?.length === 0 ? (
          <p className="text-sm text-ink-faint">No recent activity</p>
        ) : (
          <ul className="divide-y divide-line">
            {recentActivity.map((item, i) => (
              <li key={i} className="py-3 text-sm text-ink-muted first:pt-0 last:pb-0">{item.text}</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
