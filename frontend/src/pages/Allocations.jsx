import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { canAllocate } from '../utils/roles';
import Card, { CardHeader } from '../components/Card';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, Input, Select, Label } from '../components/ui';

export default function Allocations() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [activeAllocations, setActiveAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [activeAllocation, setActiveAllocation] = useState(null);
  const [history, setHistory] = useState([]);
  const [allocateForm, setAllocateForm] = useState({ allocatedTo: '', expectedReturnDate: '' });
  const [transferForm, setTransferForm] = useState({ toHolder: '', reason: '' });
  const [returnNotes, setReturnNotes] = useState('Good condition');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [assetsRes, transfersRes, allocsRes] = await Promise.all([
        api.get('/assets'),
        api.get('/transfers'),
        api.get('/allocations'),
      ]);
      setAssets(assetsRes.data);
      setTransfers(transfersRes.data);
      setActiveAllocations(allocsRes.data.filter((a) => ['Active', 'Overdue'].includes(a.status)));
      if (canAllocate(user?.role)) {
        const e = await api.get('/users');
        setEmployees(e.data.filter((emp) => emp.status === 'Active'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedAssetId) {
      setActiveAllocation(null);
      setHistory([]);
      return;
    }
    Promise.all([
      api.get('/allocations'),
      api.get(`/assets/${selectedAssetId}/history`),
    ]).then(([allocRes, histRes]) => {
      const active = allocRes.data.find(
        (a) => a.asset?._id === selectedAssetId && ['Active', 'Overdue'].includes(a.status)
      );
      setActiveAllocation(active || null);
      setHistory(histRes.data.allocations || []);
    });
  }, [selectedAssetId]);

  const selectedAsset = assets.find((a) => a._id === selectedAssetId);
  const isBlocked = activeAllocation && selectedAsset?.status === 'Allocated';

  const handleAllocate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/allocations', {
        assetId: selectedAssetId,
        allocatedTo: allocateForm.allocatedTo,
        allocatedToType: 'User',
        expectedReturnDate: allocateForm.expectedReturnDate || undefined,
      });
      setAllocateForm({ allocatedTo: '', expectedReturnDate: '' });
      load();
      setSelectedAssetId('');
    } catch (err) {
      console.error(err.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/transfers', {
        allocationId: activeAllocation._id,
        toHolder: transferForm.toHolder,
        reason: transferForm.reason,
      });
      setTransferForm({ toHolder: '', reason: '' });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (allocationId) => {
    await api.post(`/allocations/${allocationId}/return`, {
      conditionCheckInNotes: returnNotes || 'Returned',
    });
    load();
    if (selectedAssetId) {
      const histRes = await api.get(`/assets/${selectedAssetId}/history`);
      setHistory(histRes.data.allocations || []);
      setActiveAllocation(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Asset Allocation & Transfer" subtitle="Allocate available assets or submit transfer requests when blocked" />

      {canAllocate(user?.role) && (
        <Card className="mb-6">
          <div className="mb-4">
            <Label>Asset</Label>
            <Select value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)}>
              <option value="">Select asset by tag...</option>
              {assets.map((a) => (
                <option key={a._id} value={a._id}>{a.assetTag} — {a.name}</option>
              ))}
            </Select>
          </div>

          {isBlocked && (
            <>
              <AlertBanner variant="danger">
                Already allocated to {activeAllocation.holder?.name}
                {activeAllocation.holder?.department ? ` (${activeAllocation.holder.department.name})` : ''}.
                Direct re-allocation is blocked — submit a transfer request below.
              </AlertBanner>
              <form onSubmit={handleTransfer} className="mt-5 space-y-4">
                <div><Label>From</Label><Input value={activeAllocation.holder?.name || ''} readOnly className="bg-slate-50" /></div>
                <div>
                  <Label>To</Label>
                  <Select value={transferForm.toHolder} onChange={(e) => setTransferForm({ ...transferForm, toHolder: e.target.value })} required>
                    <option value="">Select Employee...</option>
                    {employees.filter((e) => e._id !== activeAllocation.allocatedTo).map((e) => (
                      <option key={e._id} value={e._id}>{e.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Reason</Label>
                  <textarea className="w-full rounded-xl border border-slate-200 p-3 text-sm" rows={3} value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} placeholder="Why is this transfer needed?" />
                </div>
                <Button type="submit" disabled={submitting}>Submit Request</Button>
              </form>
            </>
          )}

          {selectedAssetId && !isBlocked && selectedAsset?.status === 'Available' && (
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <Label>Employee</Label>
                <Select value={allocateForm.allocatedTo} onChange={(e) => setAllocateForm({ ...allocateForm, allocatedTo: e.target.value })} required>
                  <option value="">Select Employee...</option>
                  {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Expected Return (optional)</Label>
                <Input type="date" value={allocateForm.expectedReturnDate} onChange={(e) => setAllocateForm({ ...allocateForm, expectedReturnDate: e.target.value })} />
              </div>
              <Button type="submit" disabled={submitting}>Allocate Asset</Button>
            </form>
          )}

          {selectedAssetId && !isBlocked && selectedAsset?.status !== 'Available' && selectedAsset?.status !== 'Allocated' && (
            <p className="text-sm text-slate-500">This asset cannot be allocated (status: {selectedAsset?.status?.replace(/([A-Z])/g, ' $1').trim()}).</p>
          )}
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader title="Active Allocations" subtitle="Return assets to restore Available status" />
        {activeAllocations.length === 0 ? (
          <p className="text-sm text-slate-500">No active allocations</p>
        ) : (
          <div className="space-y-3">
            {activeAllocations.map((a) => (
              <div key={a._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="font-mono font-medium text-primary-600">{a.asset?.assetTag}</p>
                  <p className="text-sm text-slate-600">{a.holder?.name || '—'} · {a.asset?.name}</p>
                  {a.expectedReturnDate && (
                    <p className="text-xs text-slate-400">Due {new Date(a.expectedReturnDate).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  {canAllocate(user?.role) && (
                    <Button variant="ghost" onClick={() => handleReturn(a._id)}>Return</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {canAllocate(user?.role) && activeAllocations.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Label>Default condition check-in notes</Label>
            <Input value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Good condition" />
          </div>
        )}
      </Card>

      {selectedAssetId && history.length > 0 && (
        <Card className="mb-6">
          <CardHeader title="Allocation History" />
          <ul className="space-y-2 text-sm text-slate-600">
            {history.map((h) => (
              <li key={h._id} className="rounded-lg bg-slate-50 px-4 py-2">
                {new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {' — '}
                {h.status === 'Returned' ? 'Returned' : 'Allocated'}
                {h.conditionCheckInNotes ? ` — condition: ${h.conditionCheckInNotes.toLowerCase()}` : ''}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader title="Transfer Requests" />
        <div className="space-y-3">
          {transfers.length === 0 ? (
            <p className="text-sm text-slate-500">No transfer requests</p>
          ) : transfers.map((t) => (
            <div key={t._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4">
              <div>
                <p className="font-medium">{t.asset?.assetTag}: {t.fromHolder?.name} → {t.toHolder?.name}</p>
                {t.reason && <p className="mt-1 text-xs text-slate-500">{t.reason}</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
                {t.status === 'Requested' && canAllocate(user?.role) && (
                  <>
                    <Button variant="success" className="!px-2 !py-1 text-xs" onClick={() => api.post(`/transfers/${t._id}/approve`, { action: 'approve' }).then(load)}>Approve</Button>
                    <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => api.post(`/transfers/${t._id}/approve`, { action: 'reject' }).then(load)}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
