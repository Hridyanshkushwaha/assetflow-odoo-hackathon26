import { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [bookableAssets, setBookableAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ assetId: '', startTime: '', endTime: '', notes: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [b, a] = await Promise.all([api.get('/bookings'), api.get('/assets/bookable')]);
      setBookings(b.data);
      setBookableAssets(a.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selectedAsset) {
      api.get(`/bookings/calendar/${selectedAsset}`).then((res) => setCalendar(res.data));
    }
  }, [selectedAsset]);

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/bookings', { ...form, assetId: form.assetId || selectedAsset });
      setForm({ assetId: '', startTime: '', endTime: '', notes: '' });
      load();
      if (selectedAsset) {
        api.get(`/bookings/calendar/${selectedAsset}`).then((res) => setCalendar(res.data));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleCancel = async (id) => {
    await api.put(`/bookings/${id}`, { status: 'cancelled' });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Resource Booking</h1>
      <p className="mb-6 text-slate-500">Book shared resources with overlap validation</p>

      <form onSubmit={handleBook} className="mb-6 rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">New Booking</h2>
        {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={form.assetId || selectedAsset}
            onChange={(e) => { setForm({ ...form, assetId: e.target.value }); setSelectedAsset(e.target.value); }}
            className="rounded-lg border px-3 py-2"
            required
          >
            <option value="">Select bookable resource</option>
            {bookableAssets.map((a) => <option key={a._id} value={a._id}>{a.name} ({a.assetTag})</option>)}
          </select>
          <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="rounded-lg border px-3 py-2" required />
          <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="rounded-lg border px-3 py-2" required />
          <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-lg border px-3 py-2" />
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">Book Resource</button>
      </form>

      {selectedAsset && calendar.length > 0 && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Resource Calendar</h2>
          <ul className="space-y-2">
            {calendar.map((b) => (
              <li key={b._id} className="rounded-lg bg-slate-50 p-3 text-sm">
                {new Date(b.startTime).toLocaleString()} — {new Date(b.endTime).toLocaleString()}
                <span className="ml-2 text-slate-500">by {b.user?.name}</span>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">My Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-500">No bookings yet</p>
        ) : (
          <ul className="space-y-3">
            {bookings.map((b) => (
              <li key={b._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="font-medium">{b.asset?.name} ({b.asset?.assetTag})</p>
                  <p className="text-sm text-slate-500">
                    {new Date(b.startTime).toLocaleString()} — {new Date(b.endTime).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.status} />
                  {b.status === 'upcoming' && (
                    <button onClick={() => handleCancel(b._id)} className="text-xs text-red-600 hover:underline">Cancel</button>
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
