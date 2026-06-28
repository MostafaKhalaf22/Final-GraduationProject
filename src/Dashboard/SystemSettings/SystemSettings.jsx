import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, LayoutDashboard, Truck, History, 
  Map, Settings, LogOut, Globe, Cpu, Lock, Mail, RotateCcw, Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const SystemSettings = () => {
  const navigate = useNavigate();

  const [adminData, setAdminData] = useState({
    firstName: localStorage.getItem('adminFirstName') || "Admin",
    lastName: localStorage.getItem('adminLastName') || "",
    email: localStorage.getItem('adminEmail') || "admin@system.com"
  });

  const fullName = `${adminData.firstName} ${adminData.lastName}`.trim();
  const initials = (adminData.firstName.charAt(0) + (adminData.lastName ? adminData.lastName.charAt(0) : "")).toUpperCase();

  useEffect(() => {
    const handleSync = () => {
      setAdminData({
        firstName: localStorage.getItem('adminFirstName') || "Admin",
        lastName: localStorage.getItem('adminLastName') || "",
        email: localStorage.getItem('adminEmail') || "admin@system.com"
      });
    };
    window.addEventListener("profileUpdate", handleSync);
    return () => window.removeEventListener("profileUpdate", handleSync);
  }, []);

  const initialSettings = {
    systemName: "Enterprise Dashboard",
    language: "English (US)",
    timezone: "UTC-08:00 Pacific Time",
    dateFormat: "MM/DD/YYYY",
    enableCaching: true,
    autoOptimize: true,
    compressResponses: false,
    maxUsers: "500",
    twoFactor: true,
    sessionTimeout: "30",
    passwordExpiry: "90",
    ipWhitelist: false,
    auditLogging: true,
    smtpServer: "smtp.company.com",
    smtpPort: "587",
    systemAlerts: true,
    dailyReports: true
  };

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('system_configurations');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const sidebarItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Emergency Units', icon: <Truck size={20} />, path: '/units' },
    // { name: 'Activity Log', icon: <History size={20} />, path: '/logs' },
    // { name: 'Map View', icon: <Map size={20} />, path: '/map' },
    { name: 'Admin Management', icon: <Users size={20} />, path: '/admin-management' },
    { name: 'System Settings', icon: <Settings size={20} />, path: '/settings', active: true },
  ];

  const updateField = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('system_configurations', JSON.stringify(settings));
    Swal.fire({
      title: 'Success!',
      text: 'System configurations have been updated and saved.',
      icon: 'success',
      confirmButtonColor: '#2563eb'
    });
  };

  const handleReset = () => {
    setSettings(initialSettings);
    Swal.fire('Reset!', 'Settings reverted to defaults. Click Save to apply.', 'info');
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); window.location.reload(); };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans text-left">
      <aside className="w-72 bg-[#111827] text-gray-400 flex flex-col fixed h-full shadow-2xl">
        <div className="p-6 flex items-center space-x-3 text-white border-b border-gray-800 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="bg-blue-600 p-2 rounded-lg"><Shield size={22} /></div>
          <span className="text-xl font-bold">Admin Portal</span>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          {sidebarItems.map((item) => (
            <div 
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex items-center space-x-3 p-3 cursor-pointer rounded-lg transition-all ${item.active ? 'bg-blue-600/10 border border-blue-600/30 text-white' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              {item.icon} <span className="text-sm font-medium">{item.name}</span>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 bg-[#0F172A]">
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center justify-between p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 cursor-pointer hover:bg-gray-800 transition-all"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              {/* عرض الحروف الأولى المصلحة */}
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold uppercase">{initials}</div>
              <div className="text-left truncate">
                {/* عرض الاسم الكامل المصلح */}
                <p className="text-sm font-bold truncate text-white">{fullName}</p>
                <p className="text-[10px] text-blue-400 font-bold uppercase mt-1">{adminData.email}</p>
              </div>
            </div>
            <LogOut size={16} className="text-gray-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleLogout(); }}/>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10 pb-24">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Settings</h1>
            <p className="text-gray-500 mt-1 font-medium">Manage your system configuration and preferences</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={handleReset} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all">
              <RotateCcw size={16} /> <span>Reset</span>
            </button>
            <button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md">
              <Save size={16} /> <span>Save Changes</span>
            </button>
          </div>
        </header>

        <div className="space-y-8 max-w-5xl text-left">
          {/* General Settings */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-8 border-b border-gray-50 pb-4">
              <Globe className="text-blue-600" size={20} />
              <h2 className="text-lg font-bold text-gray-900">General Settings</h2>
            </div>
            <div className="space-y-6">
              <SettingRow label="System Name" description="The display name for your system" value={settings.systemName} type="input" onChange={(val) => updateField('systemName', val)} />
              <SettingRow label="System Language" description="Default language for the interface" value={settings.language} type="select" options={["English (US)", "Arabic", "French"]} onChange={(val) => updateField('language', val)} />
              <SettingRow label="Timezone" description="Configure system timezone" value={settings.timezone} type="select" options={["UTC-08:00 Pacific Time", "UTC+02:00 Cairo"]} onChange={(val) => updateField('timezone', val)} />
              <SettingRow label="Date Format" description="How dates are displayed" value={settings.dateFormat} type="select" options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]} onChange={(val) => updateField('dateFormat', val)} />
            </div>
          </section>

          {/* Performance Settings */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-8 border-b border-gray-50 pb-4">
              <Cpu className="text-blue-600" size={20} />
              <h2 className="text-lg font-bold text-gray-900">Performance & Optimization</h2>
            </div>
            <div className="space-y-6">
              <SettingRow label="Enable Caching" description="Improve performance with cached data" checked={settings.enableCaching} type="toggle" onChange={(val) => updateField('enableCaching', val)} />
              <SettingRow label="Auto-Optimize Database" description="Automatically optimize database tables" checked={settings.autoOptimize} type="toggle" onChange={(val) => updateField('autoOptimize', val)} />
              <SettingRow label="Compress Responses" description="Enable GZIP compression for API responses" checked={settings.compressResponses} type="toggle" onChange={(val) => updateField('compressResponses', val)} />
              <SettingRow label="Max Concurrent Users" description="Maximum simultaneous connections" value={settings.maxUsers} type="input" onChange={(val) => updateField('maxUsers', val)} />
            </div>
          </section>

          {/* Security Settings (تمت إعادتها بالكامل) */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-8 border-b border-gray-50 pb-4">
              <Lock className="text-blue-600" size={20} />
              <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
            </div>
            <div className="space-y-6">
              <SettingRow label="Two-Factor Authentication" description="Require 2FA for all admin users" checked={settings.twoFactor} type="toggle" onChange={(val) => updateField('twoFactor', val)} />
              <SettingRow label="Session Timeout" description="Auto-logout after inactivity (minutes)" value={settings.sessionTimeout} type="input" onChange={(val) => updateField('sessionTimeout', val)} />
              <SettingRow label="Password Expiry" description="Force password change every (days)" value={settings.passwordExpiry} type="input" onChange={(val) => updateField('passwordExpiry', val)} />
              <SettingRow label="Enable IP Whitelist" description="Restrict access to specific IP addresses" checked={settings.ipWhitelist} type="toggle" onChange={(val) => updateField('ipWhitelist', val)} />
              <SettingRow label="Audit Logging" description="Log all system changes and access" checked={settings.auditLogging} type="toggle" onChange={(val) => updateField('auditLogging', val)} />
            </div>
          </section>

          {/* Email Settings (تمت إعادتها بالكامل) */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-8 border-b border-gray-50 pb-4">
              <Mail className="text-blue-600" size={20} />
              <h2 className="text-lg font-bold text-gray-900">Email & Notifications</h2>
            </div>
            <div className="space-y-6">
              <SettingRow label="SMTP Server" description="Outgoing mail server address" value={settings.smtpServer} type="input" onChange={(val) => updateField('smtpServer', val)} />
              <SettingRow label="SMTP Port" description="Server port number" value={settings.smtpPort} type="input" onChange={(val) => updateField('smtpPort', val)} />
              <SettingRow label="System Alerts" description="Email notifications for system events" checked={settings.systemAlerts} type="toggle" onChange={(val) => updateField('systemAlerts', val)} />
              <SettingRow label="Daily Reports" description="Send daily activity summary" checked={settings.dailyReports} type="toggle" onChange={(val) => updateField('dailyReports', val)} />
            </div>
          </section>

          <div className="flex justify-end space-x-4 pt-6">
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all">Cancel</button>
            <button onClick={handleSave} className="px-10 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg transition-all flex items-center space-x-2">
              <Save size={16} /> <span>Save All Changes</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

const SettingRow = ({ label, description, value, type, checked, onChange, options = [] }) => {
  return (
    <div className="flex items-center justify-between group">
      <div className="max-w-md text-left">
        <h4 className="text-sm font-bold text-gray-900">{label}</h4>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
      <div className="w-64 flex justify-end">
        {type === "input" && (
          <input className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            value={value} onChange={(e) => onChange(e.target.value)} />
        )}
        {type === "select" && (
          <select className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {type === "toggle" && (
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={checked} className="sr-only peer" onChange={(e) => onChange(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute  after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;