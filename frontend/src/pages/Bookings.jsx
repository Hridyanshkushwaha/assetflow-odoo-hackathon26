import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import BookingCalendar from '../components/BookingCalendar';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, Input, Select, Label } from '../components/ui';

export default function Bookings() {
  const [bookableAssets, setBookableAssets] = useState([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookForm, setShowBookForm] = useState(false);
  const [form, setForm] = useState({ startTime: '', endTime: '' });
  const [error, setError] = useState('');

  const loadResources = async () => {
    setLoading(true);
    try {
      const a = await api.get('/assets/bookable');
      setBookableAssets(a.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadResources(); }, []);

  useEffect(() => {
    if (selectedResource) {
      api.get(`/bookings/calendar/${selectedResource}`).then((res) => setCalendar(res.data));
    } else {
      setCalendar([]);
    }
  }, [selectedResource]);

  const dayBookings = calendar.filter((b) => {
    const d = new Date(b.startTime);
    return d.toISOString().slice(0, 10) === selectedDate;
  });

  const pendingSlot = form.startTime && form.endTime
    ? { startTime: form.startTime, endTime: form.endTime }
    : null;

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/bookings', { resourceId: selectedResource, startTime: form.startTime, endTime: form.endTime });
      setForm({ startTime: '', endTime: '' });
      setShowBookForm(false);
      api.get(`/bookings/calendar/${selectedResource}`).then((res) => setCalendar(res.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed — slot may be unavailable');
    }
  };

  const selectedAsset = bookableAssets.find((a) => a._id === selectedResource);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Resource Booking" subtitle="View availability and book shared resources" />

      <Card className="mb-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Resource</Label>
            <Select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
            >
              <option value="">Select bookable resource</option>
              {bookableAssets.map((a) => (
                <option key={a._id} value={a._id}>{a.name} — {a.assetTag}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </div>
      </Card>

      {selectedResource ? (
        <>
          <BookingCalendar
            bookings={dayBookings}
            pendingSlot={pendingSlot}
            date={new Date(selectedDate)}
          />

          <div className="mt-6">
            {!showBookForm ? (
              <Button onClick={() => setShowBookForm(true)}>Book a slot</Button>
            ) : (
              <Card>
                {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <p className="mb-4 text-sm text-slate-600">
                  Booking {selectedAsset?.name} for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <form onSubmit={handleBook} className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Start</Label>
                    <Input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-2 md:col-span-2">
                    <Button type="submit">Confirm Booking</Button>
                    <Button type="button" variant="secondary" onClick={() => { setShowBookForm(false); setForm({ startTime: '', endTime: '' }); }}>Cancel</Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        </>
      ) : (
        <Card className="flex min-h-[20rem] items-center justify-center text-sm text-slate-500">
          Select a resource to view its calendar
        </Card>
      )}
    </div>
  );
}
