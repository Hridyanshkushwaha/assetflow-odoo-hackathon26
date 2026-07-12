import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { canRegisterAssets } from '../utils/roles';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Assets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', category: '', serialNumber: '', location: '', condition: 'Good', isBookable: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([
        api.get('/assets', { params: search ? { search } : {} }),
        api.get('/categories'),
      ]);
      setAssets(a.data);
      setCategories(c.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    await api.post('/assets', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setShowForm(false);
    setForm({ name: '', category: '', serialNumber: '', location: '', condition: 'Good', isBookable: false });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Asset Directory</h1>
          <p className="text-slate-500">Register and track all organizational assets</p>
        </div>
        {canRegisterAssets(user?.role) && (
          <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white">
            {showForm ? 'Cancel' : 'Register Asset'}
          </button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-6 flex gap-2">
        <input placeholder="Search by tag, serial, or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 rounded-lg border px-3 py-2" />
        <button type="submit" className="rounded-lg border px-4 py-2 text-sm">Search</button>
      </form>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Register New Asset</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input placeholder="Asset name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2" required />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border px-3 py-2" required>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input placeholder="Serial number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="rounded-lg border px-3 py-2" />
            <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="rounded-lg border px-3 py-2" />
            <input placeholder="Condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="rounded-lg border px-3 py-2" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isBookable} onChange={(e) => setForm({ ...form, isBookable: e.target.checked })} />
              <span className="text-sm">Shared / Bookable resource</span>
            </label>
          </div>
          <button type="submit" className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">Register</button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-slate-500">
              <th className="p-4">Tag</th>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Location</th>
              <th className="p-4">Status</th>
              <th className="p-4">Bookable</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a._id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-mono font-medium">{a.assetTag}</td>
                <td className="p-4">{a.name}</td>
                <td className="p-4">{a.category?.name}</td>
                <td className="p-4">{a.location || '—'}</td>
                <td className="p-4"><StatusBadge status={a.status} /></td>
                <td className="p-4">{a.isBookable ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
