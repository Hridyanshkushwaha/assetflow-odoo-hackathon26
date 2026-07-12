/**
 * AssetFlow feature integration tests
 * Run from backend: node scripts/feature-test.mjs
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE = process.env.API_URL || 'http://localhost:5000/api';
const RUN = `test-${Date.now()}`;

const results = [];
let passed = 0;
let failed = 0;

function log(id, name, ok, detail = '') {
  results.push({ id, name, ok, detail });
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? '✓' : '✗'} [${id}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function req(method, path, { token, body, expectStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (expectStatus !== undefined && res.status !== expectStatus) {
    throw new Error(`${method} ${path} expected ${expectStatus}, got ${res.status}: ${JSON.stringify(data)}`);
  }
  return { status: res.status, data };
}

async function postForm(path, token, fields) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function ensureTestAdmin(email, password) {
  const User = (await import('../src/models/User.js')).default;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: 'Feature Test Admin',
      email,
      passwordHash: await User.hashPassword(password),
      role: 'Admin',
    });
  } else {
    user.role = 'Admin';
    user.passwordHash = await User.hashPassword(password);
    await user.save();
  }
  return user;
}

async function main() {
  console.log(`\nAssetFlow Feature Tests (${RUN})\n${'='.repeat(50)}\n`);

  await mongoose.connect(process.env.MONGO_URI);
  const adminEmail = `${RUN}-admin@test.com`;
  const adminPass = 'TestPass123!';
  await ensureTestAdmin(adminEmail, adminPass);
  await mongoose.disconnect();

  let adminToken, mgrToken, emp1Token, emp2Token;
  let emp1Id, emp2Id, deptId, catId, assetId, bookableId;
  let allocId, transferId, bookingId, maintId, auditId, auditItemId;

  try {
    const signupRoleHack = await req('POST', '/auth/signup', {
      body: { name: 'Hacker', email: `${RUN}-hack@test.com`, password: adminPass, role: 'Admin' },
      expectStatus: 400,
    });
    log('1.1', 'Signup rejects role in body', signupRoleHack.data?.message?.includes('Role'));
  } catch (e) { log('1.1', 'Signup rejects role in body', false, e.message); }

  try {
    const emp = await req('POST', '/auth/signup', {
      body: { name: 'Priya Shah', email: `${RUN}-priya@test.com`, password: adminPass },
      expectStatus: 201,
    });
    emp1Token = emp.data.token;
    emp1Id = emp.data.user.id;
    log('1.2', 'Signup creates Employee only', emp.data.user.role === 'Employee');
  } catch (e) { log('1.2', 'Signup creates Employee only', false, e.message); }

  try {
    const emp2 = await req('POST', '/auth/signup', {
      body: { name: 'Raj Kumar', email: `${RUN}-raj@test.com`, password: adminPass },
      expectStatus: 201,
    });
    emp2Token = emp2.data.token;
    emp2Id = emp2.data.user.id;
  } catch (e) { /* continue */ }

  try {
    const login = await req('POST', '/auth/login', {
      body: { email: adminEmail, password: adminPass },
      expectStatus: 200,
    });
    adminToken = login.data.token;
    log('1.3', 'Email/password login works', !!adminToken);
  } catch (e) { log('1.3', 'Email/password login', false, e.message); return; }

  try {
    const bad = await req('POST', '/auth/login', {
      body: { email: adminEmail, password: 'wrong' },
      expectStatus: 401,
    });
    log('1.4', 'Invalid credentials rejected', bad.data?.message === 'Invalid credentials');
  } catch (e) { log('1.4', 'Invalid credentials rejected', false, e.message); }

  try {
    const me = await req('GET', '/auth/me', { token: adminToken, expectStatus: 200 });
    log('1.5', 'Session validation (/auth/me)', me.data.user?.role === 'Admin');
  } catch (e) { log('1.5', 'Session validation', false, e.message); }

  try {
    const forgot = await req('POST', '/auth/forgot-password', { body: { email: adminEmail } });
    log('1.6', 'Forgot password endpoint', forgot.status === 200 && forgot.data?.message);
  } catch (e) { log('1.6', 'Forgot password endpoint', false, e.message); }

  try {
    const dept = await req('POST', '/departments', {
      token: adminToken,
      body: { name: `Engineering-${RUN}`, code: `E${Date.now().toString().slice(-4)}`, status: 'Active', head: emp1Id },
      expectStatus: 201,
    });
    deptId = dept.data._id;
    log('3.1', 'Admin creates department with head', !!deptId);
  } catch (e) { log('3.1', 'Admin creates department', false, e.message); }

  try {
    const deptUpdate = await req('PUT', `/departments/${deptId}`, {
      token: adminToken,
      body: { status: 'Inactive' },
      expectStatus: 200,
    });
    await req('PUT', `/departments/${deptId}`, { token: adminToken, body: { status: 'Active' } });
    log('3.2', 'Admin edit/deactivate department', deptUpdate.data.status === 'Inactive');
  } catch (e) { log('3.2', 'Admin edit department', false, e.message); }

  try {
    const cat = await req('POST', '/categories', {
      token: adminToken,
      body: { name: `Electronics-${RUN}`, extraFields: { warrantyMonths: 24 } },
      expectStatus: 201,
    });
    catId = cat.data._id;
    log('3.3', 'Create category with extraFields', cat.data.extraFields?.warrantyMonths === 24);
  } catch (e) { log('3.3', 'Create category', false, e.message); }

  try {
    const promote = await req('PUT', `/users/${emp1Id}`, {
      token: adminToken,
      body: { role: 'AssetManager', department: deptId },
      expectStatus: 200,
    });
    mgrToken = emp1Token;
    log('3.4', 'Admin promotes to AssetManager', promote.data.role === 'AssetManager');
  } catch (e) { log('3.4', 'Admin promotes role', false, e.message); }

  try {
    const empPromote = await req('PUT', `/users/${emp2Id}`, { token: emp2Token, body: { role: 'Admin' } });
    log('3.5', 'Employee cannot self-promote', empPromote.status === 403);
  } catch (e) { log('3.5', 'Employee cannot self-promote', false, e.message); }

  try {
    const asset = await postForm('/assets', mgrToken || adminToken, {
      name: 'Dell Laptop', category: catId, serialNumber: `SN-${RUN}`, location: 'Bengaluru', condition: 'Good', isBookable: 'false',
    });
    assetId = asset.data._id;
    log('4.1', 'Register asset with auto tag', asset.status === 201 && !!asset.data.assetTag, asset.data.assetTag);
  } catch (e) { log('4.1', 'Register asset', false, e.message); }

  try {
    const book = await postForm('/assets', mgrToken || adminToken, {
      name: 'Conference Room B2', category: catId, location: 'HQ Floor 2', isBookable: 'true',
    });
    bookableId = book.data._id;
    log('4.2', 'Register bookable resource', book.data.isBookable === true);
  } catch (e) { log('4.2', 'Register bookable resource', false, e.message); }

  try {
    const search = await req('GET', `/assets?search=${encodeURIComponent(`SN-${RUN}`)}`, { token: adminToken, expectStatus: 200 });
    log('4.3', 'Search by serial number', search.data.some((a) => a.serialNumber === `SN-${RUN}`));
  } catch (e) { log('4.3', 'Search by serial', false, e.message); }

  try {
    const hist = await req('GET', `/assets/${assetId}/history`, { token: adminToken, expectStatus: 200 });
    log('4.4', 'Per-asset history endpoint', hist.data.asset && Array.isArray(hist.data.allocations));
  } catch (e) { log('4.4', 'Per-asset history', false, e.message); }

  try {
    const alloc = await req('POST', '/allocations', {
      token: mgrToken,
      body: { assetId, allocatedTo: emp1Id, allocatedToType: 'User', expectedReturnDate: new Date(Date.now() + 86400000).toISOString() },
      expectStatus: 201,
    });
    allocId = alloc.data._id;
    log('5.1', 'Allocate asset to employee', alloc.data.status === 'Active');
  } catch (e) { log('5.1', 'Allocate asset', false, e.message); }

  try {
    const conflict = await req('POST', '/allocations', {
      token: mgrToken,
      body: { assetId, allocatedTo: emp2Id, allocatedToType: 'User' },
      expectStatus: 409,
    });
    log('5.2', 'Double allocation blocked', conflict.data?.code === 'ALLOCATION_CONFLICT');
  } catch (e) { log('5.2', 'Double allocation blocked', false, e.message); }

  try {
    const transfer = await req('POST', '/transfers', {
      token: mgrToken,
      body: { allocationId: allocId, toHolder: emp2Id, reason: 'Team change' },
      expectStatus: 201,
    });
    transferId = transfer.data._id;
    log('5.3', 'Transfer request created', transfer.data.status === 'Requested');
  } catch (e) { log('5.3', 'Transfer request', false, e.message); }

  try {
    const approve = await req('POST', `/transfers/${transferId}/approve`, {
      token: mgrToken,
      body: { action: 'approve' },
      expectStatus: 200,
    });
    log('5.4', 'Transfer approved & re-allocated', approve.data.transfer?.status === 'Approved' || !!approve.data.newAllocation);
  } catch (e) { log('5.4', 'Transfer approved', false, e.message); }

  try {
    const allocs = await req('GET', '/allocations', { token: adminToken, expectStatus: 200 });
    const active = allocs.data.find((a) => a.asset?._id === assetId && a.status === 'Active');
    const ret = await req('POST', `/allocations/${active._id}/return`, {
      token: mgrToken,
      body: { conditionCheckInNotes: 'Good condition' },
      expectStatus: 200,
    });
    const assetCheck = await req('GET', `/assets/${assetId}`, { token: adminToken });
    log('5.5', 'Return restores Available', ret.data.status === 'Returned' && assetCheck.data.status === 'Available');
  } catch (e) { log('5.5', 'Return flow', false, e.message); }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  tomorrow.setHours(9, 0, 0, 0);
  const tEnd = new Date(tomorrow); tEnd.setHours(10, 0, 0, 0);
  const overlapStart = new Date(tomorrow); overlapStart.setHours(9, 30, 0, 0);
  const overlapEnd = new Date(tomorrow); overlapEnd.setHours(10, 30, 0, 0);
  const okStart = new Date(tomorrow); okStart.setHours(10, 0, 0, 0);
  const okEnd = new Date(tomorrow); okEnd.setHours(11, 0, 0, 0);

  try {
    const b1 = await req('POST', '/bookings', {
      token: emp2Token,
      body: { resourceId: bookableId, startTime: tomorrow.toISOString(), endTime: tEnd.toISOString() },
      expectStatus: 201,
    });
    bookingId = b1.data._id;
    log('6.1', 'Create booking 9-10', b1.data.status === 'Upcoming');

    const overlap = await req('POST', '/bookings', {
      token: emp1Token,
      body: { resourceId: bookableId, startTime: overlapStart.toISOString(), endTime: overlapEnd.toISOString() },
      expectStatus: 409,
    });
    log('6.2', 'Overlap rejected (9:30-10:30)', overlap.data?.code === 'BOOKING_OVERLAP');

    const ok = await req('POST', '/bookings', {
      token: emp1Token,
      body: { resourceId: bookableId, startTime: okStart.toISOString(), endTime: okEnd.toISOString() },
      expectStatus: 201,
    });
    log('6.3', 'Adjacent slot OK (10-11)', ok.status === 201);

    const cal = await req('GET', `/bookings/calendar/${bookableId}`, { token: adminToken, expectStatus: 200 });
    log('6.4', 'Calendar view', Array.isArray(cal.data) && cal.data.length >= 2);

    const cancel = await req('POST', `/bookings/${bookingId}/cancel`, { token: emp2Token, expectStatus: 200 });
    log('6.5', 'Cancel booking', cancel.data.status === 'Cancelled');
  } catch (e) { log('6.x', 'Bookings', false, e.message); }

  try {
    const m = await postForm('/maintenance', emp2Token, { assetId, issueDescription: 'Screen flickering', priority: 'High' });
    maintId = m.data._id;
    log('7.1', 'Raise maintenance request', m.data.status === 'Pending');

    await req('POST', `/maintenance/${maintId}/approve`, { token: mgrToken, body: { approved: true }, expectStatus: 200 });
    const assetAfter = await req('GET', `/assets/${assetId}`, { token: adminToken });
    log('7.2', 'Approve → Under Maintenance', assetAfter.data.status === 'UnderMaintenance');

    await req('POST', `/maintenance/${maintId}/assign-technician`, { token: mgrToken, body: { technicianName: 'R Varma' }, expectStatus: 200 });
    await req('POST', `/maintenance/${maintId}/start`, { token: mgrToken, expectStatus: 200 });
    await req('POST', `/maintenance/${maintId}/resolve`, { token: mgrToken, body: { resolutionNotes: 'Fixed' }, expectStatus: 200 });
    const assetFinal = await req('GET', `/assets/${assetId}`, { token: adminToken });
    log('7.3', 'Full workflow → Available', assetFinal.data.status === 'Available');
  } catch (e) { log('7.x', 'Maintenance workflow', false, e.message); }

  try {
    const audit = await req('POST', '/audits', {
      token: adminToken,
      body: {
        name: `Q3 Audit ${RUN}`,
        scopeDepartment: deptId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        auditors: [emp1Id],
      },
      expectStatus: 201,
    });
    auditId = audit.data._id;
    const cycle = await req('GET', `/audits/${auditId}`, { token: adminToken, expectStatus: 200 });
    auditItemId = cycle.data.items?.[0]?._id;
    log('8.1', 'Create audit cycle with auditors', !!auditId && cycle.data.items?.length > 0);

    await req('POST', `/audits/${auditId}/items`, { token: mgrToken, body: { itemId: auditItemId, result: 'Missing' }, expectStatus: 200 });
    const report = await req('GET', `/audits/${auditId}/discrepancy-report`, { token: adminToken });
    log('8.2', 'Discrepancy report', report.status === 200);

    await req('POST', `/audits/${auditId}/close`, { token: mgrToken, expectStatus: 200 });
    const closed = await req('GET', `/audits/${auditId}`, { token: adminToken });
    log('8.3', 'Close audit cycle', closed.data.status === 'Closed');
  } catch (e) { log('8.x', 'Audit workflow', false, e.message); }

  try {
    const dash = await req('GET', '/dashboard/kpis', { token: adminToken, expectStatus: 200 });
    log('2.1', 'Dashboard KPIs', dash.data.kpis && 'assetsAvailable' in dash.data.kpis);
    log('2.2', 'Overdue returns separated', Array.isArray(dash.data.overdueReturns));
    log('2.3', 'Upcoming returns separated', Array.isArray(dash.data.upcomingReturns));
  } catch (e) { log('2.x', 'Dashboard', false, e.message); }

  try {
    const reports = await Promise.all([
      req('GET', '/reports/utilization', { token: mgrToken, expectStatus: 200 }),
      req('GET', '/reports/maintenance-frequency', { token: mgrToken, expectStatus: 200 }),
      req('GET', '/reports/allocation-summary', { token: mgrToken, expectStatus: 200 }),
      req('GET', '/reports/booking-heatmap', { token: mgrToken, expectStatus: 200 }),
      req('GET', '/reports/maintenance-alerts', { token: mgrToken, expectStatus: 200 }),
    ]);
    log('9.1', 'All report endpoints', reports.every((r) => r.status === 200));
  } catch (e) { log('9.1', 'Reports', false, e.message); }

  try {
    const notifs = await req('GET', '/notifications', { token: emp2Token, expectStatus: 200 });
    log('10.1', 'User notifications', Array.isArray(notifs.data));
    log('10.2', 'Notification types generated', notifs.data.length > 0);

    const logs = await req('GET', '/notifications/activity-logs', { token: mgrToken, expectStatus: 200 });
    log('10.3', 'Activity audit log', Array.isArray(logs.data) && logs.data.length > 0);
  } catch (e) { log('10.x', 'Notifications', false, e.message); }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${results.length} total\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Test runner crashed:', e);
  process.exit(1);
});
