import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MapPin, Phone, Shield, AlertTriangle, 
  Clock, Radio, Bell, Settings, User, Search, Navigation,
  LayoutGrid, FileText, Activity, Layers3, LogOut, Video, Info, Copy, Download, ShieldAlert, Cpu, CheckCheck, Trash2, Loader2, ChevronRight, Zap, ExternalLink, Filter
} from 'lucide-react';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  getMyAssignments,
  acceptAssignment,
  rejectAssignment,
  arriveAtScene,
  completeAssignment,
  getMyProfile,
} from '../../api/unitApi';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ─── Neighborhood resolver ──────────────────────────────── */
const getNeighborhoodFromCoords = (lat, lng) => {
  if (!lat || !lng) return null;
  const areas = [
    { name: 'New Cairo',      lat: 30.03,  lng: 31.47  },
    { name: 'Maadi',          lat: 29.96,  lng: 31.25  },
    { name: 'Zamalek',        lat: 30.065, lng: 31.22  },
    { name: 'Heliopolis',     lat: 30.09,  lng: 31.32  },
    { name: 'Nasr City',      lat: 30.065, lng: 31.34  },
    { name: 'Downtown Cairo', lat: 30.044, lng: 31.236 },
    { name: 'Giza',           lat: 29.99,  lng: 31.16  },
    { name: 'Dokki',          lat: 30.035, lng: 31.21  },
    { name: 'Ismailia',       lat: 30.60,  lng: 32.27  },
    { name: 'Port Said',      lat: 31.25,  lng: 32.28  },
    { name: 'Suez',           lat: 29.97,  lng: 32.54  },
    { name: 'Alexandria',     lat: 31.2,   lng: 29.92  },
  ];
  let closest = null, minDist = Infinity;
  for (const a of areas) {
    const d = Math.sqrt((lat - a.lat) ** 2 + (lng - a.lng) ** 2);
    if (d < minDist) { minDist = d; closest = a; }
  }
  return closest && minDist < 0.5 ? closest.name : null;
};

function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
    }
  }, [lat, lng, map]);
  return null;
}


const MedicalPdfButton = ({ pdfPath }) => {
  if (!pdfPath) return null;

  const handleOpen = () => {
    // بنبني الـ absolute URL يدويًا
    const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    const path = pdfPath.startsWith('/') ? pdfPath : `/${pdfPath}`;
    const fullUrl = `${base}${path}`;
    // window.open بيفتح في تاب جديدة خارج React Router تمامًا
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleOpen}
      className="inline-flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 hover:text-blue-300 text-[11px] font-black uppercase px-4 py-2 rounded-xl transition-all duration-200 mt-2"
    >
      <FileText size={13} />
      Open Medical PDF
      <ExternalLink size={11} className="opacity-60" />
    </button>
  );
};

const UnitDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [queueSource] = useState('assignments');

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const [userData, setUserData] = useState({
    name: localStorage.getItem('unitName') || 'Unit',
    role: 'Response Unit',
    status: 'online',
  });

  const EMPTY_INCIDENT = {
    id: '#N/A',
    type: 'No Active Incident',
    priority: '-',
    location: 'No active assignment',
    source: '-',
    time: '--:--',
    severity: '-',
    coordinates: '--',
    lat: 30.0444,
    lng: 31.2357,
    timer: '--:--:--',
    description: '',
    subject: {
      name: '-',
      phone: 'Unknown',
      hasMedicalInfo: false,
      medicalInfoPdfUrl: null,
    },
  };

  const [selectedIncident, setSelectedIncident] = useState(EMPTY_INCIDENT);

  const neighborhoodName = getNeighborhoodFromCoords(selectedIncident.lat, selectedIncident.lng);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('incident-detail')) setActiveTab('INCIDENT DETAIL');
    else if (path.includes('settings')) setActiveTab('SETTINGS');
    else setActiveTab('DASHBOARD');
  }, [location.pathname]);

  useEffect(() => {
    const loadProfileHeader = async () => {
      try {
        const data = await getMyProfile();
        if (!data) return;
        const name =
          data.fullName ||
          [data.firstName, data.lastName].filter(Boolean).join(' ') ||
          localStorage.getItem('unitName') ||
          'Unit';
        const role = data.role || data.title || 'Response Unit';
        setUserData((prev) => ({ ...prev, name, role }));
      } catch {
      }
    };
    loadProfileHeader();
  }, []);

  const normalizeAssignmentForUI = (x) => {
    if (!x || typeof x !== 'object') return x;
    const incidentId = x.incidentId ?? x.incidentID ?? x.incident_id ?? x.id ?? x.incident?.id ?? null;
    const citizen = x.citizenInfo || {};
    return {
      ...x,
      incidentId,
      id: x.assignmentId ?? x.id ?? incidentId,
      incidentType: x.incidentType ?? x.type ?? x.incident?.type ?? x.incidentTypeName ?? 'SOS Signal',
      locationName: x.incidentLocation ?? x.locationName ?? x.location ?? x.address ?? x.incident?.locationName ?? 'Location Unknown',
      priority: x.priority ?? x.severity ?? x.level ?? 'Normal',
      createdAt: x.assignedAt ?? x.createdAt ?? x.created_at ?? x.time ?? x.incident?.createdAt,
      latitude: parseFloat(x.incidentLatitude ?? x.latitude ?? x.lat ?? x.incident?.latitude ?? '30.6211'),
      longitude: parseFloat(x.incidentLongitude ?? x.longitude ?? x.lng ?? x.incident?.longitude ?? '32.2741'),
      reporterName: citizen.fullName ?? x.reportedBy ?? x.reporterName ?? x.userName ?? x.createdBy ?? x.incident?.reporterName,
      reporterPhone: citizen.phoneNumber ?? x.reporterPhone ?? x.phone ?? x.incident?.reporterPhone,
      description: x.incidentDescription ?? x.description ?? x.details ?? x.incident?.description,
      status: x.incidentStatus ?? x.status ?? x.incident?.status,
      // Medical info — الباكإند بيبعت path من citizenInfo أو root
      hasMedicalInfo: citizen.hasMedicalInfo ?? x.hasMedicalInfo ?? false,
      medicalInfoPdfUrl: citizen.medicalInfoPdfUrl ?? x.medicalInfoPdfUrl ?? null,
    };
  };

  const getIncidentRouteId = (item) => {
    if (!item) return '';
    const n = item.incidentId ?? item.id;
    return n != null && n !== '' ? String(n) : '';
  };

  const navigateToIncidentDetail = (assignmentOverride) => {
    const item = assignmentOverride || getSelectedAssignment() || assignments[0];
    const rid = getIncidentRouteId(item);
    if (rid) navigate(`/unit/incident-detail/${rid}`, { state: { assignment: item } });
    else navigate('/unit/dashboard');
  };

  const getSelectedAssignment = () => {
    const selectedId = selectedIncident.id.replace('#', '');
    return assignments.find(
      (a) =>
        String(a.incidentId ?? '') === selectedId ||
        String(a.assignmentId ?? '') === selectedId ||
        String(a.id ?? '') === selectedId
    );
  };

  const updateSelectedIncident = (data) => {
    if (!data) {
      setSelectedIncident(EMPTY_INCIDENT);
      return;
    }
    const u = normalizeAssignmentForUI(data);
    setSelectedIncident((prev) => ({
      ...prev,
      id: `#${u.incidentId ?? u.id ?? 'N/A'}`,
      type: u.incidentType || 'SOS Signal',
      priority: u.priority || 'Normal',
      location: u.locationName || 'Location Unknown',
      time: u.createdAt ? new Date(u.createdAt).toLocaleTimeString() : prev.time,
      coordinates: `${u.latitude}° N, ${u.longitude}° E`,
      lat: u.latitude,
      lng: u.longitude,
      source: u.source ?? (u.assignmentId ? `Assignment #${u.assignmentId}` : 'My Assignments'),
      description: u.description || '',
      subject: {
        ...prev.subject,
        name: u.reporterName || 'Anonymous',
        phone: u.reporterPhone || 'Unknown',
        hasMedicalInfo: u.hasMedicalInfo || false,
        medicalInfoPdfUrl: u.medicalInfoPdfUrl || null,
      },
    }));
  };

  useEffect(() => {
    let disposed = false;

    const fetchAssignments = async (withLoading = false) => {
      if (withLoading) setLoading(true);
      try {
        const res = await getMyAssignments();

        let rawList = [];
        if (Array.isArray(res)) {
          rawList = res;
        } else if (res && res.data) {
          rawList = Array.isArray(res.data) ? res.data : [res.data];
        } else if (res && typeof res === 'object') {
          rawList = [res];
        }

        const apiAssignments = rawList.map(normalizeAssignmentForUI).filter(Boolean);

        if (disposed) return;

        setAssignments(apiAssignments);

        if (apiAssignments.length > 0 && selectedIncident.id === '#N/A') {
          updateSelectedIncident(apiAssignments[0]);
        }
      } catch (err) {
        console.error('API Error', err);
      } finally {
        if (withLoading) setLoading(false);
      }
    };

    fetchAssignments(true);
    const intervalId = setInterval(() => fetchAssignments(false), 5000);

    return () => {
      disposed = true;
      clearInterval(intervalId);
    };
  }, []);

  const runAssignmentAction = async (action) => {
    const selectedAssignment = getSelectedAssignment();
    const incidentIdRaw =
      selectedAssignment?.incidentId ?? selectedAssignment?.id ?? selectedIncident.id.replace('#', '');
    const incidentId = Number(incidentIdRaw);
    if (!Number.isInteger(incidentId) || incidentId <= 0) return;
    try {
      setActionLoading(action);
      if (action === 'accept') await acceptAssignment({ incidentId });
      if (action === 'arrive') await arriveAtScene({ incidentId });
      if (action === 'complete') await completeAssignment({ incidentId, notes: 'Completed from unit dashboard' });
      if (action === 'reject') await rejectAssignment({ incidentId });

      const refreshedRaw = await getMyAssignments();
      const refreshed = Array.isArray(refreshedRaw)
        ? refreshedRaw.map(normalizeAssignmentForUI)
        : [];
      setAssignments(refreshed);
      if (refreshed.length > 0) {
        const nextSelected = refreshed.find(
          (r) => String(r.incidentId ?? r.id) === String(incidentId)
        );
        updateSelectedIncident(nextSelected || refreshed[0]);
      } else {
        updateSelectedIncident(null);
      }
    } catch (err) {
      const backendMsg = err?.response?.data?.message || 'Request failed';
      window.alert(`${action.toUpperCase()} failed: ${backendMsg}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/unit/login');
  };

  const getInitials = (name) => {
    if (!name || name === '-') return 'AN';
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isActionDisabled = (action) =>
    !!actionLoading || !selectedIncident.id || selectedIncident.id === '#N/A';

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans flex-col">

      {/* --- Header --- */}
      <header className="h-[75px] bg-[#020617] border-b border-slate-800/40 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="bg-[#1d4ed8] p-2 rounded-lg shadow-[0_0_15px_rgba(29,78,216,0.2)]">
              <Shield className="text-white fill-white/10" size={22} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[14px] font-[900] text-white leading-none tracking-tight uppercase italic">
                Emergency Response Command
              </h1>
              <p className="text-[9px] text-slate-500 mt-1 font-bold tracking-tighter uppercase opacity-60">
                FCI Suez Canal University • Lead Front-End
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 bg-[#0a0f1e]/60 p-1.5 rounded-[14px] border border-slate-800/30">
            {[
              { name: 'DASHBOARD', path: '/unit/dashboard' },
              { name: 'INCIDENT DETAIL', path: null },
            ].map((tab) => (
              <button
                key={tab.name}
                onClick={() => {
                  if (tab.name === 'INCIDENT DETAIL') {
                    navigateToIncidentDetail();
                    return;
                  }
                  setActiveTab(tab.name);
                  if (tab.path) navigate(tab.path);
                }}
                className={`relative h-[42px] px-6 rounded-[11px] text-[10.5px] font-black tracking-[0.12em] transition-all duration-300 flex items-center gap-3 ${
                  activeTab === tab.name
                    ? 'bg-[#1e293b]/60 border border-slate-700/50 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {activeTab === tab.name && (
                  <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full shadow-[0_0_10px_#3b82f6] animate-pulse"></span>
                )}
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-[10px] font-mono text-slate-600 font-black tracking-tight hidden xl:block uppercase">
            {currentTime.toLocaleTimeString()} •{' '}
            {currentTime
              .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              .toUpperCase()}
          </div>
          <div className="flex items-center gap-4 border-l border-slate-800/80 pl-6 h-8">
            <button
              onClick={() => navigate('/unit/settings')}
              className="p-2 text-slate-500 hover:text-white"
            >
              <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="p-2 text-red-600/70 hover:text-red-500">
              <LogOut size={18} />
            </button>
            <button
              onClick={() => navigate('/unit/profile')}
              className="flex items-center gap-3 ml-2 group cursor-pointer"
            >
              <div className="text-right">
                <p className="text-[11px] font-black text-white leading-none">{userData.name}</p>
                <p className="text-[9px] text-slate-600 mt-1 font-bold uppercase">{userData.role}</p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===================== DASHBOARD TAB ===================== */}
        {activeTab === 'DASHBOARD' && (
          <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500">

            {/* Sidebar Alert Queue */}
            <div className="w-80 bg-[#0f172a]/40 border-r border-slate-800 flex flex-col">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Alert Queue
                </h2>
                <span className="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded font-black">
                  {loading ? '...' : `${assignments.length} ACTIVE`}
                </span>
              </div>

              {!loading && (
                <div className="px-5 pt-4">
                  <span
                    className={`inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border
                    ${
                      queueSource === 'assignments'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {queueSource === 'assignments' ? 'My Assignments' : 'Incident Feed'}
                  </span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center p-10">
                    <Loader2 className="animate-spin text-blue-500" />
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40 pt-20">
                    <Shield size={48} className="text-slate-700" />
                    <div className="text-center">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                        All Clear
                      </p>
                      <p className="text-[10px] text-slate-700 mt-1 font-medium">
                        No active assignments
                      </p>
                    </div>
                  </div>
                ) : (
                  assignments.map((item) => (
                    <div
                      key={String(item.assignmentId ?? item.incidentId ?? item.id)}
                      className={`p-4 border-l-4 ${
                        String(item.incidentId ?? item.id) === selectedIncident.id.replace('#', '')
                          ? 'border-blue-500 bg-blue-900/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                          : 'border-red-600 bg-red-900/10'
                      } rounded-xl cursor-pointer hover:brightness-125 transition-all group`}
                      onClick={() => updateSelectedIncident(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-[13px] font-bold text-white group-hover:text-blue-400 uppercase">
                          {item.incidentType || 'SOS Signal'}
                        </h3>
                        <span className="text-[9px] bg-red-600 text-white px-1.5 rounded uppercase font-black italic">
                          {String(item.status || 'Active')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-3 font-medium uppercase tracking-wide truncate">
                        {item.locationName || 'Area Unspecified'}
                      </p>
                      <div className="flex items-center text-[10px] text-slate-600 font-mono">
                        <Clock size={12} className="mr-2" />
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : '--:--'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 bg-[#020617] p-6 relative">
              <div className="w-full h-full rounded-[32px] overflow-hidden border border-slate-800 bg-slate-900/20 relative shadow-2xl z-0">
                <MapContainer
                  center={[selectedIncident.lat, selectedIncident.lng]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  {selectedIncident.id !== '#N/A' && (
                    <Marker position={[selectedIncident.lat, selectedIncident.lng]}>
                      <Popup>
                        <div className="text-black font-bold uppercase text-[10px]">
                          {selectedIncident.type} <br /> {selectedIncident.id}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  <RecenterAutomatically lat={selectedIncident.lat} lng={selectedIncident.lng} />
                </MapContainer>

                <div className="absolute bottom-10 left-10 z-[1000] bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl max-w-xs pointer-events-none">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                    <span className="text-[10px] font-black text-white uppercase">
                      Live Sensor Tracking
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase leading-tight">
                    Unit synchronization active via SignalR Cluster.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Details Panel */}
            <div className="w-[400px] bg-[#0f172a]/50 border-l border-slate-800 p-8 flex flex-col">
              <div className="mb-8">
                <h2 className="text-4xl font-black text-white mb-3 tracking-tighter italic leading-none">
                  {selectedIncident.type}
                </h2>
                <p className="text-[11px] text-slate-500 font-mono uppercase">
                  ID: {selectedIncident.id} • SOURCE: {selectedIncident.source}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-2">
                  {selectedIncident.coordinates}
                </p>

                {neighborhoodName && selectedIncident.id !== '#N/A' && (
                  <div className="mt-3 flex items-center gap-2">
                    <MapPin size={13} className="text-[#00d4aa] flex-shrink-0" />
                    <span
                      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                      className="text-[#00d4aa] text-[14px] font-semibold italic tracking-wide"
                    >
                      {neighborhoodName}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4 mt-auto">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    disabled={isActionDisabled('accept')}
                    onClick={() => runAssignmentAction('accept')}
                    className="bg-[#1e293b] hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-[11px] uppercase border border-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'accept' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Shield size={16} />
                    )}
                    {actionLoading === 'accept' ? 'Accepting...' : 'Accept'}
                  </button>

                  <button
                    disabled={isActionDisabled('arrive')}
                    onClick={() => runAssignmentAction('arrive')}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-[11px] uppercase shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'arrive' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Navigation size={16} />
                    )}
                    {actionLoading === 'arrive' ? 'Updating...' : 'Arrive'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    disabled={isActionDisabled('complete')}
                    onClick={() => runAssignmentAction('complete')}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-[11px] uppercase shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 col-span-2"
                  >
                    {actionLoading === 'complete' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCheck size={16} />
                    )}
                    {actionLoading === 'complete' ? 'Completing...' : 'Complete'}
                  </button>
                </div>

                <button
                  disabled={isActionDisabled('reject')}
                  onClick={() => runAssignmentAction('reject')}
                  className="w-full bg-rose-600/10 text-rose-400 py-4 rounded-2xl font-black text-[11px] border border-rose-600/30 uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'reject' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {actionLoading === 'reject' ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== INCIDENT DETAIL TAB ===================== */}
        {activeTab === 'INCIDENT DETAIL' && (
          <div className="flex-1 flex overflow-hidden animate-in slide-in-from-right duration-500">
            <aside className="w-80 bg-[#0f172a]/50 border-r border-slate-800 p-8 flex flex-col">
              <div className="mb-10">
                <span className="bg-blue-600/20 text-blue-400 text-[10px] px-3 py-1 rounded font-black uppercase tracking-widest mb-4 inline-block">
                  Active Investigation
                </span>
                <h2 className="text-5xl font-black text-white tracking-tighter italic">
                  {selectedIncident.id}
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-bold uppercase">
                  {selectedIncident.type}
                </p>
              </div>
              <div className="mt-auto space-y-6">
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-3">Unit Status</p>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                    <span className="text-white font-bold text-sm uppercase italic">
                      Deployed & Active
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#020617] p-12">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">
                    Incident Evidence Log
                  </h1>
                  <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs opacity-70">
                    Complete forensics and reporting data
                  </p>
                </div>
                <button className="bg-[#1d4ed8] text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 shadow-xl transition-all">
                  <Download size={18} /> Generate PDF Report
                </button>
              </div>

              <div className="grid grid-cols-1 gap-8">

                {/* Subject Profile */}
                <div className="bg-[#0f172a]/50 border border-slate-800 p-10 rounded-[40px] shadow-2xl">
                  <div className="flex items-center gap-4 mb-10 text-blue-500 text-xs font-black uppercase tracking-[0.2em]">
                    <Info size={20} /> Subject Profile
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="w-32 h-32 rounded-[32px] border-4 border-slate-800 bg-blue-900/30 flex items-center justify-center shadow-2xl flex-shrink-0">
                      <span className="text-3xl font-black text-blue-400 uppercase">
                        {getInitials(selectedIncident.subject.name)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-20 flex-1">
                      <div>
                        <p className="text-[10px] text-slate-600 uppercase font-black mb-2">
                          Full Identity
                        </p>
                        <p className="text-2xl font-bold text-white tracking-tight italic">
                          {selectedIncident.subject.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-600 uppercase font-black mb-2">
                          Contact Method
                        </p>
                        <p className="text-2xl font-mono text-blue-500 font-bold tracking-tight">
                          {selectedIncident.subject.phone}
                        </p>
                      </div>

                      {/* Medical Info */}
                      <div className="col-span-2">
                        <p className="text-[10px] text-slate-600 uppercase font-black mb-2">
                          Medical Info
                        </p>
                        {selectedIncident.subject.hasMedicalInfo && selectedIncident.subject.medicalInfoPdfUrl ? (
                          <div className="flex flex-col gap-2">
                            <span className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] px-3 py-1 rounded-full font-black uppercase w-fit">
                              ✓ Medical Info Available
                            </span>
                            <MedicalPdfButton pdfPath={selectedIncident.subject.medicalInfoPdfUrl} />
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/40 text-slate-500 text-[10px] px-3 py-1 rounded-full font-black uppercase w-fit">
                            No Medical Info
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Geospatial Data */}
                <div className="bg-[#0f172a]/50 border border-slate-800 p-10 rounded-[40px]">
                  <div className="flex items-center gap-4 mb-10 text-blue-500 text-xs font-black uppercase tracking-[0.2em]">
                    <MapPin size={20} /> Geospatial Data
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800">
                      <p className="text-[10px] text-slate-600 font-black mb-2 uppercase">
                        Current Address
                      </p>
                      <div className="flex flex-col gap-1">
                        <span className="text-xl font-bold text-white uppercase italic">
                          {selectedIncident.location}
                        </span>
                        {neighborhoodName && selectedIncident.id !== '#N/A' && (
                          <span className="text-[#00d4aa] text-sm font-semibold italic">
                            {neighborhoodName} Area
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 font-mono">
                      <p className="text-[10px] text-slate-600 font-black mb-2 uppercase">
                        GPS Locked At
                      </p>
                      <span className="text-lg text-emerald-500 font-bold">
                        {selectedIncident.coordinates}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedIncident.description && (
                  <div className="bg-[#0f172a]/50 border border-slate-800 p-10 rounded-[40px]">
                    <div className="flex items-center gap-4 mb-6 text-blue-500 text-xs font-black uppercase tracking-[0.2em]">
                      <FileText size={20} /> Incident Description
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed font-medium">
                      {selectedIncident.description}
                    </p>
                  </div>
                )}

              </div>
            </main>
          </div>
        )}

        {/* ===================== TIMELINE TAB ===================== */}
        {activeTab === 'TIMELINE' && (
          <div className="flex-1 overflow-y-auto bg-[#020617] p-16 animate-in fade-in duration-500">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-5xl font-black text-white mb-16 tracking-tighter uppercase italic">
                Mission Timeline
              </h2>
              <div className="relative border-l-2 border-slate-800 pl-12 space-y-16 py-4">
                {[
                  {
                    time: '10:02 AM',
                    event: 'Initial SOS Signal Captured',
                    desc: 'IoT Cluster 4 detected Class-B severity impact at 4th Ave.',
                    icon: <Zap />,
                  },
                  {
                    time: '10:04 AM',
                    event: 'Unit #16 Dispatch Acknowledgement',
                    desc: 'Officer M. Mahmoud confirmed mission parameters.',
                    icon: <Shield />,
                  },
                  {
                    time: '10:05 AM',
                    event: 'Visual Surveillance Established',
                    desc: 'CCTV feed routed to main dashboard.',
                    icon: <Video />,
                  },
                  {
                    time: '10:08 AM',
                    event: 'Scene Arrival Initiated',
                    desc: 'Unit proximity < 500m to incident origin.',
                    icon: <Navigation />,
                  },
                ].map((item, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[61px] top-0 bg-[#020617] p-2 border-2 border-slate-800 rounded-xl text-blue-500">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase mb-2 block">
                      {item.time}
                    </span>
                    <h4 className="text-xl font-bold text-white mb-2 italic uppercase">
                      {item.event}
                    </h4>
                    <p className="text-slate-500 text-sm font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitDashboard;