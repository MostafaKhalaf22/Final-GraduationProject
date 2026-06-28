import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wifi, Search, Trash2, LogOut, Loader2, Navigation,
  Leaf, Activity, MapPin, CheckCircle2, X, Zap, ChevronRight,
  User, ArrowLeft,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getAllBins,
  getBinStats,
  getMyAssignments,
  acceptAssignment,
  arriveAtScene,
  completeAssignment,
  rejectAssignment,
  getMyProfile,
} from '../../api/binApi';

/* ─── helpers ─────────────────────────────────────────────── */
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 15, { animate: true, duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

const makeBinIcon = (active, full) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:44px;height:44px;border-radius:50%;
      background:${active ? '#14e842' : '#0a1628'};
      border:3px solid ${active ? '#14e842' : 'rgba(255,255,255,0.2)'};
      display:flex;align-items:center;justify-content:center;
      box-shadow:${active ? '0 0 0 8px rgba(20,232,66,0.2)' : '0 4px 14px rgba(0,0,0,0.4)'};
      ${active ? 'transform:scale(1.1);' : ''}
    "><span style="font-size:20px">🗑</span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

const EMPTY_BIN = {
  id: null,
  name: 'No bin selected',
  address: 'Select a bin on the map',
  fillLevel: 0,
  capacity: 100,
  status: 'Idle',
  lat: 30.0444,
  lng: 31.2357,
  incidentId: null,
};

function normalizeBin(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const lat = parseFloat(raw.latitude ?? raw.lat ?? raw.incidentLatitude);
  const lng = parseFloat(raw.longitude ?? raw.lng ?? raw.incidentLongitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const fill = Number(raw.fillLevel ?? raw.fillPercentage ?? raw.level ?? raw.capacityPercent ?? 0);
  return {
    id: raw.id ?? raw.binId ?? raw.deviceId,
    name: raw.name ?? raw.binName ?? raw.title ?? `Unit #${raw.id ?? '?'}`,
    address: raw.address ?? raw.location ?? raw.sector ?? raw.incidentLocation ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    fillLevel: Math.min(100, Math.max(0, fill)),
    capacity: raw.capacity ?? raw.maxCapacity ?? 100,
    status: raw.status ?? (fill >= 85 ? 'Full' : fill >= 50 ? 'Medium' : 'Available'),
    lat, lng,
    incidentId: raw.incidentId ?? null,
  };
}

function normalizeAssignment(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const lat = parseFloat(raw.incidentLatitude ?? raw.latitude ?? raw.lat);
  const lng = parseFloat(raw.incidentLongitude ?? raw.longitude ?? raw.lng);
  return {
    ...raw,
    incidentId: raw.incidentId ?? raw.id,
    assignmentId: raw.assignmentId ?? raw.id,
    incidentType: raw.incidentType ?? raw.type ?? 'Collection',
    locationName: raw.incidentLocation ?? raw.locationName ?? 'Unknown',
    reporterName: raw.reportedBy ?? raw.reporterName ?? 'System',
    status: raw.incidentStatus ?? raw.status ?? 'Assigned',
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    assignedAt: raw.assignedAt ?? raw.createdAt,
  };
}

function assignmentToBin(task) {
  if (!task?.lat || !task?.lng) return null;
  return normalizeBin({
    id: task.assignmentId ?? task.incidentId,
    name: task.incidentType || `Task #${task.incidentId}`,
    address: task.locationName,
    fillLevel: 95,
    latitude: task.lat,
    longitude: task.lng,
    incidentId: task.incidentId,
    status: task.status,
  });
}

function distanceLabel(meters) {
  if (!meters && meters !== 0) return null;
  if (meters < 1000) return `${Math.round(meters)} Meters`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── BinDashboard ─────────────────────────────────────────── */
const BinDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bins, setBins] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(EMPTY_BIN);
  const [search, setSearch] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('binName') || 'Collector');
  const [userPos, setUserPos] = useState(null);
  const [view, setView] = useState('map'); // 'map' | 'list'
  const [successMsg, setSuccessMsg] = useState('');

  /* geolocation */
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    );
  }, []);

  const filteredBins = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bins;
    return bins.filter(
      (b) =>
        String(b.name).toLowerCase().includes(q) ||
        String(b.address).toLowerCase().includes(q) ||
        String(b.id).includes(q)
    );
  }, [bins, search]);

  const nearestBin = useMemo(() => {
    if (!userPos || bins.length === 0) return null;
    let best = null, bestDist = Infinity;
    for (const b of bins) {
      const d = haversine(userPos.lat, userPos.lng, b.lat, b.lng);
      if (d < bestDist) { bestDist = d; best = b; }
    }
    return best ? { bin: best, dist: bestDist } : null;
  }, [userPos, bins]);

  const selectedDist = useMemo(() => {
    if (!userPos || !selected?.lat) return null;
    return haversine(userPos.lat, userPos.lng, selected.lat, selected.lng);
  }, [userPos, selected]);

  const selectBin = (bin, task = null) => {
    if (!bin) { setSelected(EMPTY_BIN); return; }
    setSelected({ ...bin, incidentId: task?.incidentId ?? bin.incidentId ?? null, taskStatus: task?.status ?? null });
  };

  const loadData = async (withSpinner = false) => {
    if (withSpinner) setLoading(true);
    try {
      const [binsRaw, tasksRaw, statsRaw] = await Promise.all([
        getAllBins().catch(() => []),
        getMyAssignments().catch(() => []),
        getBinStats().catch(() => null),
      ]);
      const tasks = tasksRaw.map(normalizeAssignment);
      const fromApi = binsRaw.map(normalizeBin).filter(Boolean);
      const fromTasks = tasks.map(assignmentToBin).filter(Boolean);
      const merged = [...fromApi];
      for (const t of fromTasks) {
        const exists = merged.some(
          (b) => String(b.id) === String(t.id) || (Math.abs(b.lat - t.lat) < 0.0001 && Math.abs(b.lng - t.lng) < 0.0001)
        );
        if (!exists) merged.push(t);
      }
      for (const bin of merged) {
        const task = tasks.find((t) => t.lat != null && Math.abs(t.lat - bin.lat) < 0.0005 && Math.abs(t.lng - bin.lng) < 0.0005);
        if (task) bin.incidentId = task.incidentId;
      }
      setBins(merged);
      setAssignments(tasks);
      setStats(statsRaw);
      setSelected((prev) => {
        if (prev.id) {
          const still = merged.find((b) => String(b.id) === String(prev.id));
          const linkedTask = tasks.find((t) => String(t.incidentId) === String(prev.incidentId));
          if (still) return { ...still, incidentId: linkedTask?.incidentId ?? still.incidentId ?? prev.incidentId, taskStatus: linkedTask?.status ?? prev.taskStatus };
        }
        if (merged.length > 0) {
          const firstTask = tasks[0] ?? null;
          return { ...merged[0], incidentId: firstTask?.incidentId ?? merged[0].incidentId ?? null, taskStatus: firstTask?.status ?? null };
        }
        return EMPTY_BIN;
      });
    } catch (err) {
      if (err.response?.status === 401) navigate('/unit/login');
    } finally {
      if (withSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('binToken') || localStorage.getItem('unitToken');
    if (!token) { navigate('/unit/login', { replace: true }); return; }
    loadData(true);
    const id = setInterval(() => loadData(false), 7000);
    return () => clearInterval(id);
  }, [navigate]);

  useEffect(() => {
    getMyProfile().then((p) => {
      if (!p) return;
      const name = p.fullName || [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (name) setUserName(name);
    }).catch(() => {});
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const runAction = async (action) => {
    const incidentId = Number(selected.incidentId);
    if (!Number.isInteger(incidentId) || incidentId <= 0) {
      window.alert('No collection task linked to this bin. Wait for an assignment from the server.');
      return;
    }
    try {
      setActionLoading(true);
      if (action === 'accept') await acceptAssignment({ incidentId });
      if (action === 'arrive') await arriveAtScene({ incidentId });
      if (action === 'complete') { await completeAssignment({ incidentId, notes: 'Bin collection completed' }); showSuccess('Collection completed successfully! ✅'); }
      if (action === 'reject') await rejectAssignment({ incidentId, reason: 'Rejected from bin dashboard' });
      await loadData(false);
      if (action === 'complete' || action === 'reject') setSelected(EMPTY_BIN);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.title || 'Request failed';
      window.alert(`${action.toUpperCase()} failed: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('binToken');
    localStorage.removeItem('unitToken');
    localStorage.removeItem('binName');
    localStorage.removeItem('binEmail');
    navigate('/unit/login');
  };

  const totalBins = stats?.totalBins ?? stats?.total ?? bins.length;
  const recycled = stats?.recycledToday ?? stats?.recycled ?? stats?.totalRecycled ?? '—';
  const health = stats?.systemHealth ?? stats?.optimizationScore ?? stats?.health ?? '98.4';
  const fillColor = selected.fillLevel >= 85 ? '#ef4444' : selected.fillLevel >= 50 ? '#f59e0b' : '#14e842';

  /* ─── render ─── */
  return (
    <div style={{ minHeight: '100svh', background: '#f0f4f8', fontFamily: "'Inter', -apple-system, sans-serif", color: '#0a1628', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', position: 'relative' }}>

      {/* ── Success Toast ── */}
      {successMsg && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: '#14e842', color: '#0a1628', fontWeight: 900, fontSize: 13, padding: '12px 24px', borderRadius: 999, zIndex: 9999, boxShadow: '0 8px 32px rgba(20,232,66,0.4)', whiteSpace: 'nowrap' }}>
          {successMsg}
        </div>
      )}

      {/* ── HEADER ── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#0a1628', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#14e842', fontWeight: 900, fontSize: 14 }}>⦿</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: -0.5 }}>SMARTBINS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6 }}>
            <LogOut size={18} />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate('/unit/profile')}>
            <User size={16} color="#fff" />
          </div>
        </div>
      </header>

      {/* ── SEARCH ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px 4px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <Search size={18} color="#94a3b8" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bins, sectors, or collection points..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0a1628', background: 'transparent', padding: '10px 0' }}
          />
          <button style={{ background: '#0a1628', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 900, fontSize: 11, letterSpacing: 1, cursor: 'pointer' }}>
            FIND
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* System Health */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, background: 'radial-gradient(circle, rgba(20,232,66,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>System Health</p>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#14e842', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, background: '#14e842', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              LIVE
            </span>
          </div>
          <p style={{ fontSize: 48, fontWeight: 900, margin: '8px 0 4px', lineHeight: 1 }}>
            {typeof health === 'number' ? `${health}%` : health}
            {typeof health === 'string' && !health.includes('%') ? <span style={{ fontSize: 24 }}>%</span> : null}
          </p>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Optimization score from last maintenance cycle.</p>
        </div>

        {/* Bins + Recycled */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Trash2 size={20} color="#94a3b8" />
            <p style={{ fontSize: 28, fontWeight: 900, margin: '10px 0 4px' }}>{totalBins.toLocaleString?.() ?? totalBins}</p>
            <p style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, margin: 0 }}>Total Bins</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Leaf size={20} color="#14e842" />
            <p style={{ fontSize: 28, fontWeight: 900, margin: '10px 0 4px' }}>{recycled}{typeof recycled === 'number' ? ' kg' : ''}</p>
            <p style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, margin: 0 }}>Recycled Today</p>
          </div>
        </div>

        {/* Nearest bin banner */}
        {nearestBin && (
          <div style={{ background: '#0a1628', borderRadius: 20, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onClick={() => { selectBin(nearestBin.bin); setView('map'); }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 4px' }}>Nearest Unit</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>{distanceLabel(nearestBin.dist)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 4px' }}>Navigation</p>
                <p style={{ fontSize: 14, fontWeight: 900, color: '#14e842', margin: 0 }}>Live Path</p>
              </div>
              <div style={{ width: 40, height: 40, background: '#14e842', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Navigation size={18} color="#0a1628" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── TAB SWITCH ── */}
      <div style={{ padding: '16px 20px 0', display: 'flex', gap: 8 }}>
        {['map', 'list'].map((v) => (
          <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', background: view === v ? '#0a1628' : '#fff', color: view === v ? '#14e842' : '#94a3b8', transition: 'all .2s' }}>
            {v === 'map' ? '🗺 Map' : '☰ Queue'}
          </button>
        ))}
      </div>

      {/* ── MAP VIEW ── */}
      {view === 'map' && (
        <div style={{ margin: '16px 20px 0', borderRadius: 24, overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', height: 280 }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <Loader2 size={32} color="#14e842" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}
          <MapContainer center={[selected.lat, selected.lng]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filteredBins.map((bin) => (
              <Marker
                key={String(bin.id)}
                position={[bin.lat, bin.lng]}
                icon={makeBinIcon(String(selected.id) === String(bin.id), bin.fillLevel >= 85)}
                eventHandlers={{ click: () => {
                  const task = assignments.find((t) => String(t.incidentId) === String(bin.incidentId) || (t.lat != null && Math.abs(t.lat - bin.lat) < 0.0005 && Math.abs(t.lng - bin.lng) < 0.0005));
                  selectBin(bin, task);
                }}}
              >
                <Popup><strong>{bin.name}</strong><br />{bin.fillLevel}% full</Popup>
              </Marker>
            ))}
            <RecenterMap lat={selected.lat} lng={selected.lng} />
          </MapContainer>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div style={{ margin: '16px 20px 0', background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 }}>Collection Queue</p>
            <span style={{ background: 'rgba(20,232,66,0.12)', color: '#0a8f28', fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 900 }}>{assignments.length} ACTIVE</span>
          </div>
          {loading ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={28} color="#14e842" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : assignments.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <Trash2 size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>No active tasks</p>
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {assignments.map((task) => (
                <button
                  key={String(task.assignmentId ?? task.incidentId)}
                  onClick={() => {
                    const bin = assignmentToBin(task) || bins.find((b) => String(b.incidentId) === String(task.incidentId));
                    selectBin(bin, task);
                    setView('map');
                  }}
                  style={{ width: '100%', textAlign: 'left', padding: '16px 20px', border: 'none', borderBottom: '1px solid #f1f5f9', background: String(selected.incidentId) === String(task.incidentId) ? 'rgba(20,232,66,0.06)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background .15s' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14 }}>{task.incidentType}</p>
                    <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748b' }}>{task.locationName}</p>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#14e842', textTransform: 'uppercase', letterSpacing: 1 }}>{task.status}</span>
                  </div>
                  <ChevronRight size={18} color="#cbd5e1" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SELECTED BIN CARD ── */}
      {selected.id ? (
        <div style={{ margin: '16px 20px 100px', background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          {/* header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#14e842', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, background: '#14e842', borderRadius: '50%', display: 'inline-block' }} />
              LIVE STATUS
            </span>
            <button onClick={() => selectBin(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={18} />
            </button>
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900 }}>{selected.name}</h2>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} /> {selected.address}
            {selectedDist != null && <span style={{ marginLeft: 8, color: '#14e842', fontWeight: 700 }}>· {distanceLabel(selectedDist)}</span>}
          </p>

          {/* capacity + status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: '14px 16px', border: '1px solid #f1f5f9' }}>
              <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Capacity</p>
              <p style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900 }}>{selected.fillLevel}<span style={{ fontSize: 14 }}>%</span></p>
              <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${selected.fillLevel}%`, background: fillColor, borderRadius: 999, transition: 'width .5s' }} />
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: '14px 16px', border: '1px solid #f1f5f9' }}>
              <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Availability</p>
              <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 900 }}>{selected.status}</p>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: '#14e842', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={11} /> Ready for clean
              </p>
            </div>
          </div>

          {/* actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button disabled={actionLoading} onClick={() => runAction('accept')} style={{ width: '100%', padding: '14px', borderRadius: 16, border: 'none', background: '#f1f5f9', color: '#0a1628', fontWeight: 900, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', opacity: actionLoading ? 0.5 : 1 }}>
              Accept Task
            </button>
            <button disabled={actionLoading} onClick={() => runAction('arrive')} style={{ width: '100%', padding: '14px', borderRadius: 16, border: 'none', background: '#0a1628', color: '#fff', fontWeight: 900, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: actionLoading ? 0.5 : 1 }}>
              <Navigation size={16} /> Arrive at Bin
            </button>
            <button disabled={actionLoading || !selected.incidentId} onClick={() => runAction('complete')} style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: '#14e842', color: '#0a1628', fontWeight: 900, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(20,232,66,0.3)', opacity: (actionLoading || !selected.incidentId) ? 0.5 : 1 }}>
              {actionLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><Activity size={18} /> Complete Collection</>}
            </button>
            <button disabled={actionLoading || !selected.incidentId} onClick={() => runAction('reject')} style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #fecaca', background: 'transparent', color: '#ef4444', fontWeight: 900, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', opacity: (actionLoading || !selected.incidentId) ? 0.5 : 1 }}>
              Reject Task
            </button>
          </div>
        </div>
      ) : (
        <div style={{ margin: '16px 20px 100px', background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: '#94a3b8' }}>
          <Trash2 size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>No bin selected</p>
          <p style={{ fontSize: 12, margin: 0 }}>Pick a marker on the map or a task from the queue.</p>
        </div>
      )}

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
      `}</style>
    </div>
  );
};

export default BinDashboard;