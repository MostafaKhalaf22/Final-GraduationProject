import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2'; 
import axios from 'axios'; 
import { 
  LayoutGrid, Truck, Activity, Map as MapIcon, 
  Users, Settings, Bell, Mail, LogOut, ChevronDown, 
  Search, Plus, Eye, Pencil, Trash2, Moon, ShieldCheck, Plane
} from 'lucide-react';

const formatLastActive = (dateString) => {
  if (!dateString) return "No activity";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";
  const now = new Date();
  const diffInMins = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMins < 1) return "Just now";
  if (diffInMins < 60) return `${diffInMins}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return date.toLocaleDateString();
};

// ✅ التعديل الأساسي: بنطابق القيم الفعلية من السيرفر بالظبط
const getStatusStyle = (status = '') => {
  const s = String(status || '').trim();

  if (s === 'Available')  return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (s === 'Busy')       return 'bg-rose-50 text-rose-600 border-rose-100';
  if (s === 'EnRoute')    return 'bg-blue-50 text-blue-600 border-blue-100';

  return 'bg-slate-50 text-slate-500 border-slate-200';
};

const NavItem = ({ icon, label, active = false, onClick }) => (
  <div onClick={onClick} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
    {icon} <span className="text-sm font-medium">{label}</span>
  </div>
);

const EmergencyUnits = ({ units = [], onDelete, admin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const firstName = admin?.firstName || localStorage.getItem('adminName') || 'Admin';
  const lastName = admin?.lastName || '';
  const userEmail = admin?.email || localStorage.getItem('adminEmail') || 'admin@system.com';
  const initials = (firstName.charAt(0) + (lastName ? lastName.charAt(0) : '')).toUpperCase();

  const getUnitIcon = (type = '') => {
    const t = String(type || '').toLowerCase();
    if (t.includes('ambulance') || t.includes('medical')) return <Truck className="text-blue-600" size={20} />;
    if (t.includes('fire'))   return <Truck className="text-red-600" size={20} />;
    if (t.includes('police')) return <ShieldCheck className="text-slate-800" size={20} />;
    return <Truck className="text-slate-400" size={20} />;
  };

  const confirmDelete = (unit) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete ${unit.name}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await onDelete(unit.id);
          Swal.fire({ title: 'Deleted!', icon: 'success', timer: 1000, showConfirmButton: false });
        } catch (error) {
          Swal.fire('Error', 'Failed to delete unit', 'error');
        }
      }
    });
  };

  const filteredUnits = units.filter(unit => 
    (unit.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(unit.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800/50 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg"><LayoutGrid size={20} /></div>
          <span className="text-xl font-bold tracking-tight">Admin Portal</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6 text-left">
          <NavItem icon={<LayoutGrid size={20} />} label="Dashboard"        onClick={() => navigate('/dashboard')} />
          <NavItem icon={<Truck size={20} />}       label="Emergency Units"  active={true} onClick={() => navigate('/units')} />
          <NavItem icon={<Users size={20} />}       label="Admin Management" onClick={() => navigate('/admin-management')} />
          <NavItem icon={<Settings size={20} />}    label="System Settings"  onClick={() => navigate('/settings')} />
        </nav>
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold uppercase">{initials}</div>
              <div className="text-left overflow-hidden">
                <p className="text-[12px] font-bold text-white truncate">{firstName}</p>
                <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8 text-left">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Emergency Units</h1>
            <p className="text-slate-500 text-sm">Managing all active response assets</p>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex space-x-3 text-slate-400 border-r pr-4">
                <Bell size={19} className="cursor-pointer hover:text-blue-600" />
                <Mail size={19} className="cursor-pointer hover:text-blue-600" />
                <Moon size={19} className="cursor-pointer hover:text-blue-600" />
             </div>
             <div className="flex items-center space-x-3 pl-2 cursor-pointer hover:opacity-80 transition-all" onClick={() => navigate('/profile')}>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 leading-none">{firstName} {lastName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Administrator</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-blue-600 font-bold border border-slate-100 uppercase text-xs">
                  {initials}
                </div>
                <ChevronDown size={14} className="text-slate-300" />
             </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-8 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-500" 
              />
            </div>
            <button onClick={() => navigate('/add-unit')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">
              <Plus size={18} /><span>Add New Unit</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-50">
                  <th className="pb-4 px-4">Unit Identification</th>
                  <th className="pb-4 px-4 text-center">Operation Status</th>
                  <th className="pb-4 px-4">Added On</th>
                  <th className="pb-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUnits.length > 0 ? filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-5 px-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-white border border-slate-100 shadow-sm">
                          {getUnitIcon(unit.type)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{unit.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">ID: {unit.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border shadow-sm ${getStatusStyle(unit.status)}`}>
                        {unit.status || 'Offline'}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-sm text-slate-500 font-medium">
                      {formatLastActive(unit.createdAt)}
                    </td>
                    <td className="py-5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-4 text-slate-300">
                          <Eye size={18} className="cursor-pointer hover:text-blue-600 transition-colors" />
                          <Pencil 
                            size={18} 
                            className="cursor-pointer hover:text-amber-500 transition-colors" 
                            onClick={() => navigate('/add-unit', { state: { unit } })} 
                          />
                          <Trash2 
                            size={18} 
                            className="cursor-pointer hover:text-rose-500 transition-colors" 
                            onClick={() => confirmDelete(unit)}
                          />
                        </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-slate-400 text-sm italic">
                      No units found in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmergencyUnits;