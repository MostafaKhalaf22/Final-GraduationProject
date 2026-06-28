import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ArrowLeft, CheckCircle2, AlertTriangle, RefreshCw, Loader2, Activity, Clock } from 'lucide-react';
import { getBinById, getMyAssignments, completeAssignment, acceptAssignment, arriveAtScene, rejectAssignment } from '../../api/binApi';
import BinLayout from "../BinLayout/BinLayout";
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.setView([lat, lng], 16); }, [lat, lng, map]);
  return null;
}

const binIcon = L.divIcon({
  className: '',
  html: `<div style="width:48px;height:48px;border-radius:50%;background:#14e842;border:3px solid #0a1628;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 10px rgba(20,232,66,0.2);font-size:22px">🗑</div>`,
  iconSize: [48, 48], iconAnchor: [24, 24],
});

function normalizeBin(raw) {
  if (!raw) return null;
  const lat = parseFloat(raw.latitude ?? raw.lat ?? 0);
  const lng = parseFloat(raw.longitude ?? raw.lng ?? 0);
  const fill = Number(raw.fillLevel ?? raw.fillPercentage ?? raw.fullnessLevel ?? raw.level ?? 0);
  return {
    id: raw.id ?? raw.binId,
    name: raw.name ?? raw.binName ?? `Smart Bin #${raw.id}`,
    address: raw.address ?? raw.location ?? raw.binLocation ?? 'Unknown Location',
    sector: raw.sector ?? raw.zone ?? raw.district ?? null,
    streetAddress: raw.streetAddress ?? raw.street ?? null,
    fillLevel: Math.min(100, Math.max(0, Math.round(fill))),
    capacity: raw.capacity ?? raw.maxCapacity ?? 180,
    currentVolume: raw.currentVolume ?? raw.currentLevel ?? null,
    status: raw.status ?? (fill >= 85 ? 'Full' : fill >= 50 ? 'Medium' : 'Available'),
    lastUpdated: raw.lastUpdated ?? raw.updatedAt ?? null,
    lat, lng,
    incidentId: raw.incidentId ?? null,
    isOnline: raw.isOnline ?? raw.online ?? true,
    recentActivity: raw.recentActivity ?? raw.activities ?? [],
    model: raw.model ?? raw.deviceModel ?? null,
    serialNumber: raw.serialNumber ?? raw.serial ?? null,
  };
}

