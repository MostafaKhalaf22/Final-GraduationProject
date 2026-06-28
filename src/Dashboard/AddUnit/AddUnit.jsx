import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  LayoutGrid, Truck, Activity, Users, Settings, Bell, Mail, LogOut, ChevronDown, Plus, Moon, Eye, EyeOff
} from 'lucide-react';

const NavItem = ({ icon, label, active = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const AddUnit = ({ onAdd }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.unit; 

  const [adminData] = useState({
    name: localStorage.getItem('adminName') || 'Admin User',
    email: localStorage.getItem('adminEmail') || 'admin@system.com'
  });

  const [formData, setFormData] = useState({
    name: '',
    type: 'Medical', 
    status: 'Available',
    isActive: true,
    contactName: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        type: editData.type || 'Medical',
        status: editData.status || 'Available',
        isActive: editData.isActive ?? true,
        contactName: editData.contactName || '',
        email: editData.email || '',
        password: '',
        phone: editData.contact || editData.phoneNumber || '', 
        address: editData.address || ''
      });
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
      await Swal.fire({
        icon: 'warning',
        title: 'Unauthorized',
        text: 'سجل دخولك كأدمن مرة أخرى لإضافة وحدة.',
      });
      navigate('/');
      return;
    }

    const CREATE_URL = '/api/admin/response-units/create';
    const UPDATE_URL = '/api/admin/response-units/update';

    const config = {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // ✅ التعديل الأول: بنبعت formData.status الفعلي مش قيمة ثابتة
    const payload = {
      name: formData.name,
      type: formData.type,
      status: formData.status,   // ✅ القيمة اللي اختارها المستخدم فعلاً
      isActive: formData.isActive,
      contact: formData.phone,
      contactName: formData.contactName,
      email: formData.email,
      password: formData.password,
      address: formData.address
    };

    try {
      if (editData) {
        const updatePayload = { ...payload, id: editData.id };
        await axios.put(UPDATE_URL, updatePayload, config);
      } else {
        await axios.post(CREATE_URL, payload, config);
      }

      await Swal.fire({ 
        icon: 'success', 
        title: 'نجاح', 
        text: editData ? 'تم التعديل بنجاح' : 'تم إضافة الوحدة بنجاح', 
        timer: 1500,
        showConfirmButton: false 
      });
      
      // ✅ الإصلاح: بننادي fetchUnits أول وبننتظرها تخلص تماماً
      // قبل ما ننتقل للصفحة التانية عشان الـ units state يتحدث بالـ status الصح
      if (onAdd) await onAdd();
      navigate('/units');

    } catch (error) {
      console.error("Server Error:", error.response?.data);
      const errorMessage = error.response?.data?.errors?.[0] || error.response?.data?.message || "فشلت العملية";
      Swal.fire({ icon: 'error', title: 'خطأ', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800/50">
          <div className="bg-blue-600 p-1.5 rounded-lg"><LayoutGrid size={20} /></div>
          <span className="text-xl font-bold tracking-tight">Admin Portal</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6 text-left">
          <NavItem icon={<LayoutGrid size={20} />} label="Dashboard" onClick={() => navigate('/dashboard')} />
          <NavItem icon={<Truck size={20} />} label="Emergency Units" active={true} onClick={() => navigate('/units')} />
          <NavItem icon={<Users size={20} />} label="Admin Management" onClick={() => navigate('/admin-management')} />
          <NavItem icon={<Settings size={20} />} label="System Settings" onClick={() => navigate('/settings')} />
        </nav>
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden text-left">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs uppercase">
               {adminData.name.substring(0,2)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate w-24">{adminData.name}</p>
            </div>
          </div>
          <button onClick={() => {localStorage.clear(); navigate('/')}} className="text-slate-500 hover:text-white">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8 text-left">
        {/* Header */}
        <div className="flex justify-end items-center space-x-6 mb-6">
           <div className="flex space-x-4 text-slate-400 border-r pr-6">
              <Bell size={20} className="cursor-pointer hover:text-blue-600" />
              <Mail size={20} className="cursor-pointer hover:text-blue-600" />
              <Moon size={20} className="cursor-pointer hover:text-blue-600" />
           </div>
           <div className="flex items-center space-x-3">
              <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{adminData.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-blue-600 border border-slate-200 uppercase text-sm">
                {adminData.name.substring(0,2)}
              </div>
              <ChevronDown size={14} className="text-slate-400" />
           </div>
        </div>

        <div className="max-w-4xl">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="text-[12px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                Emergency Units <span className="mx-1">›</span> <span className="text-slate-800">{editData ? 'Edit Unit' : 'Add Unit'}</span>
              </div>
              <h1 className="text-3xl font-bold text-[#0f172a]">{editData ? 'Edit Unit Account' : 'Create Emergency Unit Account'}</h1>
            </div>
            
            <button 
              form="unit-form" 
              type="submit"
              disabled={loading}
              className={`${loading ? 'bg-slate-400' : 'bg-[#4182f9] hover:bg-blue-700'} text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 text-sm font-bold transition-all shadow-lg active:scale-95`}
            >
              <Plus size={18} />
              <span>{loading ? 'Processing...' : (editData ? 'Update Unit' : 'Add Unit')}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 mb-10">
            {/* ✅ التعديل الثاني: autoComplete="off" على الفورم كله */}
            <form id="unit-form" onSubmit={handleSubmit} autoComplete="off" className="space-y-12">
              <section>
                <h2 className="text-[12px] font-bold text-[#64748B] uppercase tracking-widest mb-8">Basic Information</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="col-span-2 flex flex-col space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">Unit Name *</label>
                    <input 
                      type="text" required placeholder="Enter emergency unit name"
                      autoComplete="off"
                      className="w-full p-3.5 border border-slate-200 rounded-xl focus:border-blue-500 text-sm outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">Unit Type *</label>
                    <select 
                      required className="w-full p-3.5 border border-slate-200 rounded-xl text-sm outline-none"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Medical">Medical (Ambulance)</option>
                      <option value="Fire">Fire</option>
                      <option value="Police">Police Car</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">Status *</label>
                    <select 
                      required className="w-full p-3.5 border border-slate-200 rounded-xl text-sm outline-none"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="EnRoute">EnRoute</option>
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-[12px] font-bold text-[#64748B] uppercase tracking-widest mb-8">Account & Contact</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="col-span-2 flex flex-col space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">Primary Contact Name *</label>
                    <input 
                      type="text" required placeholder="Enter contact person name"
                      autoComplete="off"
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-sm outline-none"
                      value={formData.contactName}
                      onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">Email Address (Username) *</label>
                    <input 
                      type="email" required placeholder="contact@example.com"
                      autoComplete="off"   
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-sm outline-none"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col space-y-2 relative">
                    <label className="text-[13px] font-bold text-slate-700">Account Password *</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required={!editData} 
                        placeholder="••••••••"
                        autoComplete="new-password"  
                        className="w-full p-3.5 border border-slate-200 rounded-xl text-sm outline-none pr-10"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">Phone Number *</label>
                    <input 
                      type="tel" required placeholder="+20 123 456 7890"
                      autoComplete="off"
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-sm outline-none"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">Street Address *</label>
                    <input 
                      type="text" required placeholder="Enter full street address"
                      autoComplete="off"
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-sm outline-none"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>
              </section>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddUnit;