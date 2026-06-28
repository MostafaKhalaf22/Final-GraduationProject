import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Eye, EyeOff, User, Lock, ArrowRight } from 'lucide-react';

const BinSignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

   const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      localStorage.clear();

      // ✅ التعديل الأول: تغيير الرابط عشان نستخدم الـ Proxy
      // ✅ التعديل الثاني: تغيير email إلى username
      const response = await axios.post('/api/Auth/SignIn', {
        userName: username.trim(), 
        password: password.trim()
      });

      if (response.data.succeeded === true || response.status === 200) {
        const userData = response.data.data;
        const token = userData?.accessToken || userData?.token;
        
        if (token) {
          // حفظ التوكن
          localStorage.setItem('binToken', token);
          localStorage.setItem('userRole', 'BinCollector');

          await Swal.fire({
            icon: 'success',
            title: 'Welcome Back!',
            text: 'Redirecting to your dashboard...',
            timer: 1500,
            showConfirmButton: false,
            background: '#fff',
            color: '#1a1a2e'
          });

          // التوجيه المباشر لداشبورد الـ Bin
          window.location.href = '/bin/home';
        } else {
          throw new Error("Token not found");
        }
      }
    } catch (error) {
      console.error("Login Error:", error.response?.data || error.message);
      const serverMessage = error.response?.data?.message || "Invalid credentials or server error";
      
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: serverMessage,
        background: '#fff',
        color: '#1a1a2e',
        confirmButtonColor: '#22c55e'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl mb-4 shadow-lg shadow-green-500/20">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="8" fill="#22c55e"/>
              <path d="M8 20C8 20 12 16 20 16C28 16 32 20 32 20" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 20C8 20 12 24 20 24C28 24 32 20 32 20" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-xs font-bold text-gray-500 tracking-[0.2em] mb-2">SMARTBINS INDUSTRIAL</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 tracking-wider uppercase">Username</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="industrial_user_01"
                  className="w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-gray-500 tracking-wider uppercase">Password</label>
                <button 
                  type="button"
                  className="text-xs font-bold text-green-600 hover:text-green-700 transition-colors"
                  onClick={() => Swal.fire({
                    title: 'Forgot Password?',
                    text: 'Please contact your administrator to reset your password.',
                    icon: 'info',
                    background: '#fff',
                    color: '#1a1a2e',
                    confirmButtonColor: '#22c55e'
                  })}
                >
                  {/* FORGOT PASSWORD? */}
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-12 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-green-500/30"
            >
              <span className="tracking-wider">LOG IN</span>
              <ArrowRight size={18} className={loading ? 'animate-pulse' : ''} />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            {/* <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-gray-400 font-bold tracking-wider">OR</span>
            </div> */}
          </div>

          {/* Create Account Button */}
         
        </div>
      </div>
    </div>
  );
};

export default BinSignIn;