function fillColor(pct) {
  if (pct >= 85) return '#ef4444';
  if (pct >= 50) return '#f59e0b';
  return '#14e842';
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function BinDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bin, setBin] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const [rawBin, rawTasks] = await Promise.all([
        getBinById(id).catch(() => null),
        getMyAssignments().catch(() => []),
      ]);
      const b = normalizeBin(rawBin);
      setBin(b);
      if (b) {
        const task = rawTasks.find(t => {
          const tLat = parseFloat(t.incidentLatitude ?? t.latitude ?? t.lat ?? 0);
          const tLng = parseFloat(t.incidentLongitude ?? t.longitude ?? t.lng ?? 0);
          return (String(t.incidentId) === String(b.incidentId)) ||
            (tLat && Math.abs(tLat - b.lat) < 0.0005 && Math.abs(tLng - b.lng) < 0.0005);
        });
        setAssignment(task ?? null);
        if (task) b.incidentId = task.incidentId ?? task.id;
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const runAction = async (action) => {
    const incidentId = Number(bin?.incidentId ?? assignment?.incidentId ?? assignment?.id);
    if (!Number.isInteger(incidentId) || incidentId <= 0) {
      showToast('No task linked to this bin.', true); return;
    }
    try {
      setActionLoading(true);
      if (action === 'accept') await acceptAssignment({ incidentId });
      if (action === 'arrive') await arriveAtScene({ incidentId });
      if (action === 'complete') { await completeAssignment({ incidentId, notes: 'Bin collection completed' }); showToast('✅ Marked as cleaned!'); }
      if (action === 'reject') { await rejectAssignment({ incidentId, reason: 'Rejected' }); }
      await load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Request failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <BinLayout page="map">
      <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: '#94a3b8' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #14e842', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontWeight: 600 }}>Loading bin data...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </BinLayout>
  );

  if (!bin) return (
    <BinLayout page="map">
      <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: '#94a3b8' }}>
        <AlertTriangle size={48} style={{ opacity: 0.3 }} />
        <p style={{ margin: 0, fontWeight: 700 }}>Bin not found</p>
        <button onClick={() => navigate(-1)} style={{ background: '#0a1628', color: '#14e842', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 900, cursor: 'pointer' }}>← Go Back</button>
      </div>
    </BinLayout>
  );

  const fc = fillColor(bin.fillLevel);
  const activities = bin.recentActivity?.length > 0 ? bin.recentActivity : [
    { type: 'Waste Collection', date: bin.lastUpdated, change: '+100% Space' },
    { type: 'Sensor Calibration', date: null, tag: 'Routine' },
  ];

  return (
    <BinLayout page="map">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: toast.err ? '#ef4444' : '#14e842', color: toast.err ? '#fff' : '#0a1628', fontWeight: 900, fontSize: 13, padding: '12px 28px', borderRadius: 999, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* Back + Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#0a1628' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, flex: 1 }}>{bin.name}</h2>
        <button onClick={load} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* LEFT: Hero Image + Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hero */}
          <div style={{ background: '#0a1628', borderRadius: 20, overflow: 'hidden', position: 'relative', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 100, opacity: 0.8 }}>🗑</div>
            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
              <span style={{ background: bin.isOnline ? '#14e842' : '#ef4444', color: bin.isOnline ? '#0a1628' : '#fff', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
                {bin.isOnline ? '● ONLINE' : '● OFFLINE'}
              </span>
              <h3 style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 900, color: '#fff' }}>{bin.name}</h3>
            </div>
          </div>

          {/* Fullness */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 }}>Fullness Level</p>
            <p style={{ margin: '0 0 10px', fontSize: 44, fontWeight: 900, color: '#0a1628', lineHeight: 1 }}>
              {bin.fillLevel}<span style={{ fontSize: 20 }}>%</span>
            </p>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${bin.fillLevel}%`, background: fc, borderRadius: 999, transition: 'width .8s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
              <span>Capacity: {bin.currentVolume ?? Math.round(bin.fillLevel * bin.capacity / 100)}L / {bin.capacity}L</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> Updated: {timeAgo(bin.lastUpdated)}</span>
            </div>
          </div>

          {/* Location */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 }}>Bin Location</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
              <MapPin size={18} color="#14e842" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: '#0a1628' }}>{bin.sector ?? bin.address}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{bin.streetAddress ?? `${bin.lat.toFixed(5)}, ${bin.lng.toFixed(5)}`}</p>
              </div>
            </div>
            {/* Actions */}
            <button
              onClick={() => runAction('complete')}
              disabled={actionLoading || !bin.incidentId}
              style={{ width: '100%', background: '#14e842', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 900, fontSize: 14, color: '#0a1628', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, opacity: (actionLoading || !bin.incidentId) ? 0.5 : 1, boxShadow: '0 4px 16px rgba(20,232,66,0.3)' }}
            >
              {actionLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={18} />}
              MARK AS CLEANED
            </button>
            <button
              onClick={() => runAction('reject')}
              disabled={actionLoading || !bin.incidentId}
              style={{ width: '100%', background: 'transparent', border: 'none', borderRadius: 14, padding: '12px', fontWeight: 700, fontSize: 13, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: (actionLoading || !bin.incidentId) ? 0.4 : 1 }}
            >
              <AlertTriangle size={15} /> REPORT ISSUE
            </button>
          </div>
        </div>

        {/* RIGHT: Map + Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Map */}
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0', height: 280 }}>
            {bin.lat && bin.lng ? (
              <MapContainer center={[bin.lat, bin.lng]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={true}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
                <Marker position={[bin.lat, bin.lng]} icon={binIcon} />
                <RecenterMap lat={bin.lat} lng={bin.lng} />
              </MapContainer>
            ) : (
              <div style={{ height: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <MapPin size={32} style={{ opacity: 0.3 }} />
              </div>
            )}
          </div>

          {/* Details */}
          {(bin.model || bin.serialNumber) && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 }}>Device Info</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {bin.model && (
                  <div><p style={{ margin: '0 0 2px', fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>MODEL</p><p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{bin.model}</p></div>
                )}
                {bin.serialNumber && (
                  <div><p style={{ margin: '0 0 2px', fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>SERIAL</p><p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{bin.serialNumber}</p></div>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', border: '1px solid #e2e8f0', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 }}>Recent Activity</p>
              <button style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 900, color: '#14e842', cursor: 'pointer' }}>VIEW ALL</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activities.slice(0, 5).map((act, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < activities.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {i === 0 ? '🗑' : '📡'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 13, color: '#0a1628' }}>{act.type ?? act.title ?? `Activity ${i+1}`}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{timeAgo(act.date ?? act.createdAt)}</p>
                  </div>
                  {(act.change || act.tag) && (
                    <span style={{ fontSize: 11, fontWeight: 900, color: act.change?.startsWith('+') ? '#14e842' : '#94a3b8' }}>
                      {act.change ?? act.tag}
                    </span>
                  )}
                </div>
              ))}
              {activities.length === 0 && (
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 20 }}>No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </BinLayout>
  );
}