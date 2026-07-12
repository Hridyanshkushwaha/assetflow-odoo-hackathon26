import { useEffect, useState } from 'react';

import api from '../services/api';

import { useAuth } from '../context/AuthContext';

import { ROLES } from '../utils/roles';

import Card from '../components/Card';

import PageHeader from '../components/PageHeader';

import Modal from '../components/Modal';

import LoadingSpinner from '../components/LoadingSpinner';

import { Button, Input, Select, Label } from '../components/ui';



const KANBAN_COLUMNS = [

  { id: 'Pending', label: 'Pending' },

  { id: 'Approved', label: 'Approved' },

  { id: 'TechnicianAssigned', label: 'Technician Assigned' },

  { id: 'InProgress', label: 'In Progress' },

  { id: 'Resolved', label: 'Resolved' },

];



function KanbanCard({ request, isAssetManager, onAction }) {

  const subtitle = request.status === 'TechnicianAssigned' || request.status === 'InProgress'

    ? `tech: ${request.technicianName || '—'}`

    : request.issueDescription;



  return (

    <div className={`rounded-xl border p-3 text-sm ${request.status === 'Resolved' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>

      <p className="font-mono font-medium text-primary-600">{request.asset?.assetTag}</p>

      <p className="mt-1 text-slate-700">{request.asset?.name}</p>

      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{subtitle}</p>



      {isAssetManager && request.status === 'Pending' && (

        <div className="mt-3 flex gap-1">

          <Button variant="success" className="!px-2 !py-1 text-xs" onClick={() => onAction('approve', request._id)}>Approve</Button>

          <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => onAction('reject', request._id)}>Reject</Button>

        </div>

      )}

      {isAssetManager && request.status === 'Approved' && (

        <Button className="mt-3 !px-2 !py-1 text-xs" variant="secondary" onClick={() => onAction('assign', request._id)}>Assign Technician</Button>

      )}

      {isAssetManager && request.status === 'TechnicianAssigned' && (

        <Button className="mt-3 !px-2 !py-1 text-xs" onClick={() => onAction('start', request._id)}>Start Work</Button>

      )}

      {isAssetManager && request.status === 'InProgress' && (

        <Button className="mt-3 !px-2 !py-1 text-xs" onClick={() => onAction('resolve', request._id)}>Resolve</Button>

      )}

    </div>

  );

}



export default function Maintenance() {

  const { user } = useAuth();

  const [requests, setRequests] = useState([]);

  const [assets, setAssets] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ assetId: '', issueDescription: '', priority: 'Medium' });

  const isAssetManager = user?.role === ROLES.ASSET_MANAGER;



  const load = async () => {

    setLoading(true);

    try {

      const [m, a] = await Promise.all([api.get('/maintenance'), api.get('/assets')]);

      setRequests(m.data);

      setAssets(a.data);

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => { load(); }, []);



  const handleAction = async (action, id) => {

    if (action === 'approve') await api.post(`/maintenance/${id}/approve`, { approved: true });

    if (action === 'reject') await api.post(`/maintenance/${id}/approve`, { approved: false });

    if (action === 'assign') await api.post(`/maintenance/${id}/assign-technician`, { technicianName: prompt('Technician name:', 'Tech Team') || 'Tech Team' });

    if (action === 'start') await api.post(`/maintenance/${id}/start`);

    if (action === 'resolve') await api.post(`/maintenance/${id}/resolve`, { resolutionNotes: 'Completed' });

    load();

  };



  if (loading) return <LoadingSpinner />;



  return (

    <div>

      <PageHeader

        title="Maintenance Management"

        subtitle="Approval workflow as kanban board"

        action={<Button onClick={() => setShowForm(true)}>Raise Request</Button>}

      />



      <div className="grid gap-4 overflow-x-auto lg:grid-cols-5">

        {KANBAN_COLUMNS.map((col) => {

          const items = requests.filter((r) => r.status === col.id);

          return (

            <div key={col.id} className="min-w-[12rem]">

              <div className="mb-3 flex items-center justify-between">

                <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{items.length}</span>

              </div>

              <div className="space-y-2">

                {items.map((r) => (

                  <KanbanCard key={r._id} request={r} isAssetManager={isAssetManager} onAction={handleAction} />

                ))}

              </div>

            </div>

          );

        })}

      </div>



      <p className="mt-6 text-xs text-slate-500">

        Approving a card moves the asset to under maintenance; resolving returns it to available.

      </p>



      <Modal open={showForm} title="Raise Maintenance Request" onClose={() => setShowForm(false)}>

        <form onSubmit={async (e) => {

          e.preventDefault();

          await api.post('/maintenance', form);

          setForm({ assetId: '', issueDescription: '', priority: 'Medium' });

          setShowForm(false);

          load();

        }} className="space-y-4">

          <div>

            <Label>Asset</Label>

            <Select value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} required>

              <option value="">Select</option>

              {assets.map((a) => <option key={a._id} value={a._id}>{a.assetTag} — {a.name}</option>)}

            </Select>

          </div>

          <div>

            <Label>Priority</Label>

            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>

              <option>Low</option><option>Medium</option><option>High</option>

            </Select>

          </div>

          <div>

            <Label>Issue</Label>

            <textarea className="w-full rounded-xl border border-slate-200 p-3 text-sm" rows={3} value={form.issueDescription} onChange={(e) => setForm({ ...form, issueDescription: e.target.value })} required />

          </div>

          <div className="flex justify-end gap-2">

            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>

            <Button type="submit">Submit</Button>

          </div>

        </form>

      </Modal>

    </div>

  );

}

