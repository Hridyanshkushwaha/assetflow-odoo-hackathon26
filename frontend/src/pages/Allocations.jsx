import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  const [error, setError] = useState('');

  const canAllocate = ['admin', 'asset_manager', 'department_head'].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const [a, t, assetsRes] = await Promise.all([
        api.get('/allocations'),
        api.get('/allocations/transfers/all'),
        api.get('/assets', { params: { status: 'available' } }),
      ]);
      setAllocations(a.data);
      setTransfers(t.data);
      setAssets(assetsRes.data);
      if (['admin', 'asset_manager', 'department_head'].includes(user?.role)) {
        const e = await api.get('/employees');
        setEmployees(e.data.filter((emp) => emp.status === 'active'));
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
    setError('');
    try {
      await api.post('/allocations', form);
      setForm({ assetId: '', allocatedTo: '', expectedReturnDate: '' });
      load();
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 409) {
        setError(`Asset already held by ${data.currentHolder?.name}. Use Transfer Request instead.`);
      } else {
        setError(data?.message || 'Allocation failed');
      }
    }
  };

  const handleReturn = async (id) => {
    await api.put(`/allocations/${id}/return`, { returnNotes: 'Returned in good condition' });
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

      {canAllocate && (
        <form onSubmit={handleAllocate} className="mb-6 rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Allocate Asset</h2>
          {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
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
        <div className="overflow-x-auto">
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
              {allocations.filter((a) => a.status !== 'returned').map((a) => (
                <tr key={a._id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-mono">{a.asset?.assetTag}</td>
                  <td className="py-3 pr-4">{a.allocatedTo?.name || '—'}</td>
                  <td className="py-3 pr-4">{a.expectedReturnDate ? new Date(a.expectedReturnDate).toLocaleDateString() : '—'}</td>
                  <td className="py-3 pr-4"><StatusBadge status={a.status} /></td>
                  <td className="py-3">
                    {canAllocate && a.status !== 'returned' && (
                      <button onClick={() => handleReturn(a._id)} className="text-xs text-primary-600 hover:underline">
                        Mark Returned
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Transfer Requests</h2>
        {transfers.length === 0 ? (
          <p className="text-sm text-slate-500">No transfer requests</p>
        ) : (
          <ul className="space-y-3">
            {transfers.map((t) => (
              <li key={t._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="font-medium">{t.asset?.assetTag} → {t.toUser?.name || 'Department'}</p>
                  <p className="text-sm text-slate-500">Requested by {t.requestedBy?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  {t.status === 'requested' && canAllocate && (
                    <>
                      <button onClick={() => handleTransferAction(t._id, 'approve')} className="rounded bg-green-600 px-2 py-1 text-xs text-white">Approve</button>
                      <button onClick={() => handleTransferAction(t._id, 'reject')} className="rounded bg-red-600 px-2 py-1 text-xs text-white">Reject</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
