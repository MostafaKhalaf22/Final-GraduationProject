import React, { useState, useEffect } from 'react';
import { Shield, ChevronDown, UserPlus, X } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

const CreateAccount = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  const [availableRoles, setAvailableRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get('/api/Role/GetAll', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const rolesData = response.data.data || response.data;
        setAvailableRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      Swal.fire('خطأ', 'كلمات السر غير متطابقة', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin';

      const response = await axios.post('/api/AppUser/Create', {
        FirstName: firstName,
        LastName: lastName,
        Email: formData.email,
        Password: formData.password,
        PhoneNumber: formData.phoneNumber,
        RoleName: formData.role
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 200 || response.status === 201) {
        Swal.fire('نجاح!', 'تم إنشاء الحساب بنجاح', 'success');
        if (onClose) onClose();
      }
    } catch (error) {
      const serverMessage = error.response?.data?.Message || error.response?.data?.message;
      Swal.fire('فشل التسجيل', serverMessage || 'تأكد من البيانات', 'error');
    }
  };

  return (
    <div className="relative bg-white flex flex-col w-full  max-h-[90vh] overflow-hidden shadow-2xl">
      
      {/* زرار الإغلاق الثابت */}
      <button 
        onClick={onClose} 
        className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition-colors "
      >
        <X size={24} />
      </button>

      {/* الجزء القابل للسكرول */}
      <div className="overflow-y-auto p-8 custom-scrollbar">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="bg-[#111827] p-3 rounded-2xl mb-3 shadow-lg">
            <Shield className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">Create Account</h1>
          <p className="text-[#6B7280] mt-1 text-sm">Register a new user with system roles</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label className="block text-[#374151] text-xs font-bold mb-1.5 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter Name"
              className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl focus:bg-white outline-none text-[#111827] transition-all focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[#374151] text-xs font-bold mb-1.5 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl focus:bg-white outline-none text-[#111827] transition-all focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[#374151] text-xs font-bold mb-1.5 uppercase tracking-wider">Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              required
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+20123456789"
              className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl focus:bg-white outline-none text-[#111827] transition-all focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#374151] text-xs font-bold mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••"
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl focus:bg-white outline-none text-[#111827] transition-all focus:ring-2 focus:ring-[#111827]"
              />
            </div>
            <div>
              <label className="block text-[#374151] text-xs font-bold mb-1.5 uppercase tracking-wider">Confirm</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••"
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl focus:bg-white outline-none text-[#111827] transition-all focus:ring-2 focus:ring-[#111827]"
              />
            </div>
          </div>

          {/* Role Select */}
          <div>
            <label className="block text-[#374151] text-xs font-bold mb-1.5 uppercase tracking-wider">Assign Role</label>
            <div className="relative">
              <select 
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl appearance-none outline-none text-[#111827] transition-all focus:ring-2 focus:ring-[#111827]"
              >
                <option value="">{loadingRoles ? "Loading..." : "Select role"}</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-[0.98] mt-2"
          >
            <UserPlus size={20} className="mr-2" />
            <span>Create Account</span>
          </button>
        </form>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}</style>
    </div>
  );
};

export default CreateAccount;