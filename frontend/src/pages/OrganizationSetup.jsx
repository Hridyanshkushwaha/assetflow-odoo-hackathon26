import { useEffect, useState } from 'react';
import api from '../services/api';
import { ROLES } from '../utils/roles';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OrganizationSetup() {
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deptForm, setDeptForm] = useState({ name: '', code: '', status: 'Active' });
  const [catForm, setCatForm] = useState({ name: '', extraFields: {} });

  const load = async () => {
    setLoading(true);
    try {
      const [d, c, e] = await Promise.all([
        api.get('/departments'),
        api.get('/categories'),
        api.get('/employees'),
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

  const createDepartment = async (e) => {
    e.preventDefault();
    await api.post('/departments', deptForm);
    setDeptForm({ name: '', code: '', status: 'Active' });
    load();
  };

  const createCategory = async (e) => {
    e.preventDefault();
    await api.post('/categories', catForm);
    setCatForm({ name: '', extraFields: {} });
    load();
  };

  const updateEmployee = async (id, updates) => {
    await api.put(`/employees/${id}`, updates);
    load();
  };

  const promoteEmployee = async (id, role) => {
    await api.put(`/employees/${id}/promote`, { role });
    load();
  };

  if (loading) return <LoadingSpinner />;

  const tabs = [
    { id: 'departments', label: 'Departments' },
    { id: 'categories', label: 'Asset Categories' },
    { id: 'employees', label: 'Employee Directory' },
  ];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Organization Setup</h1>
      <p className="mb-6 text-slate-500">Manage master data for your organization</p>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-medium ${tab === t.id ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'departments' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={createDepartment} className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 font-semibold">Create Department</h2>
            <input placeholder="Department name" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="mb-3 w-full rounded-lg border px-3 py-2" required />
            <input placeholder="Department code (e.g. IT)" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })} className="mb-3 w-full rounded-lg border px-3 py-2" required />
            <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">Create</button>
          </form>
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 font-semibold">Departments ({departments.length})</h2>
            <ul className="space-y-2">
              {departments.map((d) => (
                <li key={d._id} className="flex justify-between rounded-lg bg-slate-50 p-3">
                  <span>{d.code} — {d.name}</span>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={createCategory} className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 font-semibold">Create Category</h2>
            <input placeholder="Category name" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="mb-3 w-full rounded-lg border px-3 py-2" required />
            <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">Create</button>
          </form>
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 font-semibold">Categories ({categories.length})</h2>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c._id} className="rounded-lg bg-slate-50 p-3">{c.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'employees' && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Employee Directory</h2>
          <p className="mb-4 text-sm text-slate-500">Role promotion is Admin-only via the protected promote endpoint.</p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Department</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">{emp.name}</td>
                  <td className="py-3 pr-4">{emp.email}</td>
                  <td className="py-3 pr-4">
                    <select value={emp.department?._id || ''} onChange={(e) => updateEmployee(emp._id, { department: e.target.value || null })} className="rounded border px-2 py-1 text-xs">
                      <option value="">None</option>
                      {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    {emp.role === ROLES.ADMIN ? (
                      <span className="text-xs font-medium">Admin</span>
                    ) : (
                      <select value={emp.role} onChange={(e) => promoteEmployee(emp._id, e.target.value)} className="rounded border px-2 py-1 text-xs">
                        <option value={ROLES.EMPLOYEE}>Employee</option>
                        <option value={ROLES.DEPARTMENT_HEAD}>Department Head</option>
                        <option value={ROLES.ASSET_MANAGER}>Asset Manager</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3">
                    <select value={emp.status} onChange={(e) => updateEmployee(emp._id, { status: e.target.value })} className="rounded border px-2 py-1 text-xs">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
