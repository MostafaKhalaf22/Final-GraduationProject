import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, TrendingUp, Trash2, Leaf, Zap, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { getAllBins, getBinStats } from '../../api/binApi';

function normalizeBin(raw) {
  if (!raw) return null;
  const fill = Number(raw.fillLevel ?? raw.fillPercentage ?? raw.fullnessLevel ?? 0);
  return {
    id: raw.id ?? raw.binId,
    name: raw.name ?? raw.binName ?? raw.deviceIdentifier ?? `Unit #${raw.id}`,
    address: raw.address ?? raw.location ?? '—',
    fillLevel: Math.min(100, Math.max(0, Math.round(fill))),
    capacity: raw.capacity ?? raw.maxCapacity ?? 180,
    status: raw.status ?? raw.sensorStatus ?? (fill >= 85 ? 'Full' : fill >= 50 ? 'Medium' : 'OK'),
    lastUpdated: raw.lastUpdated ?? raw.lastSeen ?? raw.updatedAt ?? null,
    isOnline: raw.isOnline ?? raw.isActive ?? raw.online ?? true,
    sector: raw.sector ?? raw.zone ?? 'General',
    sensorStatus: raw.sensorStatus ?? null,
    isFull: raw.isFull ?? (fill >= 85),
    isNearFull: raw.isNearFull ?? (fill >= 50 && fill < 85),
  };
}

function fillColor(pct) {
  if (pct >= 85) return '#ef4444';
  if (pct >= 50) return '#f59e0b';
  return '#14e842';
}

