import React, { useState } from 'react';
import { Shield, UserPlus } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

const CreateRole = ({ onSuccess }) => {
  const token = localStorage.getItem('adminToken');
  const [roleTitle, setRoleTitle] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('roleName', roleTitle); 

    try {
      await axios.post('/api/Role/Add', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
        }
      });
      
      await Swal.fire({
        title: 'نجاح!',
        text: 'تم إنشاء الدور الجديد بنجاح',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error("Server Error Response:", error.response?.data);
      
      const serverData = error.response?.data;
      let errorDetail = "تأكد من أن الاسم غير مكرر أو املأ الحقول المطلوبة";

      if (serverData?.errors) {
        errorDetail = Object.values(serverData.errors).flat()[0];
      } else if (serverData?.title) {
        errorDetail = serverData.title;
      }

      Swal.fire({
        title: 'خطأ',
        text: errorDetail,
        icon: 'error',
        confirmButtonColor: '#111827'
      });
    }
  };

  return (
    <div className="bg-white flex flex-col items-center justify-center p-10 font-sans w-full  mx-auto text-left">
      
      {/* Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-[#111827] p-3 rounded-2xl mb-4 shadow-lg">
          <Shield className="text-white w-8 h-8" />
        </div>
        <h1 className="text-[28px] font-bold text-[#111827]">Create New Role</h1>
        <p className="text-[#6B7280] mt-2 text-[15px]">Register a new role for secure system access</p>
      </div>

      <div className="w-full">
        <form className="space-y-6 text-left" onSubmit={handleSubmit}>
          
          {/* Role Name */}
          <div>
            <label className="block text-[#374151] text-[14px] font-bold mb-2 uppercase tracking-wide">Role Name</label>
            <input
              type="text"
              required
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Enter role name"
              className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl focus:bg-white outline-none text-[#111827] transition-all focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all mt-4 shadow-lg active:scale-[0.98]"
          >
            <UserPlus size={20} className="mr-2" />
            <span>Create Role</span>
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreateRole;