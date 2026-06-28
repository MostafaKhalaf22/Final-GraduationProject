import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

// Admin Imports
import SignIn from './Dashboard/Sign in/Sign in.jsx';
import CreateAccount from './Dashboard/CreateAccount/CreateAccount.jsx';
import Dashboard from './Dashboard/DashboardView/Dashboard';
import EmergencyUnits from './Dashboard/EmergencyUnits/EmergencyUnits.jsx';
import AddUnit from './Dashboard/AddUnit/AddUnit.jsx';
import ProfileSetting from './Dashboard/Settings/ProfileSetting.jsx';
import AdminManagement from './Dashboard/AdminManagement/AdminManagement.jsx';
import SystemSettings from './Dashboard/SystemSettings/SystemSettings.jsx';
import CreateRole from './Dashboard/CreateRole/CreateRole.jsx';

// Unit Imports
import UnitSignIn from './DashboardUnit/UnitSignIn/UnitSignIn.jsx';
import UnitDashboard from './DashboardUnit/UnitDashboardView/UnitDashboardView.jsx';
import UnitIncidentDetail from './DashboardUnit/UnitIncidentDetail/UnitIncidentDetail.jsx';
import UnitSettings from './DashboardUnit/UnitSettings/UnitSettings.jsx';
import ProfilePage from './DashboardUnit/ProfilePage/ProfilePage.jsx';

// Bin Imports
import BinSignIn from './DashboardBin/BinSignIn/BinSignIn.jsx'; 
import BinDashboard from './DashboardBin/BinDashboardView/BinDashboardView.jsx';
import BinHome from './DashboardBin/BinDashboardView/BinHome/BinHome.jsx';
import BinDetail from './DashboardBin/BinDetail Page/BinDetail.jsx';
import BinMap from './DashboardBin/BinMap Page/BinMap.jsx';
import BinReports from './DashboardBin/BinReports Page/BinReports.jsx';
import BinLayout from './DashboardBin/BinLayout/BinLayout.jsx';
import BinSettings from './DashboardBin/BinSettings/BinSettings.jsx';
import BinProfile from './DashboardBin/BinProfile/BinProfile.jsx';
import './App.css';

/* ─── ProtectedBin: redirects to login if no binToken ─── */
function ProtectedBin({ children }) {
  const token = localStorage.getItem('binToken');
  if (!token) return <Navigate to="/bin/login" replace />; 
  return children;
}

/* ─── ProtectedUnit: redirects to login if no unitToken ─── */
function ProtectedUnit({ children }) {
  const token = localStorage.getItem('unitToken');
  if (!token) return <Navigate to="/unit/login" replace />;
  return children;
}

