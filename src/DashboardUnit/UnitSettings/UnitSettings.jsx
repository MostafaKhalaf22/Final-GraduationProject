import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Building2, Radio, Bell, Map as MapIcon, 
  ArrowLeft, RotateCcw, ChevronDown 
} from 'lucide-react';

const UnitSettings = () => {
  const navigate = useNavigate();

  const SettingField = ({ label, helper, type = "text", defaultValue, isSelect = false }) => (
    <div className="bg-[#0f172a]/30 border border-slate-800/60 rounded-lg p-5 flex flex-col gap-2">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{label}</label>
      <div className="relative">
        <input 
          type={type} 
          defaultValue={defaultValue}
          className="w-full bg-[#020617] border border-slate-800 rounded-md px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all"
        />
        {isSelect && <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />}
      </div>
      {helper && <p className="text-[10px] text-slate-600 font-medium">{helper}</p>}
    </div>
  );

  // مكون فرعي للـ Checkbox المخصص في الصورة
  const SettingToggle = ({ label, helper }) => (
    <div className="bg-[#0f172a]/30 border border-slate-800/60 rounded-lg p-5 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input type="checkbox" className="w-4 h-4 rounded border-slate-800 bg-[#020617] checked:bg-blue-600 focus:ring-0 transition-all cursor-pointer" />
        <label className="text-[12px] font-bold text-slate-200">{label}</label>
      </div>
      {helper && <p className="text-[10px] text-slate-600 font-medium ml-7">{helper}</p>}
    </div>
  );

  const SectionTitle = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 text-blue-500 mb-4 mt-8 first:mt-0">
      <Icon size={16} />
      <h2 className="text-[11px] font-black uppercase tracking-widest">{title}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-10 overflow-y-auto">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-start mb-12">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800/50 rounded-lg text-slate-500 transition-all">
              <ArrowLeft size={20} />
           </button>
           <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">Normal system settings for dispatch operations.</p>
           </div>
        </div>
        <button className="bg-[#1e293b] hover:bg-slate-800 text-slate-300 px-5 py-2 rounded-md text-[11px] font-bold border border-slate-700/50 flex items-center gap-2 transition-all">
          <RotateCcw size={14} /> Reset to Defaults
        </button>
      </div>

      <div className="max-w-6xl mx-auto space-y-2">
        
        {/* Operator Section */}
        <SectionTitle icon={User} title="Operator" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingField label="Operator Name" defaultValue="Dispatcher" helper="Used in logs and notifications." />
          <SettingField label="Operator ID" defaultValue="OPS-01" helper="Shown in audit trails." />
        </div>

        {/* Agency Section */}
        <SectionTitle icon={Building2} title="Agency" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingField label="Department Mode" defaultValue="Multi-Agency" isSelect helper="Switch terminology and branding to fit the selected department." />
        </div>

        {/* Dispatch Section */}
        <SectionTitle icon={Radio} title="Dispatch" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingToggle label="Auto-open Dispatch view after dispatch" helper="Automatically switch to Dispatch when a dispatch is initiated." />
          <SettingToggle label="Confirm manual unit dispatch" helper="Require confirmation when dispatching a specific unit." />
          <SettingField label="Preferred unit type" defaultValue="Any" isSelect helper="Bias nearest-unit selection toward this type." />
          <SettingField label="Nearest-unit search radius (miles)" defaultValue="2" helper="Max distance when finding the nearest available unit." />
        </div>

        {/* Notifications Section */}
        <SectionTitle icon={Bell} title="Notifications" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingToggle label="Sound alerts" helper="Play a sound for new events (demo)." />
          <SettingToggle label="Desktop notifications" helper="Browser notifications when supported (demo)." />
          <SettingToggle label="Critical-only mode" helper="Reduce noise by focusing on critical events (demo)." />
        </div>

        {/* Map Section */}
        <SectionTitle icon={MapIcon} title="Map" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingToggle label="Show traffic overlay" helper="Display traffic conditions (demo)." />
          <SettingToggle label="Auto-center on active incident" helper="Re-center map when selecting an incident (demo)." />
          <SettingField label="Default zoom" defaultValue="Auto" isSelect helper="Baseline zoom behavior for incidents." />
        </div>

      </div>
    </div>
  );
};

export default UnitSettings;