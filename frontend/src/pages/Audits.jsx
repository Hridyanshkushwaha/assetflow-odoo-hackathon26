import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ROLES, canApproveMaintenance } from '../utils/roles';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Audits() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', scopeDepartment: '', scopeLocation: '', startDate: '', endDate: '', auditors: [],
  });

  const load = async () => {
    setLoading(true);
    try {
      const c = await api.get('/audits');
      setCycles(c.data);
      if (user?.role === ROLES.ADMIN) {
        const d = await api.get('/departments');
        setDepartments(d.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadCycle = async (id) => {
    const res = await api.get(`/audits/${id}`);
    setSelected(res.data);
  };

  const createCycle = async (e) => {
    e.preventDefault();
    await api.post('/audits', form);
    setForm({ name: '', scopeDepartment: '', scopeLocation: '', startDate: '', endDate: '', auditors: [] });
    load();
  };

  const verifyItem = async (cycleId, itemId, result) => {
    await api.put(`/audits/${cycleId}/items/${itemId}`, { result });
    loadCycle(cycleId);
  };

  const closeCycle = async (id) => {
    await api.put(`/audits/${id}/close`);
    setSelected(null);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Asset Audit</h1>
      <p className="mb-6 text-slate-500">Run structured verification cycles</p>

      {user?.role === ROLES.ADMIN && (
        <form onSubmit={createCycle} className="mb-6 rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Create Audit Cycle</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input placeholder="Cycle name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2" required />
            <select value={form.scopeDepartment} onChange={(e) => setForm({ ...form, scopeDepartment: e.target.value })} className="rounded-lg border px-3 py-2">
              <option value="">All departments</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <input placeholder="Scope location (optional)" value={form.scopeLocation} onChange={(e) => setForm({ ...form, scopeLocation: e.target.value })} className="rounded-lg border px-3 py-2" />
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-lg border px-3 py-2" required />
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="rounded-lg border px-3 py-2" required />
          </div>
          <button type="submit" className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">Create Cycle</button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Audit Cycles</h2>
          <ul className="space-y-2">
            {cycles.map((c) => (
              <li key={c._id} onClick={() => loadCycle(c._id)} className="cursor-pointer rounded-lg bg-slate-50 p-3 hover:bg-primary-50">
                <div className="flex justify-between">
                  <span className="font-medium">{c.name}</span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-slate-500">{c.itemCount || 0} assets in scope</p>
              </li>
            ))}
          </ul>
        </div>

        {selected && (
          <div className="rounded-xl border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{selected.name}</h2>
              {selected.status === 'Open' && canApproveMaintenance(user?.role) && (
                <button onClick={() => closeCycle(selected._id)} className="rounded bg-red-600 px-3 py-1 text-xs text-white">Close Cycle</button>
              )}
            </div>
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {selected.items?.map((item) => (
                <li key={item._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="font-mono">{item.asset?.assetTag}</p>
                    <p className="text-slate-500">{item.asset?.name}</p>
                  </div>
                  {selected.status === 'Open' ? (
                    <div className="flex gap-1">
                      {['Verified', 'Missing', 'Damaged'].map((r) => (
                        <button key={r} onClick={() => verifyItem(selected._id, item._id, r)} className={`rounded px-2 py-1 text-xs ${item.result === r ? 'bg-primary-600 text-white' : 'border bg-white'}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <StatusBadge status={item.result} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
