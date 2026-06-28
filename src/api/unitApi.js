import axios from 'axios';

const API_BASE_URL = '';
function getUnitToken() {
  return (
    localStorage.getItem('unitToken') ||
    localStorage.getItem('adminToken') || 
    null
  );
}

function createClient() {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: { Accept: '*/*' },
  });

  client.interceptors.request.use((config) => {
    const token = getUnitToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}

const client = createClient();

/** * تنظيف المصفوفات (Arrays) من أي Wrapper 
 */
const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;

  const directCandidates = [
    data?.data,
    data?.result,
    data?.items,
    data?.data?.data,
    data?.data?.result,
    data?.data?.items,
    data?.payload,
    data?.payload?.data,
  ];

  for (const c of directCandidates) {
    if (Array.isArray(c)) return c;
  }

  const visited = new Set();
  const stack = [{ value: data, depth: 0 }];
  const maxDepth = 6;

  while (stack.length) {
    const { value, depth } = stack.pop();
    if (!value || typeof value !== 'object') continue;
    if (visited.has(value)) continue;
    visited.add(value);

    if (Array.isArray(value)) return value;
    if (depth >= maxDepth) continue;

    for (const key of Object.keys(value)) {
      const next = value[key];
      if (Array.isArray(next)) return next;
      if (next && typeof next === 'object') stack.push({ value: next, depth: depth + 1 });
    }
  }

  return [];
};

/** * تنظيف الأوبجكت (Object) - مهم جداً لصفحة الـ Details والـ Profile
 */
const normalizeObject = (data) => {
  if (!data) return null;
  // لو الـ API باعت الـ object جوه key اسمه data (زي الـ JSON اللي بعته)
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data;
  }
  // لو الـ API باعت الـ object مباشرة
  if (typeof data === 'object' && !Array.isArray(data)) {
    return data;
  }
  return null;
};

// --- API Methods ---

export async function getMyAssignments() {
  const res = await client.get('/api/ResponseUnit/my-assignments');
  return normalizeArray(res.data);
}

/** جلب حادثة معينة بالـ ID (تستخدم في صفحة التفاصيل) **/
export async function getIncidentById(id) {
  const res = await client.get(`/api/Incident/${id}`);
  return normalizeObject(res.data);
}

export async function getIncidentsFeed() {
  const candidates = [
    '/api/Incident/my-incidents',
    '/api/Incident/List',
    '/api/Incident',
  ];

  let lastError;
  for (const path of candidates) {
    try {
      const res = await client.get(path);
      return normalizeArray(res.data);
    } catch (e) {
      lastError = e;
    }
  }
  if (lastError) throw lastError;
  return [];
}

export async function getWaitingIncidents() {
  // يفضل استخدام الـ baseURL المعرف فوق
  const res = await client.get('/api/ResponseUnit/my-assignments');
  return normalizeArray(res.data);
}

export async function manualAssignIncident({ incidentId, unitId } = {}) {
  const payload = { incidentId, unitId };
  const res = await client.post('/api/Monitoring/manual-assign', payload);
  return res.data;
}

export async function acceptAssignment({ incidentId, userId } = {}) {
  const payload = { incidentId, ...(userId ? { userId } : {}) };
  const res = await client.post('/api/ResponseUnit/accept', payload);
  return res.data;
}

export async function rejectAssignment({ incidentId, userId, reason } = {}) {
  const payload = { incidentId, ...(userId ? { userId } : {}), ...(reason ? { reason } : {}) };
  const res = await client.post('/api/ResponseUnit/reject', payload);
  return res.data;
}

export async function arriveAtScene({ incidentId, userId } = {}) {
  const payload = { incidentId, ...(userId ? { userId } : {}) };
  const res = await client.post('/api/ResponseUnit/arrive', payload);
  return res.data;
}

export async function completeAssignment({ incidentId, userId, notes } = {}) {
  const payload = { incidentId, ...(userId ? { userId } : {}), ...(notes ? { notes } : {}) };
  const res = await client.post('/api/ResponseUnit/complete', payload);
  return res.data;
}

export async function getMyProfile() {
  const res = await client.get('/Profile');
  return normalizeObject(res.data);
}

export async function editMyProfile(payload) {
  const res = await client.put('/Profile/Edit', payload);
  return res.data;
}

export async function changeMyPassword(payload) {
  const res = await client.put('/Profile/ChangePassword', payload);
  return res.data;
}