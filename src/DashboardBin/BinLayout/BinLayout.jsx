import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutGrid, Map, BarChart2, Settings, LogOut, User } from 'lucide-react';
import { getMyProfile } from '../../api/binApi';

const NAV = [
  { id: 'home',    label: 'Home',     icon: LayoutGrid, path: '/bin/home' },
  { id: 'map',     label: 'Map',      icon: Map,        path: '/bin/map' },
  { id: 'reports', label: 'Reports',  icon: BarChart2,  path: '/bin/reports' },
  { id: 'settings',label: 'Settings', icon: Settings,   path: '/bin/settings' },
];

export default function BinLayout() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [userName, setUserName] = useState(localStorage.getItem('binName') || 'Collector');
  const [userInitial, setUserInitial] = useState('C');

  const currentPage = NAV.find(n => location.pathname === n.path)?.id || 'home';

  useEffect(() => {
    getMyProfile().then((p) => {
      if (!p) return;
      const name = p.fullName || [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (name) { setUserName(name); setUserInitial(name[0].toUpperCase()); }
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    ['binToken', 'unitToken', 'binName', 'binEmail'].forEach(k => localStorage.removeItem(k));
    navigate('/bin/login'); 
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, background: '#0a1628', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#14e842', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18 }}>⦿</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 15, color: '#fff', letterSpacing: -0.5 }}>SMARTBINS</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ id, label, icon: Icon, path }) => {
            const active = currentPage === id; // ✅ استخدام currentPage
            return (
              <button
                key={id}
                onClick={() => navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: active ? '#14e842' : 'transparent',
                  color: active ? '#0a1628' : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 900 : 600, fontSize: 14,
                  transition: 'all .15s', textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', borderRadius: 12 }}
            onClick={() => navigate('/bin/profile')} // ✅ تم التعديل
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#14e842,#0a9e30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#0a1628', flexShrink: 0 }}>
              {userInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Collector Unit</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', width: '100%', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 12, transition: 'all .15s', marginTop: 4 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, marginLeft: 220, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>SmartBins</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0a1628', letterSpacing: -0.5 }}>
              {NAV.find(n => n.id === currentPage)?.label ?? 'Dashboard'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#14e842', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, background: '#14e842', borderRadius: '50%', animation: 'pulse 2s infinite' }} />SYSTEM LIVE
            </span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#14e842,#0a9e30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#0a1628', cursor: 'pointer' }}
              onClick={() => navigate('/bin/profile')}>
              {userInitial}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: 32, maxWidth: 1400, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <Outlet />
        </div>
      </main>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}