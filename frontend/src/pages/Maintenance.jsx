import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { canApproveMaintenance } from '../utils/roles';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Maintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ assetId: '', issueDescription: '', priority: 'Medium' });

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
    setForm({ assetId: '', issueDescription: '', priority: 'Medium' });
    load();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/maintenance/${id}/status`, {
      status,
      technicianName: status === 'TechnicianAssigned' ? 'Tech Team' : undefined,
    });
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
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <textarea
            placeholder="Describe the issue..."
            value={form.issueDescription}
            onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
            className="col-span-full rounded-lg border px-3 py-2"
            rows={3}
            required
          />
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">Submit Request</button>
      </form>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Maintenance Requests</h2>
        <ul className="space-y-4">
          {requests.map((r) => (
            <li key={r._id} className="rounded-lg border border-slate-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{r.asset?.assetTag} — {r.asset?.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{r.issueDescription}</p>
                  <p className="mt-1 text-xs text-slate-400">Raised by {r.raisedBy?.name} · Priority: {r.priority}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {canApproveMaintenance(user?.role) && r.status === 'Pending' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => updateStatus(r._id, 'Approved')} className="rounded bg-green-600 px-3 py-1 text-xs text-white">Approve</button>
                  <button onClick={() => updateStatus(r._id, 'Rejected')} className="rounded bg-red-600 px-3 py-1 text-xs text-white">Reject</button>
                </div>
              )}
              {canApproveMaintenance(user?.role) && r.status === 'Approved' && (
                <button onClick={() => updateStatus(r._id, 'InProgress')} className="mt-3 rounded bg-orange-600 px-3 py-1 text-xs text-white">Start Work</button>
              )}
              {canApproveMaintenance(user?.role) && r.status === 'InProgress' && (
                <button onClick={() => updateStatus(r._id, 'Resolved')} className="mt-3 rounded bg-primary-600 px-3 py-1 text-xs text-white">Mark Resolved</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
