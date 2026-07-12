import { useEffect, useState } from 'react';
import api from '../services/api';
import Card, { CardHeader } from '../components/Card';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui';

function BarChart({ data, labelKey = '_id', color = 'bg-amber-500' }) {
  const max = Math.max(...(data || []).map((d) => d.count), 1);
  if (!data?.length) return <p className="text-sm text-slate-500">No data available</p>;

  return (
    <div className="flex h-48 items-end gap-2">
      {data.map((d) => (
        <div key={d[labelKey]} className="flex flex-1 flex-col items-center gap-2">
          <div className={`w-full rounded-t-lg ${color}`} style={{ height: `${(d.count / max) * 100}%`, minHeight: '4px' }} title={`${d.count}`} />
          <span className="max-w-full truncate text-[10px] text-slate-500">{d[labelKey]}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data }) {
  if (!data?.length) return <p className="text-sm text-slate-500">No data available</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100;
    const y = 100 - (d.count / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="h-48 w-full" preserveAspectRatio="none">
      <polyline fill="none" stroke="#ef4444" strokeWidth="2" points={points} />
    </svg>
  );
}

export default function Reports() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/utilization'),
      api.get('/reports/maintenance-frequency'),
      api.get('/reports/booking-heatmap'),
      api.get('/reports/maintenance-alerts'),
    ]).then(([u, m, h, alerts]) => setData({ u: u.data, m: m.data, h: h.data, alerts: alerts.data }))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assetflow-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Operational insights for managers" />

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Utilization by Department" />
          <BarChart data={data.u?.utilizationByDepartment} color="bg-amber-600/80" />
        </Card>
        <Card>
          <CardHeader title="Maintenance Frequency" />
          <LineChart data={data.m?.maintenanceTrend} />
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Most Used Assets" subtitle="Last 30 days" />
          <ul className="space-y-3 text-sm">
            {(data.h?.mostUsedAssets || []).length === 0 ? (
              <li className="text-slate-500">No booking data yet</li>
            ) : data.h.mostUsedAssets.map((a) => (
              <li key={a._id} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2">
                <span>{a._id}{a.assetTag ? ` ${a.assetTag}` : ''}</span>
                <span className="text-slate-500">{a.count} bookings</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Idle Assets" subtitle="Unused 45+ days" />
          <ul className="space-y-3 text-sm">
            {(data.u?.idleAssets || []).length === 0 ? (
              <li className="text-slate-500">No idle assets flagged</li>
            ) : data.u.idleAssets.map((a) => (
              <li key={a._id} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2">
                <span>{a.name} {a.assetTag}</span>
                <span className="text-slate-500">unused 45+ days</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader title="Assets Due for Maintenance / Nearing Retirement" />
        <ul className="space-y-3 text-sm">
          {(data.alerts?.pendingMaintenance || []).slice(0, 3).map((m) => (
            <li key={m._id} className="rounded-lg bg-slate-50 px-4 py-2">
              {m.asset?.name} {m.asset?.assetTag}: service pending ({m.status})
            </li>
          ))}
          {(data.alerts?.agingAssets || []).slice(0, 3).map((a) => (
            <li key={a._id} className="rounded-lg bg-slate-50 px-4 py-2">
              {a.name} {a.assetTag}: 4+ years old — nearing retirement
            </li>
          ))}
          {!data.alerts?.pendingMaintenance?.length && !data.alerts?.agingAssets?.length && (
            <li className="text-slate-500">No alerts at this time</li>
          )}
        </ul>
      </Card>

      <Button variant="secondary" onClick={handleExport}>Export Report</Button>
    </div>
  );
}
