import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Maintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ assetId: '', description: '', priority: 'medium' });

  const canApprove = ['admin', 'asset_manager'].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const [m, a] = await Promise.all([api.get('/maintenance'), api.get('/assets')]);
      setRequests(m.data);
      setAssets(a.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/maintenance', form);
    setForm({ assetId: '', description: '', priority: 'medium' });
    load();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/maintenance/${id}/status`, { status, technician: status === 'technician_assigned' ? 'Tech Team' : undefined });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Maintenance Management</h1>
      <p className="mb-6 text-slate-500">Route repairs through approval before work starts</p>

      <form onSubmit={handleCreate} className="mb-6 rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Raise Maintenance Request</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <select value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} className="rounded-lg border px-3 py-2" required>
            <option value="">Select asset</option>
            {assets.map((a) => <option key={a._id} value={a._id}>{a.assetTag} — {a.name}</option>)}
          </select>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="rounded-lg border px-3 py-2">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <textarea
            placeholder="Describe the issue..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="col-span-full rounded-lg border px-3 py-2"
            rows={3}
            required
          />
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">Submit Request</button>
      </form>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Maintenance Requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-slate-500">No maintenance requests</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((r) => (
              <li key={r._id} className="rounded-lg border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{r.asset?.assetTag} — {r.asset?.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Raised by {r.raisedBy?.name} · Priority: {r.priority}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {canApprove && r.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => updateStatus(r._id, 'approved')} className="rounded bg-green-600 px-3 py-1 text-xs text-white">Approve</button>
                    <button onClick={() => updateStatus(r._id, 'rejected')} className="rounded bg-red-600 px-3 py-1 text-xs text-white">Reject</button>
                  </div>
                )}
                {canApprove && r.status === 'approved' && (
                  <button onClick={() => updateStatus(r._id, 'in_progress')} className="mt-3 rounded bg-orange-600 px-3 py-1 text-xs text-white">Start Work</button>
                )}
                {canApprove && r.status === 'in_progress' && (
                  <button onClick={() => updateStatus(r._id, 'resolved')} className="mt-3 rounded bg-primary-600 px-3 py-1 text-xs text-white">Mark Resolved</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
