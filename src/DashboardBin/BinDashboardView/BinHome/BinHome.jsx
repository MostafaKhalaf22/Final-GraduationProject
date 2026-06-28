import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Trash2, Leaf, Navigation, RefreshCw, AlertTriangle } from 'lucide-react';
import { getAllBins, getBinStats, getNearbyBins } from '../../../api/binApi';

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
    isNearFull: raw.isNearFull ?? (fill >= 50 && fill < 85),
  };
}

function fillColor(pct) {
  if (pct >= 85) return '#ef4444';
  if (pct >= 60) return '#f59e0b';
  return '#14e842';
}

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ─── BinHome ──────────────────────────────────────────────── */
export default function BinHome() {
  const navigate = useNavigate();
  const [bins, setBins] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('fill');
  const [filterStatus, setFilterStatus] = useState('all');
  const [nearestDist, setNearestDist] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [rawBins, rawStats] = await Promise.all([
        getAllBins().catch(() => []),
        getBinStats().catch(() => null),
      ]);
      
      console.log('📊 Raw Stats from API:', rawStats);
      console.log('📦 Raw Bins Count:', rawBins?.length);
      
      setBins(rawBins.map(normalizeBin).filter(Boolean));
      setStats(rawStats);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(() => load(true), 30000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(async ({ coords }) => {
      const currentLat = coords.latitude;
      const currentLng = coords.longitude;
      
      setUserPos({ lat: currentLat, lng: currentLng });

      try {
        const rawNearbyBins = await getNearbyBins(currentLat, currentLng);
        const normalizedNearby = rawNearbyBins.map(normalizeBin).filter(Boolean);

        if (normalizedNearby.length > 0) {
          const nearestBin = normalizedNearby[0];
          const distance = haversine(currentLat, currentLng, nearestBin.lat, nearestBin.lng);
          setNearestDist(distance);
        }
      } catch (apiError) {
        console.warn("Nearby API failed, falling back to local calculation:", apiError);
      }
    }, (geoError) => {
      console.error("Geolocation access denied or failed:", geoError);
    });
  }, []);

  useEffect(() => {
    if (!userPos || bins.length === 0 || nearestDist !== null) return;
    let best = Infinity;
    for (const b of bins) {
      const d = haversine(userPos.lat, userPos.lng, b.lat, b.lng);
      if (d < best) best = d;
    }
    if (best !== Infinity) {
      setNearestDist(best);
    }
  }, [userPos, bins, nearestDist]);

  const displayed = bins
    .filter((b) => {
      const q = search.toLowerCase();
      const matchQ = !q || b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q) || String(b.id).includes(q);
      const matchF = filterStatus === 'all' || (filterStatus === 'full' && b.fillLevel >= 85) || (filterStatus === 'medium' && b.fillLevel >= 50 && b.fillLevel < 85) || (filterStatus === 'ok' && b.fillLevel < 50);
      return matchQ && matchF;
    })
    .sort((a, b) => {
      if (sortBy === 'fill') return b.fillLevel - a.fillLevel;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

  const totalBins = stats?.totalBins ?? bins.length;
  const activeBins = stats?.activeBins ?? bins.filter(b => b.isOnline).length;
  const fullBinsCount = stats?.fullBins ?? bins.filter(b => b.fillLevel >= 85).length;
  const nearFullBins = stats?.nearFullBins ?? bins.filter(b => b.fillLevel >= 50 && b.fillLevel < 85).length;
  const emptyBins = stats?.emptyBins ?? bins.filter(b => b.fillLevel < 50).length;
  
  const health = stats?.totalBins > 0 
    ? Math.round((stats.activeBins / stats.totalBins) * 100)
    : 98.4;
  
  const recycled = stats?.recycledToday ?? stats?.recycled ?? emptyBins;
  


  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Search + Refresh ── */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search bins, sectors, or collection points..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0a1628', background: 'transparent', padding: '14px 0' }}
            />
            <button onClick={() => setSearch('')} style={{ background: '#0a1628', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontWeight: 900, fontSize: 12, letterSpacing: 1, cursor: 'pointer' }}>
              FIND
            </button>
          </div>
          <button onClick={() => load()} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '0 18px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.4fr', gap: 16 }}>
          {/* System Health */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, background: 'radial-gradient(circle, rgba(20,232,66,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 }}>System Health</p>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#14e842', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, background: '#14e842', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />LIVE
              </span>
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>
              {typeof health === 'number' ? health.toFixed(1) : health}<span style={{ fontSize: 24, fontWeight: 900 }}>%</span>
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              {activeBins} of {totalBins} bins are currently active and operational.
            </p>
            {lastRefresh && <p style={{ margin: '8px 0 0', fontSize: 10, color: '#cbd5e1' }}>Updated {timeAgo(lastRefresh)}</p>}
          </div>

          {/* Total Bins */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <Trash2 size={22} color="#94a3b8" />
            <p style={{ margin: '14px 0 4px', fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>
              {loading ? '—' : Number(totalBins).toLocaleString()}
            </p>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 }}>Total Bins</p>
            {fullBinsCount > 0 && <p style={{ margin: '8px 0 0', fontSize: 11, color: '#ef4444', fontWeight: 700 }}>{fullBinsCount} need collection</p>}
          </div>

      

         
        </div>

        {/* ── Nearest Bin CTA ── */}
        {nearestDist != null && (
          <button
            onClick={() => navigate('/bin/map')}
            style={{ width: '100%', background: '#14e842', border: 'none', borderRadius: 16, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', fontWeight: 900, fontSize: 15, letterSpacing: 1.5, color: '#0a1628', boxShadow: '0 8px 32px rgba(20,232,66,0.3)', textTransform: 'uppercase' }}
          >
            <Navigation size={20} />
            CHECK NEAREST BIN STATUS
            <span style={{ marginLeft: 8, background: '#0a1628', color: '#14e842', borderRadius: 999, padding: '2px 12px', fontSize: 12 }}>
              {nearestDist < 1000 ? `${Math.round(nearestDist)}m` : `${(nearestDist / 1000).toFixed(1)}km`}
            </span>
          </button>
        )}

        {/* ── Bins Table ── */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {/* Table Header */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0a1628' }}>All Bins</p>
              <span style={{ background: 'rgba(20,232,66,0.12)', color: '#0a8f28', fontSize: 11, padding: '2px 10px', borderRadius: 6, fontWeight: 900 }}>
                {displayed.length} shown
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['all','All'],['full','Full ≥85%'],['medium','Medium'],['ok','OK']].map(([v,l]) => (
                <button key={v} onClick={() => setFilterStatus(v)} style={{ border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 900, cursor: 'pointer', background: filterStatus === v ? '#0a1628' : '#f1f5f9', color: filterStatus === v ? '#14e842' : '#64748b' }}>{l}</button>
              ))}
              <div style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: '#fff', color: '#64748b', outline: 'none' }}>
                <option value="fill">Sort: Fill Level</option>
                <option value="name">Sort: Name</option>
                <option value="status">Sort: Status</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #14e842', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Loading bins...</p>
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <Trash2 size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p style={{ margin: 0, fontWeight: 700 }}>No bins found</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Unit', 'Location', 'Fill Level', 'Capacity', 'Status', 'Last Update', ''].map((h) => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((bin, i) => {
                  const fc = fillColor(bin.fillLevel);
                  return (
                    <tr
                      key={String(bin.id)}
                      onClick={() => navigate('/bin/map', { state: { selectedId: bin.id } })}
                      style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: bin.fillLevel >= 85 ? 'rgba(239,68,68,0.1)' : 'rgba(20,232,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🗑</div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{bin.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>ID #{bin.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#0a1628' }}>{bin.address}</p>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', minWidth: 80 }}>
                            <div style={{ height: '100%', width: `${bin.fillLevel}%`, background: fc, borderRadius: 999, transition: 'width .5s' }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 900, color: fc, minWidth: 40 }}>{bin.fillLevel}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#64748b' }}>{bin.capacity}L</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 900, padding: '4px 10px', borderRadius: 6,
                          background: bin.fillLevel >= 85 ? 'rgba(239,68,68,0.1)' : bin.fillLevel >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(20,232,66,0.1)',
                          color: bin.fillLevel >= 85 ? '#ef4444' : bin.fillLevel >= 50 ? '#d97706' : '#15803d',
                        }}>
                          {bin.fillLevel >= 85 ? 'FULL' : bin.fillLevel >= 50 ? 'MEDIUM' : 'OK'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 12, color: '#94a3b8' }}>{timeAgo(bin.lastUpdated) ?? '—'}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/bin/detail/${bin.id}`); }}
                          style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 900, cursor: 'pointer', color: '#0a1628', whiteSpace: 'nowrap' }}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>
    </>
  );
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}