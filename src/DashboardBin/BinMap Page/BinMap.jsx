import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, X, CheckCircle2, Navigation, Activity, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllBins, getMyAssignments, acceptAssignment, arriveAtScene, completeAssignment, rejectAssignment } from '../../api/binApi';

/* ─── helpers ──────────────────────────────────────────────── */
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 16, { animate: true, duration: 1 });
  }, [lat, lng, map]);
  return null;
}
function normalizeBin(raw) {
  if (!raw || typeof raw !== 'object') return null;
  
  const lat = parseFloat(raw.latitude ?? raw.lat ?? 0);
  const lng = parseFloat(raw.longitude ?? raw.lng ?? 0);
  const fill = Number(raw.fillLevel ?? raw.fillPercentage ?? raw.fullnessLevel ?? raw.level ?? 0);
  
  return {
    id: raw.id ?? raw.binId,
    
    name: raw.name ?? raw.binName ?? raw.title ?? raw.deviceIdentifier ?? `Bin #${raw.id}`,
    
    address: raw.address ?? raw.location ?? raw.binLocation ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    
    fillLevel: Math.min(100, Math.max(0, Math.round(fill))),
    
    capacity: raw.capacity ?? raw.maxCapacity ?? 180,
    
    status: raw.status ?? raw.sensorStatus ?? (fill >= 85 ? 'Full' : fill >= 50 ? 'Medium' : 'Available'),
    
    lastUpdated: raw.lastUpdated ?? raw.lastSeen ?? raw.updatedAt ?? null,
    
    lat, 
    lng,
    
    incidentId: raw.incidentId ?? null,
    
    isOnline: raw.isOnline ?? raw.isActive ?? raw.online ?? true,
    
    distance: raw.distance ?? null,
    
    sensorStatus: raw.sensorStatus ?? null,
    
    isFull: raw.isFull ?? (fill >= 85),
    
    // Is  Full
    isNearFull: raw.isNearFull ?? (fill >= 50 && fill < 85),
  };
}

function normalizeAssignment(raw) {
  if (!raw) return raw;
  const lat = parseFloat(raw.incidentLatitude ?? raw.latitude ?? raw.lat ?? 0);
  const lng = parseFloat(raw.incidentLongitude ?? raw.longitude ?? raw.lng ?? 0);
  return {
    ...raw,
    incidentId: raw.incidentId ?? raw.id,
    assignmentId: raw.assignmentId ?? raw.id,
    incidentType: raw.incidentType ?? raw.type ?? 'Collection',
    locationName: raw.incidentLocation ?? raw.locationName ?? 'Unknown',
    status: raw.incidentStatus ?? raw.status ?? 'Assigned',
    lat: lat || null, lng: lng || null,
  };
}

const makeBinIcon = (active, fillPct) => {
  const color = fillPct >= 85 ? '#ef4444' : fillPct >= 50 ? '#f59e0b' : '#14e842';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${active ? 52 : 42}px;height:${active ? 52 : 42}px;
      border-radius:50%;
      background:${active ? color : '#fff'};
      border:3px solid ${color};
      display:flex;align-items:center;justify-content:center;
      box-shadow:${active ? `0 0 0 10px ${color}30` : '0 3px 12px rgba(0,0,0,0.18)'};
      transition:all .2s;
    "><span style="font-size:${active ? 22 : 18}px">🗑</span></div>`,
    iconSize: [active ? 52 : 42, active ? 52 : 42],
    iconAnchor: [active ? 26 : 21, active ? 26 : 21],
  });
};

function fillColor(pct) {
  if (pct >= 85) return '#ef4444';
  if (pct >= 50) return '#f59e0b';
  return '#14e842';
}

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

