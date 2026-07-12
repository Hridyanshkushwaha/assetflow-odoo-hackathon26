import { useEffect, useState } from 'react';
import api from '../services/api';
import { ROLES } from '../utils/roles';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import TabPills from '../components/TabPills';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, Input, Select, Label } from '../components/ui';

const tabs = [
  { id: 'departments', label: 'Departments' },
  { id: 'categories', label: 'Categories' },
  { id: 'employees', label: 'Employee' },
];

export default function OrganizationSetup() {
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', status: 'Active', head: '', parentDepartment: '' });
  const [catForm, setCatForm] = useState({ name: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [d, c, e] = await Promise.all([
        api.get('/departments'),
        api.get('/categories'),
        api.get('/users'),
      ]);
      setDepartments(d.data);
      setCategories(c.data);
      setEmployees(e.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (tab === 'departments') {
      const payload = { ...deptForm, head: deptForm.head || undefined, parentDepartment: deptForm.parentDepartment || undefined };
      await api.post('/departments', payload);
      setDeptForm({ name: '', code: '', status: 'Active', head: '', parentDepartment: '' });
    } else if (tab === 'categories') {
      await api.post('/categories', catForm);
      setCatForm({ name: '' });
    }
    setShowAdd(false);
    load();
  };

  if (loading) return <LoadingSpinner />;

  const addLabel = tab === 'departments' ? 'Department' : tab === 'categories' ? 'Category' : null;

  return (
    <div>
      <PageHeader title="Organization Setup" subtitle="Admin — manage master data" />

      <TabPills
        tabs={tabs}
        active={tab}
        onChange={setTab}
        action={
          addLabel ? (
            <Button onClick={() => setShowAdd(true)}>+ Add</Button>
          ) : null
        }
      />

      {tab === 'departments' && (
        <Card padding={false}>
          <DataTable
            columns={[
              { key: 'name', label: 'Department', render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'head', label: 'Head', render: (r) => r.head?.name || '—' },
              { key: 'parent', label: 'Parent Dept', render: (r) => r.parentDepartment?.name || '—' },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={departments.map((d) => ({ ...d, id: d._id }))}
            emptyMessage="No departments yet — click + Add to create one"
          />
          <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            Editing a department here also drives the picklist in Asset Registration & Allocation screens.
          </p>
        </Card>
      )}

      {tab === 'categories' && (
        <Card padding={false}>
          <DataTable
            columns={[
              { key: 'name', label: 'Category', render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'fields', label: 'Extra Fields', render: (r) => Object.keys(r.extraFields || {}).length ? 'Configured' : '—' },
            ]}
            rows={categories.map((c) => ({ ...c, id: c._id }))}
            emptyMessage="No categories yet — click + Add to create one"
          />
        </Card>
      )}

      {tab === 'employees' && (
        <Card padding={false}>
          <DataTable
            columns={[
              { key: 'name', label: 'Employee', render: (r) => (
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.email}</p>
                </div>
              )},
              { key: 'department', label: 'Department', render: (r) => (
                <Select
                  value={r.department?._id || ''}
                  onChange={(e) => api.put(`/users/${r._id}`, { department: e.target.value || null }).then(load)}
                  className="!py-1.5"
                >
                  <option value="">No department</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </Select>
              )},
              { key: 'role', label: 'Role', render: (r) => (
                r.role === ROLES.ADMIN ? (
                  <span className="text-sm font-medium text-primary-600">Admin</span>
                ) : (
                  <Select value={r.role} onChange={(e) => api.put(`/users/${r._id}`, { role: e.target.value }).then(load)} className="!py-1.5">
                    <option value={ROLES.EMPLOYEE}>Employee</option>
                    <option value={ROLES.DEPARTMENT_HEAD}>Department Head</option>
                    <option value={ROLES.ASSET_MANAGER}>Asset Manager</option>
                  </Select>
                )
              )},
              { key: 'status', label: 'Status', render: (r) => (
                <Select value={r.status} onChange={(e) => api.put(`/users/${r._id}`, { status: e.target.value }).then(load)} className="!py-1.5">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              )},
            ]}
            rows={employees.map((e) => ({ ...e, id: e._id }))}
          />
        </Card>
      )}

      <Modal open={showAdd} title={`Add ${addLabel}`} onClose={() => setShowAdd(false)}>
        <form onSubmit={handleAdd} className="space-y-4">
          {tab === 'departments' && (
            <>
              <div><Label>Name</Label><Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} required /></div>
              <div><Label>Code</Label><Input value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })} required /></div>
              <div>
                <Label>Head</Label>
                <Select value={deptForm.head} onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })}>
                  <option value="">None</option>
                  {employees.filter((e) => e.status === 'Active').map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Parent Department</Label>
                <Select value={deptForm.parentDepartment} onChange={(e) => setDeptForm({ ...deptForm, parentDepartment: e.target.value })}>
                  <option value="">None</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </Select>
              </div>
            </>
          )}
          {tab === 'categories' && (
            <div><Label>Name</Label><Input value={catForm.name} onChange={(e) => setCatForm({ name: e.target.value })} placeholder="Electronics, Furniture..." required /></div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
