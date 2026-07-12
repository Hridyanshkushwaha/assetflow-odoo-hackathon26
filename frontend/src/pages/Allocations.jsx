import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { canAllocate } from '../utils/roles';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Allocations() {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ assetId: '', allocatedTo: '', expectedReturnDate: '' });
  const [conflict, setConflict] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [a, t, assetsRes] = await Promise.all([
        api.get('/allocations'),
        api.get('/allocations/transfers/all'),
        api.get('/assets', { params: { status: 'Available' } }),
      ]);
      setAllocations(a.data);
      setTransfers(t.data);
      setAssets(assetsRes.data);
      if (canAllocate(user?.role)) {
        const e = await api.get('/employees');
        setEmployees(e.data.filter((emp) => emp.status === 'Active'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAllocate = async (e) => {
    e.preventDefault();
    setConflict(null);
    try {
      await api.post('/allocations', { ...form, allocatedToType: 'User' });
      setForm({ assetId: '', allocatedTo: '', expectedReturnDate: '' });
      load();
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'ALLOCATION_CONFLICT') {
        setConflict({
          message: data.message,
          holder: data.currentHolder,
          allocationId: data.allocationId,
          toHolder: form.allocatedTo,
        });
      }
    }
  };

  const handleTransferRequest = async () => {
    if (!conflict?.allocationId || !conflict?.toHolder) return;
    await api.post('/allocations/transfer', {
      allocationId: conflict.allocationId,
      toHolder: conflict.toHolder,
    });
    setConflict(null);
    setForm({ assetId: '', allocatedTo: '', expectedReturnDate: '' });
    load();
  };

  const handleReturn = async (id) => {
    await api.put(`/allocations/${id}/return`, { conditionCheckInNotes: 'Returned in good condition' });
    load();
  };

  const handleTransferAction = async (id, action) => {
    await api.put(`/allocations/transfers/${id}`, { action });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Asset Allocation & Transfer</h1>
      <p className="mb-6 text-slate-500">Manage who holds what across the organization</p>

      {canAllocate(user?.role) && (
        <form onSubmit={handleAllocate} className="mb-6 rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Allocate Asset</h2>
          {conflict && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">{conflict.message}</p>
              <button
                type="button"
                onClick={handleTransferRequest}
                className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
              >
                Request Transfer Instead
              </button>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <select value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} className="rounded-lg border px-3 py-2" required>
              <option value="">Select asset</option>
              {assets.map((a) => <option key={a._id} value={a._id}>{a.assetTag} — {a.name}</option>)}
            </select>
            <select value={form.allocatedTo} onChange={(e) => setForm({ ...form, allocatedTo: e.target.value })} className="rounded-lg border px-3 py-2" required>
              <option value="">Assign to employee</option>
              {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
            <input type="date" value={form.expectedReturnDate} onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })} className="rounded-lg border px-3 py-2" />
          </div>
          <button type="submit" className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">Allocate</button>
        </form>
      )}

      <div className="mb-8 rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Active Allocations</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-slate-500">
              <th className="pb-3 pr-4">Asset</th>
              <th className="pb-3 pr-4">Holder</th>
              <th className="pb-3 pr-4">Expected Return</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allocations.filter((a) => a.status !== 'Returned').map((a) => (
              <tr key={a._id} className="border-b border-slate-100">
                <td className="py-3 pr-4 font-mono">{a.asset?.assetTag}</td>
                <td className="py-3 pr-4">{a.holder?.name || '—'}</td>
                <td className="py-3 pr-4">{a.expectedReturnDate ? new Date(a.expectedReturnDate).toLocaleDateString() : '—'}</td>
                <td className="py-3 pr-4"><StatusBadge status={a.status} /></td>
                <td className="py-3">
                  {canAllocate(user?.role) && (
                    <button onClick={() => handleReturn(a._id)} className="text-xs text-primary-600 hover:underline">Mark Returned</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Transfer Requests</h2>
        <ul className="space-y-3">
          {transfers.map((t) => (
            <li key={t._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div>
                <p className="font-medium">{t.asset?.assetTag}: {t.fromHolder?.name} → {t.toHolder?.name}</p>
                <p className="text-sm text-slate-500">Requested by {t.requestedBy?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
                {t.status === 'Requested' && canAllocate(user?.role) && (
                  <>
                    <button onClick={() => handleTransferAction(t._id, 'approve')} className="rounded bg-green-600 px-2 py-1 text-xs text-white">Approve</button>
                    <button onClick={() => handleTransferAction(t._id, 'reject')} className="rounded bg-red-600 px-2 py-1 text-xs text-white">Reject</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
