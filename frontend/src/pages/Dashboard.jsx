import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function KpiCard({ label, value, color = 'primary' }) {
  const colors = {
    primary: 'border-primary-200 bg-primary-50 text-primary-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value ?? 0}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const { kpis, upcomingReturns, overdueReturns } = data || {};

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Real-time operational snapshot</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Assets Available" value={kpis?.assetsAvailable} color="green" />
        <KpiCard label="Assets Allocated" value={kpis?.assetsAllocated} />
        <KpiCard label="Maintenance Today" value={kpis?.maintenanceToday} color="orange" />
        <KpiCard label="Active Bookings" value={kpis?.activeBookings} />
        <KpiCard label="Pending Transfers" value={kpis?.pendingTransfers} color="orange" />
        <KpiCard label="Upcoming Returns" value={kpis?.upcomingReturnsCount} />
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <Link to="/assets" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          Register Asset
        </Link>
        <Link to="/bookings" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Book Resource
        </Link>
        <Link to="/maintenance" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Raise Maintenance Request
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-red-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-700">Overdue Returns</h2>
          {overdueReturns?.length === 0 ? (
            <p className="text-sm text-slate-500">No overdue returns</p>
          ) : (
            <ul className="space-y-3">
              {overdueReturns?.map((a) => (
                <li key={a._id} className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                  <div>
                    <p className="font-medium">{a.asset?.assetTag} — {a.asset?.name}</p>
                    <p className="text-sm text-slate-500">Held by {a.holder?.name}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Upcoming Returns</h2>
          {upcomingReturns?.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming returns</p>
          ) : (
            <ul className="space-y-3">
              {upcomingReturns?.map((a) => (
                <li key={a._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="font-medium">{a.asset?.assetTag} — {a.asset?.name}</p>
                    <p className="text-sm text-slate-500">
                      {a.holder?.name} · Due {new Date(a.expectedReturnDate).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
