import { useMemo } from 'react';

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9 AM – 6 PM

function hourToPercent(hour) {
  return ((hour - 9) / 10) * 100;
}

export default function BookingCalendar({ bookings, pendingSlot, date = new Date() }) {
  const dayLabel = date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  const blocks = useMemo(() => {
    return bookings.map((b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;
      const top = hourToPercent(startHour);
      const height = Math.max(hourToPercent(endHour) - top, 6);
      return { ...b, top, height, start, end, conflict: false };
    });
  }, [bookings]);

  const pendingBlock = useMemo(() => {
    if (!pendingSlot?.startTime || !pendingSlot?.endTime) return null;
    const start = new Date(pendingSlot.startTime);
    const end = new Date(pendingSlot.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = hourToPercent(startHour);
    const height = Math.max(hourToPercent(endHour) - top, 6);

    const hasConflict = blocks.some((b) => {
      return start < b.end && end > b.start;
    });

    return { top, height, start, end, conflict: hasConflict };
  }, [pendingSlot, blocks]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="mb-4 text-sm font-medium text-slate-700">{dayLabel}</p>
      <div className="relative h-[28rem] overflow-hidden rounded-xl bg-slate-50">
        {HOURS.map((h) => (
          <div key={h} className="absolute left-0 right-0 border-t border-slate-200/70" style={{ top: `${hourToPercent(h)}%` }}>
            <span className="absolute -top-2.5 left-3 text-xs text-slate-400">{h}:00</span>
          </div>
        ))}

        {blocks.map((b) => (
          <div
            key={b._id}
            className="absolute left-16 right-3 overflow-hidden rounded-lg border border-blue-400 bg-blue-500/90 px-3 py-2 text-xs text-white shadow-sm"
            style={{ top: `${b.top}%`, height: `${b.height}%`, minHeight: '2.5rem' }}
          >
            <p className="font-medium">Booked — {b.bookedBy?.name}</p>
            <p className="opacity-90">
              {b.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' to '}
              {b.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}

        {pendingBlock && (
          <div
            className={`absolute left-16 right-3 overflow-hidden rounded-lg border-2 border-dashed px-3 py-2 text-xs ${
              pendingBlock.conflict
                ? 'border-red-400 bg-red-50 text-red-800'
                : 'border-primary-400 bg-primary-50 text-primary-800'
            }`}
            style={{ top: `${pendingBlock.top}%`, height: `${pendingBlock.height}%`, minHeight: '2.5rem' }}
          >
            <p className="font-medium">
              {pendingBlock.conflict ? 'Conflict — slot unavailable' : 'Your requested slot'}
            </p>
            <p>
              {pendingBlock.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' to '}
              {pendingBlock.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {blocks.length === 0 && !pendingBlock && (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No bookings for this day</div>
        )}
      </div>
    </div>
  );
}
