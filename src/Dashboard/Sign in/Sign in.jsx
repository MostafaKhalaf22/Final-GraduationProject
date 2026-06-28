import React, { useState } from 'react';
import { Shield, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import Swal from 'sweetalert2'; // استيراد المكتبة

const SignIn = () => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      localStorage.clear();

const response = await axios.post('/api/Auth/SignIn', {
  userName: email.trim(),
  password: password.trim()
});

      if (response.data.succeeded === true || response.status === 200) {
        const userData = response.data.data;
        const token = userData?.accessToken;
        
        if (token) {
            localStorage.setItem('adminToken', token); 
            localStorage.setItem('adminName', userData.firstName || "Admin"); 
            localStorage.setItem('adminLastName', userData.lastName || "");
            localStorage.setItem('adminEmail', userData.email || email.trim());
            localStorage.setItem('adminId', userData.id || "");
            
            if(userData.phoneNumber) localStorage.setItem('adminPhone', userData.phoneNumber);

            // ✅ تبديل الـ alert بـ SweetAlert2 للنجاح
            await Swal.fire({
              icon: 'success',
              title: 'Login successful',
              text: 'You are being redirected to the control panel.',
              timer: 2000,
              showConfirmButton: false,
              timerProgressBar: true,
              position: 'center'
            });
            
            navigate('/dashboard'); 
            window.location.reload(); 
        } else {
            // ✅ تنبيه في حالة عدم وجود Token
            Swal.fire({
              icon: 'warning',
              title: 'خطأ في المصادقة',
              text: 'السيرفر لم يرسل مفتاح الدخول (Token)',
              confirmButtonColor: '#111'
            });
        }
      }
    } catch (error) {
      console.error("Login Error:", error.response?.data);
      const serverMessage = error.response?.data?.message || "بيانات الدخول غير صحيحة";
      
      // ✅ تبديل الـ alert بـ SweetAlert2 للخطأ
      Swal.fire({
        icon: 'error',
        title: 'فشل الدخول',
        text: serverMessage,
        confirmButtonText: 'حاول مرة أخرى',
        confirmButtonColor: '#111'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-[450px]">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#222] p-3 rounded-xl mb-4">
            <Shield className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-800">Admin Portal</h1>
          <p className="text-gray-500 mt-1 text-center">Welcome! Log in to control the system</p>
        </div>

        <form className="space-y-5" onSubmit={handleSignIn} autoComplete="off">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Username/Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                <Mail size={20} />
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartcity.com" 
                className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all text-gray-600 pr-10 pl-4 py-3 border text-right"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">password</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                <Lock size={20} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all text-gray-600 pr-10 pl-4 py-3 border text-right"
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-[#111] hover:bg-black text-white font-medium py-3 rounded-lg flex items-center justify-center space-x-2 space-x-reverse transition-all shadow-md">
            <LogIn size={20} />
            <span>Confirm and login</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;