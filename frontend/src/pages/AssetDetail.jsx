import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Card, { CardHeader } from '../components/Card';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui';

export default function AssetDetail() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/assets/${id}`), api.get(`/assets/${id}/history`)])
      .then(([a, h]) => {
        setAsset(a.data);
        setHistory(h.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!asset) return <p className="text-slate-500">Asset not found</p>;

  return (
    <div>
      <PageHeader
        title={asset.name}
        subtitle={`${asset.assetTag} · ${asset.category?.name || 'Uncategorized'}`}
        action={
          <Link to="/assets">
            <Button variant="secondary">← Back to Directory</Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Asset Details" />
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ['Asset Tag', asset.assetTag],
              ['Serial Number', asset.serialNumber || '—'],
              ['Location', asset.location || '—'],
              ['Condition', asset.condition || '—'],
              ['Bookable', asset.isBookable ? 'Yes' : 'No'],
              ['Acquisition Cost', asset.acquisitionCost ? `$${asset.acquisitionCost}` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <StatusBadge status={asset.status} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Quick Info" />
          <p className="text-sm text-slate-600">
            Registered asset in the organization inventory. View allocation and maintenance history below.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Allocation History" subtitle={`${history?.allocations?.length || 0} records`} />
          <div className="space-y-3">
            {history?.allocations?.length === 0 && (
              <p className="text-sm text-slate-500">No allocation history</p>
            )}
            {history?.allocations?.map((a) => (
              <div key={a._id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <StatusBadge status={a.status} />
                  <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  By {a.allocatedBy?.name}
                  {a.expectedReturnDate && ` · Due ${new Date(a.expectedReturnDate).toLocaleDateString()}`}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Maintenance History" subtitle={`${history?.maintenance?.length || 0} records`} />
          <div className="space-y-3">
            {history?.maintenance?.length === 0 && (
              <p className="text-sm text-slate-500">No maintenance history</p>
            )}
            {history?.maintenance?.map((m) => (
              <div key={m._id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <StatusBadge status={m.status} />
                  <span className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{m.issueDescription}</p>
                <p className="mt-1 text-xs text-slate-400">Raised by {m.raisedBy?.name}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