/* ─── BinMap ───────────────────────────────────────────────── */
export default function BinMap() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselect = location.state?.selectedId ?? null;

  const [bins, setBins] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userPos, setUserPos] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [rawBins, rawTasks] = await Promise.all([
        getAllBins().catch(() => []),
        getMyAssignments().catch(() => []),
      ]);
      const tasks = rawTasks.map(normalizeAssignment);
      const normalized = rawBins.map(normalizeBin).filter(Boolean);
      // attach incidentId from tasks
      for (const bin of normalized) {
        const task = tasks.find(t => t.lat && Math.abs(t.lat - bin.lat) < 0.0005 && Math.abs(t.lng - bin.lng) < 0.0005);
        if (task) bin.incidentId = task.incidentId;
      }
      setBins(normalized);
      setAssignments(tasks);
      if (preselect && !selected) {
        const found = normalized.find(b => String(b.id) === String(preselect));
        if (found) setSelected(found);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [preselect]);

  useEffect(() => {
    load();
    const iv = setInterval(() => load(true), 15000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(({ coords }) =>
      setUserPos({ lat: coords.latitude, lng: coords.longitude })
    );
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bins.filter(b => {
      const matchQ = !q || b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q);
      const matchF = filterStatus === 'all' || (filterStatus === 'full' && b.fillLevel >= 85) || (filterStatus === 'medium' && b.fillLevel >= 50 && b.fillLevel < 85) || (filterStatus === 'ok' && b.fillLevel < 50);
      return matchQ && matchF;
    });
  }, [bins, search, filterStatus]);

  const runAction = async (action) => {
    const incidentId = Number(selected?.incidentId);
    if (!Number.isInteger(incidentId) || incidentId <= 0) {
      showToast('No task linked to this bin yet.', true);
      return;
    }
    try {
      setActionLoading(true);
      if (action === 'accept') await acceptAssignment({ incidentId });
      if (action === 'arrive') await arriveAtScene({ incidentId });
      if (action === 'complete') { await completeAssignment({ incidentId, notes: 'Bin collection completed' }); showToast('✅ Collection completed!'); setSelected(null); }
      if (action === 'reject') { await rejectAssignment({ incidentId, reason: 'Rejected from dashboard' }); setSelected(null); }
      await load(true);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Request failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  const mapCenter = selected ? [selected.lat, selected.lng] : userPos ? [userPos.lat, userPos.lng] : [30.0444, 31.2357];
  const fc = selected ? fillColor(selected.fillLevel) : '#14e842';

  const nearestAssignment = assignments[0] ?? null;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: toast.isError ? '#ef4444' : '#14e842', color: toast.isError ? '#fff' : '#0a1628', fontWeight: 900, fontSize: 13, padding: '12px 28px', borderRadius: 999, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 'calc(100vh - 160px)' }}>

        {/* ── Left Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search bins..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#0a1628' }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all','All'],['full','Full'],['medium','Mid'],['ok','OK']].map(([v,l]) => (
              <button 
                key={v} 
                onClick={() => setFilterStatus(v)} 
                style={{ 
                  flex: 1, 
                  borderRadius: 8, 
                  padding: '7px', 
                  fontSize: 11, 
                  fontWeight: 900, 
                  cursor: 'pointer', 
                  background: filterStatus === v ? '#0a1628' : '#fff', 
                  color: filterStatus === v ? '#14e842' : '#94a3b8', 
                  border: '1px solid #e2e8f0'
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Nearest Assignment banner */}
          {nearestAssignment && (
            <div style={{ background: '#0a1628', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Active Task</p>
              <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 900, color: '#fff' }}>{nearestAssignment.incidentType}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{nearestAssignment.locationName}</p>
              <span style={{ display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 900, color: '#14e842', background: 'rgba(20,232,66,0.1)', padding: '3px 8px', borderRadius: 5 }}>{nearestAssignment.status}</span>
            </div>
          )}

          {/* Bin list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 28, height: 28, border: '3px solid #14e842', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filtered.map(bin => {
              const active = String(selected?.id) === String(bin.id);
              const fc2 = fillColor(bin.fillLevel);
              return (
                <button
                  key={bin.id}
                  onClick={() => setSelected(active ? null : bin)}
                  style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 14, border: `1px solid ${active ? '#14e842' : '#e2e8f0'}`, background: active ? 'rgba(20,232,66,0.06)' : '#fff', cursor: 'pointer', transition: 'all .15s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0a1628' }}>{bin.name}</p>
                    <span style={{ fontSize: 12, fontWeight: 900, color: fc2 }}>{bin.fillLevel}%</span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bin.address}</p>
                  <div style={{ height: 4, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${bin.fillLevel}%`, background: fc2, borderRadius: 999 }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Map + Detail ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
          {/* Nearest Unit Bar */}
          {userPos && bins.length > 0 && (() => {
            let best = null, bestD = Infinity;
            for (const b of bins) {
              const d = Math.hypot(b.lat - userPos.lat, b.lng - userPos.lng);
              if (d < bestD) { bestD = d; best = b; }
            }
            const meters = Math.round(bestD * 111139);
            return best ? (
              <div style={{ background: '#fff', padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Navigation size={18} color="#94a3b8" />
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 }}>Nearest Unit</p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0a1628' }}>{meters < 1000 ? `${meters} Meters` : `${(meters/1000).toFixed(1)} km`}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 }}>Navigation</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#14e842' }}>Live Path</p>
                  </div>
                  <button onClick={() => setSelected(best)} style={{ width: 40, height: 40, background: '#14e842', border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Navigation size={18} color="#0a1628" />
                  </button>
                </div>
              </div>
            ) : null;
          })()}

          {/* Map */}
          <div style={{ flex: 1, position: 'relative', minHeight: 400 }}>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <Loader2 size={32} color="#14e842" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            )}
            <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={true}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
              {userPos && <Circle center={[userPos.lat, userPos.lng]} radius={80} pathOptions={{ color: '#14e842', fillColor: '#14e842', fillOpacity: 0.15 }} />}
              {filtered.map(bin => (
                <Marker
                  key={bin.id}
                  position={[bin.lat, bin.lng]}
                  icon={makeBinIcon(String(selected?.id) === String(bin.id), bin.fillLevel)}
                  eventHandlers={{ click: () => setSelected(prev => String(prev?.id) === String(bin.id) ? null : bin) }}
                >
                  <Popup><b>{bin.name}</b><br />{bin.fillLevel}% full<br />{bin.address}</Popup>
                </Marker>
              ))}
              {selected && <RecenterMap lat={selected.lat} lng={selected.lng} />}
            </MapContainer>
          </div>

