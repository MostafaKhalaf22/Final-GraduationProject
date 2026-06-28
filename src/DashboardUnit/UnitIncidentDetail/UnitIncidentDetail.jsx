import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Shield, Settings, LogOut,
  MapPin, Phone, Info, Loader2, User,
  ExternalLink, FileText, ImageIcon
} from 'lucide-react';
import { getMyAssignments, getMyProfile } from '../../api/unitApi';

// ─── Helpers ────────────────────────────────────────────────────────────────

const API_BASE_URL = '';

function isImageUrl(url) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}

function buildFullUrl(relativeOrAbsolute) {
  if (!relativeOrAbsolute) return null;
  // لو الـ URL كامل (يبدأ بـ http أو https) نرجعه زي ما هو
  if (/^https?:\/\//i.test(relativeOrAbsolute)) return relativeOrAbsolute;
  // غير كده نضيف الـ base URL
  return `${API_BASE_URL}${relativeOrAbsolute}`;
}

function mapRawAssignmentToIncidentData(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id  = raw.assignmentId || raw.incidentId || raw.id;
  const lat = raw.incidentLatitude  || raw.latitude;
  const lng = raw.incidentLongitude || raw.longitude;
  const citizen = raw.citizenInfo || {};

  return {
    id:        `#${id ?? 'N/A'}`,
    status:    String(raw.status || raw.incidentStatus || 'Assigned').toUpperCase(),
    severity:  raw.priority || 'HIGH PRIORITY',
    type:      raw.incidentType || raw.type || 'Emergency Call',
    timestamp: raw.assignedAt ? new Date(raw.assignedAt).toLocaleString() : 'N/A',
    source:    raw.unitName   || raw.source || 'Response Unit',

    subject: {
      name:              citizen.fullName          || raw.reportedBy    || 'Emergency Caller',
      phone:             citizen.phoneNumber       || raw.reporterPhone || '911 Source',
      nationalId:        citizen.nationalId        || null,
      hasMedicalInfo:    citizen.hasMedicalInfo    || false,
      medicalInfoPdfUrl: citizen.medicalInfoPdfUrl || null,
    },

    description: raw.incidentDescription || raw.description || '',

    location: {
      sector:      raw.incidentLocation   || `${lat ?? 0}, ${lng ?? 0}`,
      district:    raw.incidentDescription || 'Address data pending...',
      coordinates: `${lat ?? 0}° N, ${lng ?? 0}° E`,
    },

    assignment: {
      assignmentId: raw.assignmentId ?? null,
      incidentId:   raw.incidentId   ?? null,
      status:       raw.status       || 'N/A',
      assignedAt:   raw.assignedAt   ? new Date(raw.assignedAt).toLocaleString()  : 'N/A',
      acceptedAt:   raw.acceptedAt   ? new Date(raw.acceptedAt).toLocaleString()  : 'N/A',
      completedAt:  raw.completedAt  ? new Date(raw.completedAt).toLocaleString() : 'N/A',
      responseTime: raw.responseTime ?? 'N/A',
      totalTime:    raw.totalTime    ?? 'N/A',
    },
  };
}

function matchesAssignmentId(item, needle) {
  if (needle == null || needle === '' || needle === 'undefined') return false;
  const n = String(needle);
  return (
    String(item.assignmentId ?? '') === n ||
    String(item.incidentId   ?? '') === n ||
    String(item.id           ?? '') === n
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const UnitIncidentDetail = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { id: paramId } = useParams();

  const [incidentData, setIncidentData] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const [userData, setUserData] = useState({
    name: localStorage.getItem('unitName') || 'Unit',
    role: 'Response Unit',
  });

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
        setUserData({ name, role });
      } catch {
        // fallback to localStorage
      }
    };
    loadProfileHeader();
  }, []);

  useEffect(() => {
    const stateAssignment = location.state?.assignment;

    const fetchIncidentDetail = async () => {
      const urlId   = paramId && paramId !== 'undefined' ? String(paramId) : '';
      const stateId =
        location.state?.incidentId != null
          ? String(location.state.incidentId)
          : stateAssignment
            ? String(stateAssignment.incidentId ?? stateAssignment.assignmentId ?? stateAssignment.id ?? '')
            : '';

      if (!urlId && stateAssignment) {
        const mapped = mapRawAssignmentToIncidentData(stateAssignment);
        if (mapped) { setIncidentData(mapped); setError(null); }
        else setError('Invalid assignment data.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const assignments = await getMyAssignments();

        const targetId = urlId || stateId;
        let currentIncident = targetId
          ? assignments.find((item) => matchesAssignmentId(item, targetId))
          : null;

        if (!currentIncident && assignments.length > 0) currentIncident = assignments[0];

        if (currentIncident) {
          setIncidentData(mapRawAssignmentToIncidentData(currentIncident));
        } else {
          setError('Incident not found in your assignments.');
        }
      } catch (err) {
        console.error('API Error:', err);
        setError('Failed to load incident details.');
        if (err.response?.status === 401) navigate('/unit/login');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidentDetail();
  }, [paramId, navigate, location.key]);

  const handleTabClick = (tab) => {
    const routeId =
      (paramId && paramId !== 'undefined' ? paramId : '') ||
      (incidentData?.id ? String(incidentData.id).replace(/^#/, '') : '');

    const paths = {
      Dashboard:         '/unit/dashboard',
      'Incident Detail': routeId ? `/unit/incident-detail/${routeId}` : '/unit/dashboard',
    };
    if (paths[tab]) navigate(paths[tab]);
  };

  if (loading) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
      <p className="text-slate-500 font-black text-xs uppercase tracking-widest italic">Decrypting Incident Data...</p>
    </div>
  );

  if (error || !incidentData) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl">
        <p className="text-red-500 font-black uppercase text-xs mb-2 tracking-widest italic">System Error</p>
        <p className="text-white font-bold mb-6">{error || 'Data Stream Interrupted'}</p>
        <button onClick={() => navigate('/unit/dashboard')} className="text-blue-500 hover:text-blue-400 font-black text-xs uppercase tracking-tighter underline">
          Re-route to Dashboard
        </button>
      </div>
    </div>
  );

  const medicalUrl = incidentData.subject.medicalInfoPdfUrl;
  const hasFile    = incidentData.subject.hasMedicalInfo && medicalUrl;
  const isImage    = isImageUrl(medicalUrl);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans flex-col">

      {/* Header */}
      <header className="h-[75px] bg-[#020617] border-b border-slate-800/40 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="bg-[#1d4ed8] p-2 rounded-lg shadow-[0_0_15px_rgba(29,78,216,0.2)]">
              <Shield className="text-white fill-white/10" size={22} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[14px] font-[900] text-white leading-none tracking-tight uppercase italic">Emergency Response Command</h1>
              <p className="text-[9px] text-slate-500 mt-1 font-bold tracking-tighter uppercase opacity-60">FCI Suez Canal University • Lead Front-End</p>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 bg-[#0a0f1e]/60 p-1.5 rounded-[14px] border border-slate-800/30">
            {[
              { name: 'DASHBOARD',       clickKey: 'Dashboard'       },
              { name: 'INCIDENT DETAIL', clickKey: 'Incident Detail' },
            ].map((tab) => {
              const isActive = tab.name === 'INCIDENT DETAIL';
              return (
                <button
                  key={tab.name}
                  onClick={() => handleTabClick(tab.clickKey)}
                  className={`relative h-[42px] px-6 rounded-[11px] text-[10.5px] font-black tracking-[0.12em] transition-all duration-300 flex items-center gap-3 ${
                    isActive
                      ? 'bg-[#1e293b]/60 border border-slate-700/50 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full shadow-[0_0_10px_#3b82f6] animate-pulse" />
                  )}
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-[10px] font-mono text-slate-600 font-black tracking-tight hidden xl:block uppercase">
            {new Date().toLocaleTimeString()} • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
          </div>
          <div className="flex items-center gap-4 border-l border-slate-800/80 pl-6 h-8">
            <button onClick={() => navigate('/unit/settings')} className="p-2 text-slate-500 hover:text-white">
              <Settings size={18} />
            </button>
            <button onClick={() => { localStorage.clear(); navigate('/unit/login'); }} className="p-2 text-red-600/70 hover:text-red-500">
              <LogOut size={18} />
            </button>
            <button onClick={() => navigate('/unit/profile')} className="flex items-center gap-3 ml-2 cursor-pointer">
              <div className="text-right">
                <p className="text-[11px] font-black text-white leading-none">{userData.name}</p>
                <p className="text-[9px] text-slate-600 mt-1 font-bold uppercase">{userData.role}</p>
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-72 bg-[#0f172a] border-r border-slate-800 p-5 flex flex-col overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-600/20 text-blue-400 text-[9px] px-2 py-0.5 rounded font-black uppercase border border-blue-500/20">
                {incidentData.status}
              </span>
              <span className="bg-red-600/20 text-red-400 text-[9px] px-2 py-0.5 rounded font-black uppercase border border-red-500/20">
                {incidentData.severity}
              </span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">{incidentData.id}</h2>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">{incidentData.type}</p>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-800/50">
            <div>
              <h4 className="text-[10px] uppercase font-black text-slate-600 mb-4 tracking-widest flex items-center gap-2">
                <Info size={12} /> Incident Registry
              </h4>
              <div className="space-y-3 text-[11px]">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 uppercase">Incident ID:</span>
                  <span className="text-slate-300">{incidentData.assignment.incidentId ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 uppercase">Logged:</span>
                  <span className="text-slate-300">{incidentData.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main View */}
        <main className="flex-1 overflow-y-auto bg-[#020617] p-10 space-y-8">

          {/* Reporter Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] text-slate-600 uppercase font-black mb-5 tracking-widest flex items-center gap-2">
                <User size={11} /> Reporter Identification
              </p>
              <div className="grid grid-cols-2 gap-12">

                {/* Left — identity */}
                <div>
                  <p className="text-2xl font-black text-white tracking-tight">{incidentData.subject.name}</p>
                  <a
                    href={`tel:${incidentData.subject.phone}`}
                    className="text-blue-500 font-mono text-sm mt-3 flex items-center gap-2 hover:text-blue-400 w-fit transition-colors"
                  >
                    <Phone size={14} /> {incidentData.subject.phone}
                  </a>
                  {incidentData.subject.nationalId && (
                    <p className="text-[11px] text-slate-500 font-mono mt-2">
                      National ID: <span className="text-slate-300">{incidentData.subject.nationalId}</span>
                    </p>
                  )}
                </div>

                {/* Right — medical info */}
                <div className="flex flex-col gap-3 justify-center">
                  {hasFile ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] px-3 py-1 rounded-full font-black uppercase w-fit">
                        {isImage ? <ImageIcon size={11} /> : <FileText size={11} />}
                        {isImage ? 'Medical Image Available' : 'Medical PDF Available'}
                      </span>

                      <a
                        href={buildFullUrl(medicalUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 px-4 py-2 rounded-lg transition-all w-fit"
                      >
                        <ExternalLink size={12} />
                        {isImage ? 'Open Image' : 'Open PDF'}
                      </a>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/40 text-slate-500 text-[10px] px-3 py-1 rounded-full font-black uppercase w-fit">
                      No Medical Info
                    </span>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/5 blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] text-slate-600 uppercase font-black mb-5 tracking-widest flex items-center gap-2">
                <MapPin size={11} /> Location Data
              </p>
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Geo-Coordinates</p>
                  <p className="text-sm font-mono text-slate-300 flex items-center gap-2">
                    <MapPin size={14} className="text-red-500" /> {incidentData.location.coordinates}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2 uppercase font-black italic border-l-2 border-red-500 pl-2">
                    {incidentData.location.sector}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Incident Description</p>
                  <p className="text-white font-bold text-sm leading-relaxed">
                    "{incidentData.location.district}"
                  </p>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default UnitIncidentDetail;