import { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function BarChart({ data, labelKey = '_id', valueKey = 'count' }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d[labelKey] || 'unknown'} className="flex items-center gap-3">
          <span className="w-28 truncate text-sm capitalize">{d[labelKey] || 'Unknown'}</span>
          <div className="flex-1 rounded-full bg-slate-100">
            <div
              className="rounded-full bg-primary-500 py-1 text-center text-xs text-white"
              style={{ width: `${(d[valueKey] / max) * 100}%`, minWidth: d[valueKey] ? '2rem' : 0 }}
            >
              {d[valueKey]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Reports & Analytics</h1>
      <p className="mb-6 text-slate-500">Operational insights for managers</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Assets by Status</h2>
          <BarChart data={data?.assetsByStatus || []} />
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Assets by Category</h2>
          <BarChart data={data?.assetsByCategory || []} />
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Allocations by Department</h2>
          <BarChart data={data?.allocationsByDepartment || []} />
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Maintenance by Category</h2>
          <BarChart data={data?.maintenanceByCategory || []} />
        </div>
        <div className="rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Booking Heatmap (by hour)</h2>
          <BarChart data={data?.bookingHeatmap || []} labelKey="_id" />
        </div>
        <div className="rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Idle Assets (90+ days available)</h2>
          {data?.idleAssets?.length === 0 ? (
            <p className="text-sm text-slate-500">No idle assets detected</p>
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              {data?.idleAssets?.map((a) => (
                <li key={a._id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <span className="font-mono">{a.assetTag}</span> — {a.name}
                  <span className="ml-2 text-slate-400">({a.category?.name})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
