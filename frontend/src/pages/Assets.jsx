import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import api from '../services/api';

import { useAuth } from '../context/AuthContext';

import { canRegisterAssets } from '../utils/roles';

import Card from '../components/Card';

import PageHeader from '../components/PageHeader';

import DataTable from '../components/DataTable';

import Modal from '../components/Modal';

import StatusBadge from '../components/StatusBadge';

import LoadingSpinner from '../components/LoadingSpinner';

import { Button, Input, Select, Label } from '../components/ui';



export default function Assets() {

  const { user } = useAuth();

  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);

  const [categories, setCategories] = useState([]);

  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ search: '', status: '', category: '', location: '' });

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({

    name: '', category: '', serialNumber: '', location: '', condition: 'Good', isBookable: false,

  });



  const load = async () => {

    setLoading(true);

    try {

      const params = {};

      if (filters.search) params.search = filters.search;

      if (filters.status) params.status = filters.status;

      if (filters.category) params.category = filters.category;

      if (filters.location) params.location = filters.location;

      const [a, c, d] = await Promise.all([

        api.get('/assets', { params }),

        api.get('/categories'),

        api.get('/departments'),

      ]);

      setAssets(a.data);

      setCategories(c.data);

      setDepartments(d.data);

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



  if (loading && assets.length === 0) return <LoadingSpinner />;



  return (

    <div>

      <PageHeader

        title="Asset Registration & Directory"

        subtitle="Search, filter, and register assets"

        action={

          canRegisterAssets(user?.role) && (

            <Button onClick={() => setShowForm(true)}>+ Register Asset</Button>

          )

        }

      />



      <Card className="mb-6">

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">

          <Input

            placeholder="Search by tag, serial, or QR code.."

            value={filters.search}

            onChange={(e) => setFilters({ ...filters, search: e.target.value })}

          />

          <Select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>

            <option value="">Category</option>

            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}

          </Select>

          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>

            <option value="">Status</option>

            {['Available', 'Allocated', 'UnderMaintenance', 'Reserved', 'Lost', 'Retired'].map((s) => (

              <option key={s} value={s}>{s.replace(/([A-Z])/g, ' $1').trim()}</option>

            ))}

          </Select>

          <Select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>

            <option value="">Department / Location</option>

            {departments.map((d) => <option key={d._id} value={d.name}>{d.name}</option>)}

          </Select>

        </div>

        <div className="mt-3 flex justify-end">

          <Button variant="secondary" onClick={load}>Apply Filters</Button>

        </div>

      </Card>



      <Card padding={false}>

        <DataTable

          columns={[

            { key: 'tag', label: 'Tag', render: (r) => <span className="font-mono font-medium text-primary-600">{r.assetTag}</span> },

            { key: 'name', label: 'Name', render: (r) => r.name },

            { key: 'category', label: 'Category', render: (r) => r.category?.name || '—' },

            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },

            { key: 'location', label: 'Location', render: (r) => r.location || '—' },

          ]}

          rows={assets.map((a) => ({ ...a, id: a._id }))}

          onRowClick={(row) => navigate(`/assets/${row.id}`)}

          emptyMessage="No assets match your filters"

        />

      </Card>



      <Modal open={showForm} title="Register New Asset" onClose={() => setShowForm(false)}>

        <form onSubmit={handleCreate} className="space-y-4">

          <div><Label>Asset Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>

          <div>

            <Label>Category</Label>

            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>

              <option value="">Select category</option>

              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}

            </Select>

          </div>

          <div><Label>Serial Number</Label><Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></div>

          <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>

          <label className="flex items-center gap-2">

            <input type="checkbox" checked={form.isBookable} onChange={(e) => setForm({ ...form, isBookable: e.target.checked })} className="rounded" />

            <span className="text-sm text-slate-700">Shared / bookable resource</span>

          </label>

          <div className="flex justify-end gap-2">

            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>

            <Button type="submit">Register Asset</Button>

          </div>

        </form>

      </Modal>

    </div>

  );

}

