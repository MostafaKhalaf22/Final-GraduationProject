import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, Truck, Activity, Map as MapIcon, 
  Users, Settings, Bell, Mail, LogOut, ChevronDown, Filter
} from 'lucide-react';

const NavItem = ({ icon, label, active = false, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
      active
        ? 'bg-slate-800 text-white shadow-lg'
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
    }`}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const StatCard = ({ title, value, trend, icon, color }) => {
  const colors = {
    blue:    'bg-blue-50 text-blue-600',
    indigo:  'bg-indigo-50 text-indigo-600',
    rose:    'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  const isPositive =
    trend.includes('+') ||
    trend.includes('total') ||
    trend.includes('units') ||
    trend.includes('ready');
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md text-left">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
      <p className={`text-[11px] font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-400'}`}>
        {trend}
      </p>
    </div>
  );
};

const NotifyItem = ({ title, desc, colorClass }) => (
  <div className="flex items-start space-x-3 group cursor-pointer text-left">
    <div className={`w-1 self-stretch rounded-full ${colorClass}`}></div>
    <div className="flex-1">
      <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
        {title}
      </h4>
      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ── Live clock hook ───────────────────────────────────────────────────────────
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const Dashboard = ({ units = [], admin }) => {
  const navigate   = useNavigate();
  const now        = useLiveClock();
  const [filterStatus, setFilterStatus] = useState('All');

  // ── Admin info — نفس pattern الداشبورد الوحدات ─────────────────────────────
  const [adminInfo, setAdminInfo] = useState({
    firstName: localStorage.getItem('adminFirstName') || admin?.firstName || 'Admin',
    lastName:  localStorage.getItem('adminLastName')  || admin?.lastName  || '',
    email:     localStorage.getItem('adminEmail')     || admin?.email     || 'admin@system.com',
    role:      admin?.role || 'System Administrator',
  });

  // ✅ يستمع لأي تحديث في الـ profile
  useEffect(() => {
    const handleProfileUpdate = () => {
      setAdminInfo({
        firstName: localStorage.getItem('adminFirstName') || 'Admin',
        lastName:  localStorage.getItem('adminLastName')  || '',
        email:     localStorage.getItem('adminEmail')     || 'admin@system.com',
        role:      admin?.role || 'System Administrator',
      });
    };
    window.addEventListener('profileUpdate', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdate', handleProfileUpdate);
  }, [admin?.role]);

  const fullName = `${adminInfo.firstName} ${adminInfo.lastName}`.trim();
  const initials = (
    adminInfo.firstName.charAt(0) +
    (adminInfo.lastName ? adminInfo.lastName.charAt(0) : '')
  ).toUpperCase();

  // ── Stats ─────────────────────────────────────────────────────────────────
  const filteredUnits = filterStatus === 'All'
    ? units
    : units.filter((u) => u.status === filterStatus);

  const stats = {
    totalUnits:     units.length,
    availableUnits: units.filter((u) => u.status === 'Available').length,
    busyUnits:      units.filter((u) => u.status === 'Busy').length,
    enRouteUnits:   units.filter((u) => u.status === 'EnRoute').length,
  };

  // ── Status badge helper ───────────────────────────────────────────────────
  const statusBadge = (status) => {
    if (status === 'Available')
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (status === 'Busy')
      return 'bg-rose-50 text-rose-600 border-rose-100';
    return 'bg-blue-50 text-blue-600 border-blue-100';
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = (e) => {
    e.stopPropagation();
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
    window.location.reload();
  };

  // ── Formatted clock strings ───────────────────────────────────────────────
  const timeStr = now.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    year:    'numeric',
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">

      {/* ═══════════════════════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════════════════════ */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col fixed h-full z-20 shadow-xl">

        {/* Logo */}
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800/50">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
            <LayoutGrid size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Admin Portal</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 space-y-2 mt-6 text-left">
          <NavItem icon={<LayoutGrid size={20} />} label="Dashboard"        active onClick={() => navigate('/dashboard')} />
          <NavItem icon={<Truck size={20} />}       label="Emergency Units"  onClick={() => navigate('/units')} />
          <NavItem icon={<Users size={20} />}       label="Admin Management" onClick={() => navigate('/admin-management')} />
          <NavItem icon={<Settings size={20} />}    label="System Settings"  onClick={() => navigate('/settings')} />
        </nav>

        {/* ✅ Live clock in sidebar footer */}
        <div className="px-4 py-3 border-t border-slate-800/50">
          <p className="text-[10px] font-mono text-slate-600 text-center tracking-tight">
            {timeStr} · {dateStr}
          </p>
        </div>

        {/* Admin profile row */}
        <div className="p-4 border-t border-slate-800 bg-[#0F172A]">
          <div
            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 cursor-pointer transition-all group"
            onClick={() => navigate('/profile')}
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-blue-400/30 flex items-center justify-center text-white font-bold text-xs shadow-lg uppercase flex-shrink-0">
                {initials}
              </div>
              <div className="text-left truncate">
                <p className="text-[12px] font-bold text-white truncate tracking-tight">
                  {fullName}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium group-hover:text-blue-400 transition-colors">
                  {adminInfo.email}
                </p>
              </div>
            </div>
            {/* Logout icon */}
            <LogOut
              size={16}
              className="text-slate-500 group-hover:text-red-400 transition-colors ml-1 flex-shrink-0"
              onClick={handleLogout}
            />
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN
      ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 ml-64 p-8 text-left">

        {/* Top header bar */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Welcome back,{' '}
              <span className="text-blue-600 font-semibold">{adminInfo.firstName}</span>
            </p>
          </div>

          {/* ✅ Top-right profile pill — live name + role */}
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-6 bg-white p-2 px-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-all"
          >
            <div className="flex space-x-5 text-slate-400 border-r border-slate-100 pr-5">
              <Bell size={19} className="hover:text-blue-600 transition-colors" />
              <Mail size={19} className="hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex items-center space-x-3 pl-2 text-left">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 leading-none">{fullName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{adminInfo.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 uppercase text-xs">
                {initials}
              </div>
              <ChevronDown size={14} className="text-slate-300" />
            </div>
          </div>
        </header>

        {/* ── Stat cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Assets"
            value={stats.totalUnits}
            trend="All registered units"
            icon={<Truck size={22} />}
            color="blue"
          />
          <StatCard
            title="Available Now"
            value={stats.availableUnits}
            trend={`${stats.availableUnits} units ready`}
            icon={<Activity size={22} />}
            color="indigo"
          />
          <StatCard
            title="Busy"
            value={stats.busyUnits}
            trend={stats.busyUnits > 0 ? `${stats.busyUnits} units on call` : 'All clear'}
            icon={<Bell size={22} />}
            color="rose"
          />
          <StatCard
            title="En Route"
            value={stats.enRouteUnits}
            trend={stats.enRouteUnits > 0 ? `${stats.enRouteUnits} units dispatched` : 'None dispatched'}
            icon={<MapIcon size={22} />}
            color="emerald"
          />
        </div>

        {/* ── Units table ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center text-left">
            <div>
              <h2 className="font-bold text-slate-800">Units Live Status</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Showing <span className="font-bold text-slate-600">{filteredUnits.length}</span> of {units.length} units
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-slate-400" />
              <select
                className="text-xs font-bold text-slate-500 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none bg-white cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="EnRoute">EnRoute</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredUnits.length === 0 ? (
              /* ✅ Empty state */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-slate-50 p-5 rounded-2xl mb-4">
                  <Truck size={32} className="text-slate-200 mx-auto" />
                </div>
                <p className="text-slate-400 text-sm font-bold">No units match this filter</p>
                <p className="text-slate-300 text-xs mt-1">Try selecting a different status</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase font-bold border-b border-slate-50">
                    <th className="px-6 py-4">Unit Name & ID</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUnits.map((unit, index) => (
                    <tr key={unit.id || index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">{unit.name}</p>
                        <p className="text-[10px] text-slate-400">{unit.id || unit.unitId}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{unit.type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${statusBadge(unit.status)}`}>
                          {unit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate('/units')}
                          className="text-blue-600 text-xs font-bold hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;