function App() {
  const [adminUser, setAdminUser] = useState({
    firstName: localStorage.getItem('adminFirstName') || localStorage.getItem('adminName') || 'Admin',
    lastName: localStorage.getItem('adminLastName') || 'User',
    email: localStorage.getItem('adminEmail') || 'admin@smartcity.com',
    phoneNumber: localStorage.getItem('adminPhone') || '+1 (555) 123-4567',
    role: 'System Admin',
    bio: localStorage.getItem('adminBio') || '',
    profileImage: localStorage.getItem('adminImage') || null,
    sessions: [{ id: 1, device: 'Windows PC - Chrome', location: 'Egypt', time: 'Active Now', current: true }],
  });

  const [units, setUnits] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('unitsCache') || '[]');
      return Array.isArray(cached) ? cached : [];
    } catch { return []; }
  });
  const [loadingUnits, setLoadingUnits] = useState(true);

  const normalizeUnitsResponse = (data) => {
    const looksLikeUnitsArray = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return false;
      const sample = arr.find((x) => x && typeof x === 'object');
      if (!sample) return false;
      return ('name' in sample && ('id' in sample || 'unitId' in sample)) || ('id' in sample && 'type' in sample) || ('unitId' in sample && 'name' in sample);
    };
    const directCandidates = [data, data?.data, data?.data?.data, data?.data?.items, data?.data?.result, data?.result, data?.items, data?.responseUnits, data?.responseUnits?.data, data?.data?.responseUnits, data?.data?.responseUnits?.data];
    for (const c of directCandidates) {
      if (looksLikeUnitsArray(c)) return c;
    }
    const visited = new Set();
    const stack = [{ value: data, depth: 0 }];
    while (stack.length) {
      const { value, depth } = stack.pop();
      if (!value || typeof value !== 'object') continue;
      if (visited.has(value)) continue;
      visited.add(value);
      if (Array.isArray(value)) { if (looksLikeUnitsArray(value)) return value; continue; }
      if (depth >= 8) continue;
      for (const key of Object.keys(value)) {
        const next = value[key];
        if (next && typeof next === 'object') stack.push({ value: next, depth: depth + 1 });
        if (Array.isArray(next) && looksLikeUnitsArray(next)) return next;
      }
    }
    return [];
  };

  const fetchUnits = async () => {
    const token = localStorage.getItem('adminToken');
    const isUnitPath = window.location.pathname.startsWith('/unit') || window.location.pathname.startsWith('/bin');
    if (!token || isUnitPath) { setLoadingUnits(false); return; }
    const cachedUnits = (() => { try { const c = JSON.parse(localStorage.getItem('unitsCache') || '[]'); return Array.isArray(c) ? c : []; } catch { return []; } })();
    localStorage.removeItem('unitsCache');
    try {
      setLoadingUnits(true);
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 800));
        const response = await axios.get('/api/admin/response-units/List', {
          headers: { Authorization: `Bearer ${token}`, Accept: '*/*', 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' },
          params: { _t: Date.now() },
        });
        const normalized = normalizeUnitsResponse(response.data);
        if (Array.isArray(normalized) && normalized.length > 0) { setUnits(normalized); localStorage.setItem('unitsCache', JSON.stringify(normalized)); return; }
        if (attempt === 1) { setUnits([]); localStorage.setItem('unitsCache', JSON.stringify([])); }
      }
    } catch (error) {
      console.error('FetchUnits Error:', error);
      if (cachedUnits.length > 0) setUnits(cachedUnits);
    } finally { setLoadingUnits(false); }
  };

  useEffect(() => {
    const isUnitLogin = window.location.pathname === '/unit/login';
    const isBinLogin = window.location.pathname === '/bin/login'; 
    const isMainLogin = window.location.pathname === '/';
    if (!isUnitLogin && !isBinLogin && !isMainLogin) fetchUnits(); 
  }, []);

  const updateAdmin = (newData) => {
    setAdminUser((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('adminFirstName', updated.firstName);
      localStorage.setItem('adminEmail', updated.email);
      return updated;
    });
  };

  const revokeSession = (sessionId) => {
    setAdminUser((prev) => ({ ...prev, sessions: prev.sessions.filter((s) => s.id !== sessionId) }));
  };

  const deleteUnit = async (id) => {
    const token = localStorage.getItem('adminToken');
    const targetUnit = units.find((u) => u.id === id);
    const result = await Swal.fire({ title: 'هل أنت متأكد؟', text: `سيتم حذف ${targetUnit?.name || 'الوحدة'} نهائياً!`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'نعم، احذف!', cancelButtonText: 'إلغاء' });
    if (!result.isConfirmed) return;
    try {
      const response = await axios.delete(`/api/admin/response-units/Delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.succeeded || response.status === 200) { setUnits((prev) => prev.filter((u) => u.id !== id)); Swal.fire('تم الحذف!', 'تمت إزالة الوحدة من النظام.', 'success'); return; }
    } catch {}
    try {
      await axios.delete(`/api/AppUser/Delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUnits((prev) => prev.filter((u) => u.id !== id));
      Swal.fire('تم الحذف!', 'تمت إزالة السجل بنجاح.', 'success');
    } catch (error) {
      if (error.response?.status === 404) { setUnits((prev) => prev.filter((u) => u.id !== id)); Swal.fire('تحديث', 'لم يتم العثور على العنصر في السيرفر، تم تحديث الواجهة.', 'info'); }
      else Swal.fire('خطأ', 'فشلت عملية الحذف، تأكد من اتصالك بالسيرفر.', 'error');
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin */}
        <Route path="/" element={<SignIn />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/dashboard" element={<Dashboard units={units} admin={adminUser} />} />
        <Route path="/units" element={<EmergencyUnits units={units} onDelete={deleteUnit} admin={adminUser} />} />
        <Route path="/add-unit" element={<AddUnit onAdd={fetchUnits} admin={adminUser} />} />
        <Route path="/admin-management" element={<AdminManagement admin={adminUser} />} />
        <Route path="/create-role" element={<CreateRole admin={adminUser} />} />
        <Route path="/settings" element={<SystemSettings admin={adminUser} />} />
        <Route path="/profile" element={<ProfileSetting admin={adminUser} onUpdate={updateAdmin} onRevoke={revokeSession} />} />

        {/* Unit */}
        <Route path="/unit/login" element={<UnitSignIn />} /> 
        <Route path="/unit/dashboard" element={<ProtectedUnit><UnitDashboard /></ProtectedUnit>} />
        <Route path="/unit/incident-detail" element={<ProtectedUnit><UnitIncidentDetail /></ProtectedUnit>} />
        <Route path="/unit/incident-detail/:id" element={<ProtectedUnit><UnitIncidentDetail /></ProtectedUnit>} />
        <Route path="/unit/settings" element={<ProtectedUnit><UnitSettings /></ProtectedUnit>} />
        <Route path="/unit/profile" element={<ProfilePage />} />

<Route path="/bin/login" element={<BinSignIn />} />

{/* Bin Collector Dashboard */}
<Route path="/bin" element={<ProtectedBin><BinLayout /></ProtectedBin>}>
  <Route index element={<BinHome />} />  
  <Route path="home" element={<BinHome />} />
  <Route path="map" element={<BinMap />} />
  <Route path="reports" element={<BinReports />} />
    <Route path="profile" element={<BinProfile />} /> 

    <Route path="settings" element={<BinSettings />} /> 

  <Route path="detail/:id" element={<BinDetail />} />
</Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;