/* Simple bar chart using divs */
function BarChart({ data, maxValue }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 8px' }}>
      {data.map((item, i) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const color = item.color ?? fillColor(item.value);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: color }}>{item.value}</span>
            <div style={{ width: '100%', height: `${Math.max(pct, 4)}%`, background: color, borderRadius: '4px 4px 0 0', transition: 'height .6s ease', opacity: 0.85 }} />
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function BinReports() {
  const [bins, setBins] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  const load = useCallback(async () => {
    try {
      const [rawBins, rawStats] = await Promise.all([
        getAllBins().catch(() => []),
        getBinStats().catch(() => null),
      ]);
      
      console.log('📊 Reports - Raw Stats:', rawStats);
      console.log('📦 Reports - Bins:', rawBins);
      
      setBins(rawBins.map(normalizeBin).filter(Boolean));
      setStats(rawStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* derived metrics */
  const total = bins.length;
  const fullBins = bins.filter(b => b.fillLevel >= 85);
  const medBins  = bins.filter(b => b.fillLevel >= 50 && b.fillLevel < 85);
  const okBins   = bins.filter(b => b.fillLevel < 50);
  const onlineBins = bins.filter(b => b.isOnline);
  const avgFill = total > 0 ? Math.round(bins.reduce((s, b) => s + b.fillLevel, 0) / total) : 0;

  const recycled = stats?.recycledToday 
    ?? stats?.recycled 
    ?? bins.filter(b => b.fillLevel < 20).length;

  const collections = stats?.collectionsToday 
    ?? stats?.totalCollections 
    ?? bins.filter(b => b.sensorStatus === 'Empty' || (b.isFull === false && b.fillLevel < 20)).length;

  const health = stats?.systemHealth ?? stats?.health ?? 98.4;

  /* chart data — fill distribution */
  const fillBuckets = [
    { label: '0-20%',  value: bins.filter(b => b.fillLevel < 20).length,                    color: '#14e842' },
    { label: '20-40%', value: bins.filter(b => b.fillLevel >= 20 && b.fillLevel < 40).length, color: '#4ade80' },
    { label: '40-60%', value: bins.filter(b => b.fillLevel >= 40 && b.fillLevel < 60).length, color: '#f59e0b' },
    { label: '60-80%', value: bins.filter(b => b.fillLevel >= 60 && b.fillLevel < 80).length, color: '#f97316' },
    { label: '80%+',   value: bins.filter(b => b.fillLevel >= 80).length,                    color: '#ef4444' },
  ];
  const maxBucket = Math.max(...fillBuckets.map(b => b.value), 1);

  /* sector breakdown */
  const sectors = bins.reduce((acc, b) => {
    const s = b.sector ?? 'General';
    if (!acc[s]) acc[s] = { total: 0, full: 0 };
    acc[s].total++;
    if (b.fillLevel >= 85) acc[s].full++;
    return acc;
  }, {});

  /* top full bins */
  const topFull = [...bins].sort((a, b) => b.fillLevel - a.fillLevel).slice(0, 5);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Period selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Showing data for <strong>{bins.length} bins</strong>
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {['today', 'week', 'month'].map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)} 
                style={{ 
                  borderRadius: 8, 
                  padding: '7px 16px', 
                  fontSize: 12, 
                  fontWeight: 900, 
                  cursor: 'pointer', 
                  background: period === p ? '#0a1628' : '#fff', 
                  color: period === p ? '#14e842' : '#94a3b8', 
                  border: '1px solid #e2e8f0',
                  textTransform: 'capitalize' 
                }}
              >
                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {[
            { icon: <Trash2 size={20} color="#94a3b8" />, value: total, label: 'Total Bins', sub: `${onlineBins.length} online` },
            { icon: <AlertTriangle size={20} color="#ef4444" />, value: fullBins.length, label: 'Need Collection', sub: 'Fill ≥ 85%', accent: '#ef4444' },
            { icon: <BarChart2 size={20} color="#f59e0b" />, value: `${avgFill}%`, label: 'Avg Fill Level', sub: 'Across all bins' },
            // { icon: <Leaf size={20} color="#14e842" />, value: recycled, label: 'Recycled', sub: typeof recycled === 'number' ? 'bins today' : '—' },
            { icon: <CheckCircle2 size={20} color="#14e842" />, value: collections, label: 'Collections', sub: 'Completed today' },
          ].map(({ icon, value, label, sub, accent }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              {icon}
              <p style={{ margin: '12px 0 2px', fontSize: 30, fontWeight: 900, color: accent ?? '#0a1628', lineHeight: 1 }}>{loading ? '—' : value}</p>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
          {/* Fill Distribution Chart */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 900, color: '#0a1628' }}>Fill Level Distribution</p>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Number of bins per fill bracket</p>
              </div>
              <BarChart2 size={20} color="#94a3b8" />
            </div>
            {loading ? (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 28, height: 28, border: '3px solid #14e842', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <BarChart data={fillBuckets} maxValue={maxBucket} />
            )}
          </div>

          {/* Status breakdown donut-like */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 900, color: '#0a1628' }}>Status Breakdown</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'OK (< 50%)', count: okBins.length, color: '#14e842' },
                { label: 'Medium (50-85%)', count: medBins.length, color: '#f59e0b' },
                { label: 'Full (≥ 85%)', count: fullBins.length, color: '#ef4444' },
              ].map(({ label, count, color }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color }}>{count} <span style={{ color: '#cbd5e1' }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width .6s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two tables: Top Full Bins + Sector Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Top Full Bins */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0a1628' }}>Bins Needing Collection</p>
              {fullBins.length > 0 && <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 900 }}>{fullBins.length} URGENT</span>}
            </div>
            {loading ? (
              <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 24, height: 24, border: '3px solid #14e842', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : topFull.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                <CheckCircle2 size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 13 }}>All bins are in good shape!</p>
              </div>
            ) : (
              topFull.map((bin, i) => {
                const fc = fillColor(bin.fillLevel);
                return (
                  <div key={bin.id} style={{ padding: '12px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#cbd5e1', width: 20 }}>#{i+1}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700 }}>{bin.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{bin.address}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: fc }}>{bin.fillLevel}%</p>
                      <div style={{ width: 70, height: 4, background: '#f1f5f9', borderRadius: 999 }}>
                        <div style={{ height: '100%', width: `${bin.fillLevel}%`, background: fc, borderRadius: 999 }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}