import axios from 'axios';

const API_BASE_URL = '';

function getBinToken() {
  return (
    localStorage.getItem('binToken') ||
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
    const token = getBinToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}

const client = createClient();

const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  const candidates = [data?.data, data?.result, data?.items, data?.data?.data, data?.data?.result, data?.data?.items, data?.payload, data?.payload?.data];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  const visited = new Set();
  const stack = [{ value: data, depth: 0 }];
  while (stack.length) {
    const { value, depth } = stack.pop();
    if (!value || typeof value !== 'object') continue;
    if (visited.has(value)) continue;
    visited.add(value);
    if (Array.isArray(value)) return value;
    if (depth >= 6) continue;
    for (const key of Object.keys(value)) {
      const next = value[key];
      if (Array.isArray(next)) return next;
      if (next && typeof next === 'object') stack.push({ value: next, depth: depth + 1 });
    }
  }
  return [];
};

const normalizeObject = (data) => {
  if (!data) return null;
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) return data.data;
  if (typeof data === 'object' && !Array.isArray(data)) return data;
  return null;
};

/* ─── BIN SPECIFIC ─── */

// جلب جميع الصناديق بناءً على رابط الـ Swagger الجديد
export async function getAllBins() {
  const candidates = [
    '/api/Bins/GetAll', // الرابط الأساسي الفعلي من السيرفر بتاعك
    '/api/Bins',
    '/api/Bin/List',
  ];
  for (const path of candidates) {
    try {
      const res = await client.get(path);
      const arr = normalizeArray(res.data);
      if (arr.length > 0) return arr;
    } catch {}
  }
  return [];
}

// جلب الصناديق القريبة باستخدام الإحداثيات (lat, lng)
export async function getNearbyBins(lat, lng) {
  try {
    const res = await client.get('/api/Bins/GetNearby', {
      params: { lat, lng } // بيبعتها في الـ URL كـ ?lat=xx&lng=xx
    });
    return normalizeArray(res.data);
  } catch (error) {
    console.error("Error fetching nearby bins:", error);
    return [];
  }
}

// جلب تفاصيل صندوق معين بالـ ID
export async function getBinById(id) {
  try {
    const res = await client.get(`/api/Bins/GetById`, {
      params: { id }
    });
    return normalizeObject(res.data);
  } catch (error) {
    console.error(`Error fetching bin with id ${id}:`, error);
    return null;
  }
}

// جلب إحصائيات الصناديق
export async function getBinStats() {
  const candidates = [
    '/api/Bins/GetStats', // الرابط الفعلي من الـ Swagger
    '/api/Bin/Stats',
  ];
  for (const path of candidates) {
    try {
      const res = await client.get(path);
      return normalizeObject(res.data) ?? res.data;
    } catch {}
  }
  return null;
}

/* ─── ASSIGNMENTS (shared with Unit API) ─── */

export async function getMyAssignments() {
  const res = await client.get('/api/ResponseUnit/my-assignments');
  return normalizeArray(res.data);
}

export async function getIncidentById(id) {
  const res = await client.get(`/api/Incident/${id}`);
  return normalizeObject(res.data);
}

export async function getIncidentsFeed() {
  const candidates = ['/api/Incident/my-incidents', '/api/Incident/List', '/api/Incident'];
  let lastError;
  for (const path of candidates) {
    try {
      const res = await client.get(path);
      return normalizeArray(res.data);
    } catch (e) { lastError = e; }
  }
  if (lastError) throw lastError;
  return [];
}

export async function getWaitingIncidents() {
  const res = await client.get('/api/ResponseUnit/my-assignments');
  return normalizeArray(res.data);
}

export async function manualAssignIncident({ incidentId, unitId } = {}) {
  const res = await client.post('/api/Monitoring/manual-assign', { incidentId, unitId });
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