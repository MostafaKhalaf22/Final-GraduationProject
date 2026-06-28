import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, Users, UserPlus, Check, X, LayoutDashboard, 
  Truck, History, Map, Settings, LogOut, Edit2, Trash2, Plus 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import CreateRole from '../CreateRole/CreateRole'; 
import CreateAccount from '../CreateAccount/CreateAccount'; 

const AdminManagement = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const [adminData, setAdminData] = useState({
    name: localStorage.getItem('adminName') || "Admin User",
    email: localStorage.getItem('adminEmail') || "admin@system.com"
  });

  const token = localStorage.getItem('adminToken');

  // الأدوار المحمية (ممنوع التعديل أو الحذف)
  const protectedRoles = ['Admin', 'Citizen', 'Unit', 'ResponseUnit'];

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/Role/GetAll', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = response.data.data || response.data; 
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch Error:", error);
      setRoles([
        { id: '1', name: 'Admin' },
        { id: '2', name: 'Citizen' },
        { id: '3', name: 'Unit' },
        { id: '4', name: 'ResponseUnit' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchRoles(); 
    const handleProfileSync = () => {
      setAdminData({
        name: localStorage.getItem('adminName') || "Admin User",
        email: localStorage.getItem('adminEmail') || "admin@system.com"
      });
    };
    window.addEventListener("profileUpdate", handleProfileSync);
    return () => window.removeEventListener("profileUpdate", handleProfileSync);
  }, []);

  const handleDelete = async (id, roleName) => {
    if (protectedRoles.includes(roleName)) return; 
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: "سيتم حذف هذا الدور نهائياً!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/Role/Delete/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        Swal.fire('تم!', 'تم حذف الدور بنجاح.', 'success');
        fetchRoles();
      } catch (error) {
        Swal.fire('خطأ', 'فشل في الحذف', 'error');
      }
    }
  };

  const handleEdit = async (role) => {
    if (protectedRoles.includes(role.name)) return; 
    const { value: newName } = await Swal.fire({
      title: 'تعديل اسم الدور',
      input: 'text',
      inputValue: role.name,
      showCancelButton: true,
      confirmButtonText: 'حفظ',
      cancelButtonText: 'إلغاء'
    });
    if (newName) {
      try {
        await axios.put(`/api/Role/Edit`, {
          id: role.id,
          newRoleName: newName 
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        Swal.fire('نجاح', 'تم التحديث بنجاح', 'success');
        fetchRoles();
      } catch (error) {
        Swal.fire('خطأ', 'فشل التعديل', 'error');
      }
    }
  };

  const handleLogout = () => { 
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    navigate('/'); 
    window.location.reload(); 
  };

  const sidebarItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Emergency Units', icon: <Truck size={20} />, path: '/units' },
    // { name: 'Activity Log', icon: <History size={20} />, path: '/logs' },
    // { name: 'Map View', icon: <Map size={20} />, path: '/map' },
    { name: 'Admin Management', icon: <Users size={20} />, path: '/admin-management', active: true },
    { name: 'System Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans text-left relative">
      
      {/* Modals */}
      {showCreateRole && (
        <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[500px] p-2 overflow-hidden">
            <button onClick={() => setShowCreateRole(false)} className="absolute top-6 right-8 text-gray-400 hover:text-red-500 z-[1001]"><X size={24} /></button>
            <CreateRole onSuccess={() => { fetchRoles(); setShowCreateRole(false); }} /> 
          </div>
        </div>
      )}

      {showCreateAccount && (
        <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[500px] p-2 overflow-hidden">
            <button onClick={() => setShowCreateAccount(false)} className="absolute top-6 right-8 text-gray-400 hover:text-red-500 z-[1001]"><X size={24} /></button>
            <CreateAccount onClose={() => setShowCreateAccount(false)} /> 
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-72 bg-[#111827] text-gray-400 flex flex-col fixed h-full shadow-2xl">
        <div className="p-6 flex items-center space-x-3 text-white border-b border-gray-800 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="bg-blue-600 p-2 rounded-lg"><Shield size={22} /></div>
          <span className="text-xl font-bold tracking-tight">Admin Portal</span>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          {sidebarItems.map((item) => (
            <div key={item.name} onClick={() => navigate(item.path)} className={`flex items-center space-x-3 p-3 cursor-pointer rounded-lg transition-all ${item.active ? 'bg-blue-600/10 border border-blue-600/30 text-white font-bold' : 'hover:bg-gray-800 hover:text-white'}`}>
              {item.icon} <span className="text-sm">{item.name}</span>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 bg-[#0F172A]">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800 transition-all">
            <div onClick={() => navigate('/profile')} className="flex items-center space-x-3 cursor-pointer flex-1 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold uppercase">{adminData.name.charAt(0)}</div>
              <div className="text-left overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{adminData.name}</p>
                <p className="text-[10px] text-blue-400 font-bold truncate">{adminData.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 p-2"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10 text-left">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Roles & Permissions</h1>
            <p className="text-gray-500 mt-1 font-medium italic text-sm">System Roles Management</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => setShowCreateRole(true)} className="flex items-center space-x-2 px-5 py-2.5 bg-[#111827] text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-all active:scale-95"><Plus size={18} /> <span>Add Role</span></button>
            <button onClick={() => setShowCreateAccount(true)} className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all active:scale-95"><UserPlus size={18} /> <span>Add Admin</span></button>
          </div>
        </header>

        {/* Table Section */}
        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-10">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-base font-bold text-gray-900">Administrator Accounts</h2>
          </div>

          {/* Table Head */}
          <div className="grid px-5 py-3 border-b border-gray-50" style={{gridTemplateColumns:'2fr 1.5fr 1fr 80px'}}>
            {['Role','Permissions','Type','Actions'].map((h, i) => (
              <span key={h} className={`text-[11px] font-medium text-gray-400 uppercase tracking-widest ${i === 3 ? 'text-right' : ''}`}>{h}</span>
            ))}
          </div>

          {/* Table Rows */}
          {roles.map((role, index) => {
            const isProtected = protectedRoles.includes(role.name);
            const colorPalette = [
              { bg: '#E6F1FB', text: '#0C447C' },
              { bg: '#E1F5EE', text: '#085041' },
              { bg: '#EEEDFE', text: '#3C3489' },
              { bg: '#FAEEDA', text: '#633806' },
              { bg: '#FAECE7', text: '#712B13' },
              { bg: '#FBEAF0', text: '#72243E' },
            ];
            const color = colorPalette[index % colorPalette.length];
            const initials = role.name.slice(0, 2).toUpperCase();

            return (
              <div
                key={role.id}
                className="grid px-5 py-3.5 items-center border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors"
                style={{gridTemplateColumns:'2fr 1.5fr 1fr 80px'}}
              >
                {/* Role cell */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-none">{role.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">#{String(index + 1).padStart(3, '0')}</p>
                  </div>
                </div>

                {/* Permissions cell */}
                <p className="text-xs text-gray-500">Full access to {role.name}</p>

                {/* Type badge */}
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full w-fit"
                  style={isProtected ? { background: '#F1EFE8', color: '#5F5E5A' } : { background: '#E1F5EE', color: '#085041' }}
                >
                  {isProtected ? <Shield size={9} /> : <Check size={9} />}
                  {isProtected ? 'System' : 'Custom'}
                </span>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleEdit(role)}
                    disabled={isProtected}
                    title="Edit"
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all
                      ${isProtected
                        ? 'opacity-25 cursor-not-allowed border-gray-100 text-gray-300'
                        : 'border-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 active:scale-95'}`}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(role.id, role.name)}
                    disabled={isProtected}
                    title="Delete"
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all
                      ${isProtected
                        ? 'opacity-25 cursor-not-allowed border-gray-100 text-gray-300'
                        : 'border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 active:scale-95'}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Roles Grid (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roles.map((role, index) => {
            const isProtected = protectedRoles.includes(role.name);
            const colorPalette = [
              { bg: '#E6F1FB', text: '#0C447C' },
              { bg: '#E1F5EE', text: '#085041' },
              { bg: '#EEEDFE', text: '#3C3489' },
              { bg: '#FAEEDA', text: '#633806' },
              { bg: '#FAECE7', text: '#712B13' },
              { bg: '#FBEAF0', text: '#72243E' },
            ];
            const color = colorPalette[index % colorPalette.length];
            const initials = role.name.slice(0, 2).toUpperCase();

            return (
              <div
                key={role.id}
                className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-200 transition-all text-left"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-none mb-1">{role.name}</p>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={
                        isProtected
                          ? { background: '#F1EFE8', color: '#5F5E5A' }
                          : { background: '#E1F5EE', color: '#085041' }
                      }
                    >
                      {isProtected ? (
                        <><Shield size={10} /> System</>
                      ) : (
                        <><Check size={10} /> Custom</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-50" />

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(role)}
                    disabled={isProtected}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-100 text-xs font-medium text-gray-500 transition-all
                      ${isProtected ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-50 hover:text-gray-800 hover:border-gray-200 active:scale-95'}`}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role.id, role.name)}
                    disabled={isProtected}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-100 text-xs font-medium text-red-400 transition-all
                      ${isProtected ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95'}`}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default AdminManagement;