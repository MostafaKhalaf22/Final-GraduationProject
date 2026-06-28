import React, { useEffect, useState } from 'react';
import { User, Briefcase, Bell, Save, Mail, Phone, Clock } from 'lucide-react';
import { getMyProfile, editMyProfile } from '../../api/unitApi';

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    fullName: 'Avery Dalton',
    title: 'Senior Dispatcher',
    email: 'avery.dalton@city.gov',
    phone: '+1 (555) 010-9988',
    homeBase: 'Central Command',
    shift: 'Day Shift (0700-1500)',
    status: 'Available',
    notifyAssignment: true,
    notifyEscalation: true
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const localName = localStorage.getItem('unitName') || '';
        const localEmail = localStorage.getItem('unitEmail') || '';
        if (localName || localEmail) {
          setProfile((prev) => ({
            ...prev,
            fullName: localName || prev.fullName,
            email: localEmail || prev.email,
          }));
        }

        const data = await getMyProfile();
        if (!data) return;
        const fullName =
          data.fullName ||
          [data.firstName, data.lastName].filter(Boolean).join(' ') ||
          profile.fullName;

        setProfile((prev) => ({
          ...prev,
          fullName,
          title: data.title || data.role || prev.title,
          email: data.email || prev.email,
          phone: data.phoneNumber || data.phone || prev.phone,
        }));
      } catch (e) {
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
     
      const parts = String(profile.fullName || '').trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ');
      await editMyProfile({
        firstName,
        lastName,
        email: profile.email,
        phoneNumber: profile.phone,
      });
      localStorage.setItem('unitName', `${firstName} ${lastName}`.trim());
      localStorage.setItem('unitEmail', profile.email || '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-300 p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="text-slate-500 mt-1">Manage your operator profile and notification preferences.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Hero Profile Section */}
      <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{profile.fullName}</h2>
            <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
              {profile.status}
            </span>
          </div>
          <p className="text-slate-400 mb-4">{profile.title} • {profile.homeBase}</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2"><Mail size={14}/> {profile.email}</span>
            <span className="flex items-center gap-2"><Phone size={14}/> {profile.phone}</span>
            <span className="flex items-center gap-2"><Clock size={14}/> {profile.shift}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <section className="bg-[#161b22] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6 text-[#3b82f6]">
            <User size={20} />
            <h3 className="font-bold text-lg text-white">Basic Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <InputGroup
              label="Full Name"
              value={profile.fullName}
              hint="Used across the console and audit logs."
              onChange={(v) => setProfile((p) => ({ ...p, fullName: v }))}
            />
            <InputGroup
              label="Title / Role"
              value={profile.title}
              hint="Displayed in headers and assignment notes."
              onChange={(v) => setProfile((p) => ({ ...p, title: v }))}
            />
            <InputGroup
              label="Email"
              value={profile.email}
              hint="For notifications and contact."
              onChange={(v) => setProfile((p) => ({ ...p, email: v }))}
            />
            <InputGroup
              label="Phone"
              value={profile.phone}
              hint="Direct contact or escalation."
              onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
            />
          </div>
        </section>

        {/* Assignment */}
        <section className="bg-[#161b22] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6 text-[#3b82f6]">
            <Briefcase size={20} />
            <h3 className="font-bold text-lg text-white">Assignment</h3>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <InputGroup label="Home Base" value={profile.homeBase} hint="Station / command center." />
            <InputGroup label="Shift" value={profile.shift} hint="Example: Day Shift (0700-1500)." />
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select className="w-full bg-[#0d1117] border border-slate-800 rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Available</option>
              <option>Busy</option>
              <option>Off-duty</option>
            </select>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-[#161b22] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6 text-[#3b82f6]">
            <Bell size={20} />
            <h3 className="font-bold text-lg text-white">Notifications</h3>
          </div>
          <div className="flex gap-12">
            <CheckboxGroup label="Notify me when I am assigned to a call" checked={profile.notifyAssignment} />
            <CheckboxGroup label="Notify me on escalations" checked={profile.notifyEscalation} />
          </div>
        </section>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, hint, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    <input 
      type="text" 
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full bg-[#0d1117] border border-slate-800 rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
    />
    <p className="text-xs text-slate-600 mt-2">{hint}</p>
  </div>
);

const CheckboxGroup = ({ label, checked }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div className="relative">
      <input type="checkbox" defaultChecked={checked} className="peer hidden" />
      <div className="w-5 h-5 border-2 border-slate-700 rounded bg-[#0d1117] peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
      <svg className="absolute top-1 left-1 w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
  </label>
);

export default ProfilePage;