{selected && (
  <div style={{ 
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    background: '#fff', 
    borderRadius: 20,
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    zIndex: 1000,
    maxHeight: '50vh',
    overflowY: 'auto',
    animation: 'slideUp 0.3s ease-out'
  }}>
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ 
            width: 8, 
            height: 8, 
            background: '#14e842', 
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ fontSize: 11, fontWeight: 900, color: '#14e842', textTransform: 'uppercase', letterSpacing: 1 }}>
            Live Status
          </span>
        </div>
        <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#0a1628' }}>
          {selected.name}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={14} />{selected.address}
        </p>
      </div>
      <button 
        onClick={() => setSelected(null)} 
        style={{ 
          background: '#f1f5f9', 
          border: 'none', 
          width: 32, 
          height: 32, 
          borderRadius: '50%',
          cursor: 'pointer', 
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          flexShrink: 0
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0a1628'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#94a3b8'; }}
      >
        <X size={18} />
      </button>
    </div>

    {/* Stats Grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
      {/* Capacity */}
      <div style={{ 
        background: '#f8fafc', 
        borderRadius: 16, 
        padding: '16px',
        border: '1px solid #f1f5f9'
      }}>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Capacity
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: fillColor(selected.fillLevel), lineHeight: 1 }}>
            {selected.fillLevel}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#64748b' }}>%</span>
        </div>
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${selected.fillLevel}%`, 
            background: fillColor(selected.fillLevel), 
            borderRadius: 999,
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Availability */}
      <div style={{ 
        background: '#f8fafc', 
        borderRadius: 16, 
        padding: '16px',
        border: '1px solid #f1f5f9'
      }}>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Availability
        </p>
        <p style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#0a1628' }}>
          {selected.fillLevel >= 85 ? 'Full' : selected.fillLevel >= 50 ? 'Medium' : 'Available'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ 
            width: 8, 
            height: 8, 
            background: selected.fillLevel >= 85 ? '#14e842' : '#f59e0b', 
            borderRadius: '50%',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: selected.fillLevel >= 85 ? '#14e842' : '#f59e0b' }}>
            {selected.fillLevel >= 85 ? 'Ready for clean' : 'Monitoring'}
          </span>
        </div>
      </div>
    </div>

    {/* Additional Info */}
    {selected.lastUpdated && (
      <div style={{ 
        paddingTop: 16, 
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6
      }}>
        <Clock size={14} color="#94a3b8" />
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
          Last updated {timeAgo(selected.lastUpdated)}
        </span>
      </div>
    )}
  </div>
)}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        @keyframes slideUp { 
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}