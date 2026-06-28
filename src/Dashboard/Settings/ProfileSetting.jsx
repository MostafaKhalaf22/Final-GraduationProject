import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell, Save, Shield, LogOut, LayoutDashboard,
  Truck, History, Map, Users, Settings, Monitor, Lock
} from 'lucide-react';

const ProfileSetting = ({ admin = {}, onUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const token = localStorage.getItem('adminToken');

  const getUserId = () => {
    let id = localStorage.getItem('adminId') || localStorage.getItem('userId');
    if (id) return id;
    try {
      if (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        id = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] 
               || payload.nameid || payload.uid || payload.id || payload.Id || payload.sub;
      }
    } catch (e) { console.error("Token error", e); }
    return id;
  };

  const [formData, setFormData] = useState({
    firstName: localStorage.getItem('adminFirstName') || admin.firstName || '',
    lastName: localStorage.getItem('adminLastName') || admin.lastName || '',
    email: localStorage.getItem('adminEmail') || admin.email || '',
    phoneNumber: localStorage.getItem('adminPhone') || admin.phoneNumber || '', 
    role: admin.role || 'System Admin',
    bio: localStorage.getItem('adminBio') || admin.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [currentSession, setCurrentSession] = useState({
    os: "Detecting...",
    browser: "Detecting...",
    location: "Detecting..."
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    let browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : "Browser";
    let os = ua.includes("Win") ? "Windows PC" : ua.includes("Android") ? "Android" : "Device";
    setCurrentSession(prev => ({ ...prev, os, browser }));
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChangeInput = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    if(e) e.preventDefault();
    const userId = getUserId();
    if(!userId) return alert("❌ خطأ: لم يتم العثور على معرف المستخدم");
    if(!formData.phoneNumber) return alert("❌ لازم تكتب رقم التليفون");

    setIsSaving(true);
    const dataToSend = {
      id: userId,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(), 
      phoneNumber: String(formData.phoneNumber).trim()
    };

    try {
      const response = await fetch('/api/Profile/Edit', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
          localStorage.setItem('adminFirstName', dataToSend.firstName);
          localStorage.setItem('adminLastName', dataToSend.lastName);
          localStorage.setItem('adminName', `${dataToSend.firstName} ${dataToSend.lastName}`);
          localStorage.setItem('adminEmail', dataToSend.email);
          localStorage.setItem('adminPhone', dataToSend.phoneNumber);
          localStorage.setItem('adminBio', formData.bio);
          
          window.dispatchEvent(new Event("profileUpdate"));
          alert("✅ تم تحديث بياناتك بنجاح");
          if (onUpdate) onUpdate({ ...formData, ...dataToSend }); 
      } else {
          alert("❌ فشل التحديث في السيرفر");
      }
    } catch (error) { alert("❌ خطأ في السيرفر"); } 
    finally { setIsSaving(false); }
  };

  const handleUpdatePassword = async () => {
    const userId = getUserId();
    if(!userId) return alert("❌ User ID not found.");
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        return alert("❌ يرجى ملء جميع خانات كلمة المرور");
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        return alert("❌ كلمة المرور الجديدة غير متطابقة");
    }
    setIsChangingPassword(true);
    try {
        const response = await fetch(`/api/AppUser/ChangePassword?id=${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword
            })
        });
        if (response.ok) {
            alert("✅ تم تغيير كلمة المرور بنجاح");
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            alert("❌ فشل التحديث: تأكد من صحة كلمة المرور الحالية");
        }
    } catch (error) { alert("❌ مشكلة في الشبكة"); } 
    finally { setIsChangingPassword(false); }
  };

  const handleLogout = () => { 
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('userId');
    sessionStorage.clear();
    navigate('/'); 
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-left font-sans">
      <aside className="w-72 bg-[#111827] text-gray-400 flex flex-col fixed h-full shadow-2xl">
        <div className="p-6 flex items-center space-x-3 text-white border-b border-gray-800 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="bg-blue-600 p-2 rounded-lg"><Shield size={22} /></div>
          <span className="text-xl font-bold">Admin Portal</span>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2 text-left font-medium">
          <div onClick={() => navigate('/dashboard')} className="flex items-center space-x-3 p-3 hover:bg-gray-800 hover:text-white cursor-pointer rounded-lg transition-all"><LayoutDashboard size={20} /> <span className="text-sm">Dashboard</span></div>
          <div onClick={() => navigate('/units')} className="flex items-center space-x-3 p-3 hover:bg-gray-800 hover:text-white cursor-pointer rounded-lg transition-all"><Truck size={20} /> <span className="text-sm">Emergency Units</span></div>
          {/* <div onClick={() => navigate('/logs')} className="flex items-center space-x-3 p-3 hover:bg-gray-800 hover:text-white cursor-pointer rounded-lg transition-all"><History size={20} /> <span className="text-sm">Activity Log</span></div>
          <div onClick={() => navigate('/map')} className="flex items-center space-x-3 p-3 hover:bg-gray-800 hover:text-white cursor-pointer rounded-lg transition-all"><Map size={20} /> <span className="text-sm">Map View</span></div> */}
          <div onClick={() => navigate('/admin-management')} className="flex items-center space-x-3 p-3 hover:bg-gray-800 hover:text-white cursor-pointer rounded-lg transition-all"><Users size={20} /> <span className="text-sm">Admin Management</span></div>
          <div onClick={() => navigate('/settings')} className="flex items-center space-x-3 p-3 hover:bg-gray-800 hover:text-white cursor-pointer rounded-lg transition-all"><Settings size={20} /> <span className="text-sm">System Settings</span></div>
        </nav>

        <div className="p-4 border-t border-gray-800 bg-[#0F172A]">
          <div onClick={() => navigate('/profile')} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${location.pathname === '/profile' ? 'bg-blue-600/10 border-blue-600/30' : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/60'}`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border-2 border-blue-400/30 text-lg uppercase ">
                {formData.firstName.charAt(0) || 'A'}
              </div>
              <div className="text-left truncate">
                <p className={`text-sm font-bold truncate ${location.pathname === '/profile' ? 'text-blue-400' : 'text-white'}`}>
                    {formData.firstName} {formData.lastName}
                </p>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">{formData.role}</p>
              </div>
            </div>
            <LogOut size={16} className="text-gray-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleLogout(); }}/>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10 text-left">
        <header className="flex justify-between items-center mb-10">
          <div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile & Settings</h1><p className="text-sm text-gray-500 font-medium">Manage your personal account details</p></div>
          <button onClick={handleSave} disabled={isSaving} className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}><Save size={18} /> <span>{isSaving ? 'Saving...' : 'Save Changes'}</span></button>
        </header>

        <div className="space-y-8 max-w-6xl mx-auto">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-8">Profile Information</h2>
            <div className="flex gap-12">
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-blue-50 border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-blue-600 uppercase">
                  {formData.firstName.charAt(0) || 'A'}
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-6">
                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-600 uppercase block tracking-wider">First Name</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-600 uppercase block tracking-wider">Last Name</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" /></div>
                <div className="col-span-2 space-y-1.5"><label className="text-xs font-bold text-gray-600 uppercase block tracking-wider">Email Address</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-600 uppercase block tracking-wider">Phone Number</label><input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" /></div>
                <div className="col-span-2 space-y-1.5"><label className="text-xs font-bold text-gray-600 uppercase block tracking-wider">Bio</label><textarea name="bio" rows="3" value={formData.bio} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm resize-none outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Write a short bio..."></textarea></div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6"><div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Lock size={20} /></div><div><h2 className="text-lg font-bold text-gray-900">Account Security</h2><p className="text-sm text-gray-500">Change your account password</p></div></div>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1.5"><label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Current Password</label><input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChangeInput} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" /></div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-gray-600 uppercase tracking-wider">New Password</label><input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChangeInput} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" /></div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Confirm New Password</label><input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChangeInput} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" /></div>
            </div>
            <div className="mt-6 flex justify-end"><button onClick={handleUpdatePassword} disabled={isChangingPassword} className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-md">{isChangingPassword ? 'Updating...' : 'Update Password'}</button></div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Active Login Session</h2>
            <div className="flex justify-between items-center p-5 border border-blue-100 rounded-xl bg-blue-50/20 shadow-sm">
              <div className="flex items-center space-x-4"><Monitor className="text-blue-600" size={26} /><div><p className="text-sm font-bold text-gray-900">{currentSession.os} - {currentSession.browser}</p><p className="text-xs text-blue-600 font-bold">Active Now</p></div></div>
              <span className="text-[10px] bg-green-100 text-green-700 px-3 py-1 rounded-md font-bold uppercase tracking-widest">Current Device</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ProfileSetting;