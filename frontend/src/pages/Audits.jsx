import { useEffect, useState } from 'react';

import api from '../services/api';

import { useAuth } from '../context/AuthContext';

import { ROLES, canApproveMaintenance } from '../utils/roles';

import Card from '../components/Card';

import PageHeader from '../components/PageHeader';

import DataTable from '../components/DataTable';

import AlertBanner from '../components/AlertBanner';

import Modal from '../components/Modal';

import StatusBadge from '../components/StatusBadge';

import LoadingSpinner from '../components/LoadingSpinner';

import { Button, Input, Select, Label } from '../components/ui';



const verificationStyles = {

  Verified: 'border-emerald-500 bg-emerald-500 text-white',

  Missing: 'border-red-500 bg-red-500 text-white',

  Damaged: 'border-slate-300 bg-white text-slate-700',

};



export default function Audits() {

  const { user } = useAuth();

  const [cycles, setCycles] = useState([]);

  const [selected, setSelected] = useState(null);

  const [departments, setDepartments] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({ name: '', scopeDepartment: '', scopeLocation: '', startDate: '', endDate: '', auditors: [] });



  const load = async () => {

    setLoading(true);

    try {

      const c = await api.get('/audits');

      setCycles(c.data);

      if (user?.role === ROLES.ADMIN) {

        const [d, u] = await Promise.all([api.get('/departments'), api.get('/users')]);

        setDepartments(d.data);

        setEmployees(u.data.filter((e) => e.status === 'Active'));

      }

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => { load(); }, []);



  const loadCycle = async (id) => {

    const res = await api.get(`/audits/${id}`);

    setSelected(res.data);

  };



  useEffect(() => {

    if (cycles.length && !selected) {

      const open = cycles.find((c) => c.status === 'Open') || cycles[0];

      if (open) loadCycle(open._id);

    }

  }, [cycles]);



  const flaggedCount = selected?.items?.filter((i) => i.result && i.result !== 'Verified').length || 0;



  if (loading) return <LoadingSpinner />;



  return (

    <div>

      <PageHeader

        title="Asset Audit"

        subtitle="Structured verification cycles with discrepancy reports"

        action={

          user?.role === ROLES.ADMIN && (

            <Button onClick={() => setShowCreate(true)}>+ New Cycle</Button>

          )

        }

      />



      {cycles.length > 1 && (

        <div className="mb-4 flex flex-wrap gap-2">

          {cycles.map((c) => (

            <button

              key={c._id}

              type="button"

              onClick={() => loadCycle(c._id)}

              className={`rounded-full border px-3 py-1.5 text-sm ${selected?._id === c._id ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'}`}

            >

              {c.name}

            </button>

          ))}

        </div>

      )}



      {selected && (

        <>

          <Card className="mb-6 bg-amber-50/50">

            <p className="font-medium text-slate-900">

              {selected.name}

              {selected.scopeDepartment ? `: ${selected.scopeDepartment.name} dept` : ''}

              {' — '}

              {new Date(selected.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}

              {' – '}

              {new Date(selected.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}

            </p>

            <p className="mt-1 text-sm text-slate-600">

              Auditors: {selected.auditors?.map((a) => a.name).join(', ') || '—'}

            </p>

          </Card>



          <Card padding={false} className="mb-6">

            <DataTable

              columns={[

                {

                  key: 'asset',

                  label: 'Asset',

                  render: (r) => (

                    <div>

                      <span className="font-mono text-primary-600">{r.asset?.assetTag}</span>

                      <span className="ml-2">{r.asset?.name}</span>

                    </div>

                  ),

                },

                { key: 'location', label: 'Expected Location', render: (r) => r.asset?.location || '—' },

                {

                  key: 'verification',

                  label: 'Verification',

                  render: (r) => (

                    selected.status === 'Open' ? (

                      <div className="flex gap-1">

                        {['Verified', 'Missing', 'Damaged'].map((result) => (

                          <button

                            key={result}

                            type="button"

                            onClick={() => api.post(`/audits/${selected._id}/items`, { itemId: r._id, result }).then(() => loadCycle(selected._id))}

                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${

                              r.result === result ? verificationStyles[result] : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'

                            }`}

                          >

                            {result}

                          </button>

                        ))}

                      </div>

                    ) : (

                      <StatusBadge status={r.result || 'Pending'} />

                    )

                  ),

                },

              ]}

              rows={(selected.items || []).map((i) => ({ ...i, id: i._id }))}

            />

          </Card>



          {flaggedCount > 0 && selected.status === 'Open' && (

            <AlertBanner variant="info" className="mb-4">

              {flaggedCount} asset{flaggedCount > 1 ? 's' : ''} flagged — discrepancy report will be generated on close

            </AlertBanner>

          )}



          {selected.status === 'Open' && canApproveMaintenance(user?.role) && (

            <Button variant="secondary" onClick={async () => { await api.post(`/audits/${selected._id}/close`); setSelected(null); load(); }}>

              Close Audit Cycle

            </Button>

          )}

        </>

      )}



      <Modal open={showCreate} title="Create Audit Cycle" onClose={() => setShowCreate(false)}>

        <form onSubmit={async (e) => {

          e.preventDefault();

          await api.post('/audits', { ...form, auditors: form.auditors.length ? form.auditors : [user._id || user.id] });

          setShowCreate(false);

          load();

        }} className="space-y-4">

          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Q3 audit" required /></div>

          <div>

            <Label>Department Scope</Label>

            <Select value={form.scopeDepartment} onChange={(e) => setForm({ ...form, scopeDepartment: e.target.value })}>

              <option value="">All</option>

              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}

            </Select>

          </div>

          <div><Label>Location</Label><Input value={form.scopeLocation} onChange={(e) => setForm({ ...form, scopeLocation: e.target.value })} /></div>

          <div className="grid grid-cols-2 gap-3">

            <div><Label>Start</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></div>

            <div><Label>End</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></div>

          </div>

          <div>

            <Label>Auditors</Label>

            <Select

              multiple

              value={form.auditors}

              onChange={(e) => setForm({ ...form, auditors: Array.from(e.target.selectedOptions, (o) => o.value) })}

              className="min-h-[6rem]"

            >

              {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}

            </Select>

          </div>

          <div className="flex justify-end gap-2">

            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>

            <Button type="submit">Create</Button>

          </div>

        </form>

      </Modal>

    </div>

  );

}

