import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ShieldCheck, LogIn, Loader2 } from 'lucide-react';

const UnitSignIn = () => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      localStorage.removeItem('unitToken');
      localStorage.removeItem('unitName');
      localStorage.removeItem('unitEmail');

const response = await axios.post('/api/Auth/SignIn', {
  userName: email.trim(),
  password: password.trim()
});

      if (response.data.succeeded === true || response.status === 200) {
        const userData = response.data.data;
        const tokenRaw =
          userData?.accessToken ||
          userData?.token ||
          userData?.access_token ||
          response.data?.accessToken ||
          response.data?.data?.accessToken ||
          response.data?.data?.token;

        const token = tokenRaw ? String(tokenRaw) : null;

        if (token) {
          // تخزين توكن الـ unit في مفتاح مستقل عن الأدمن
          localStorage.setItem('unitToken', token);
          localStorage.setItem('unitName', userData.firstName || "Unit");
          localStorage.setItem('unitEmail', userData.email || email.trim());
          // لو السيرفر بيرجع id/unitId هنخزنه، وإلا هنسيبه (ممكن تحدده يدويًا)
          const unitId = userData?.unitId ?? userData?.id ?? localStorage.getItem('unitId');
          if (unitId != null) localStorage.setItem('unitId', String(unitId));

          await Swal.fire({
            icon: 'success',
            title: 'Login successful',
            text: 'You are being redirected to the control panel.',
            timer: 1500,
            showConfirmButton: false,
            background: '#1e293b',
            color: '#fff'
          });

          navigate('/unit/dashboard'); 
          window.location.reload(); 
        } else {
          throw new Error("Token not found");
        }
      }
    } catch (error) {
      console.error("Login Error:", error.response?.data);
      const serverMessage = error.response?.data?.message || "بيانات الدخول غير صحيحة";
      
      Swal.fire({
        icon: 'error',
        title: 'فشل الدخول',
        text: serverMessage,
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 font-sans text-slate-200">
      
      {/* Header Logo & Title */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
          <ShieldCheck className="text-blue-500" size={28} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Emergency Response Command</h1>
          <p className="text-xs text-slate-500">Secure unit login</p>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[400px] bg-[#1e293b]/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-1 text-left">Login</h2>
          <p className="text-sm text-slate-400 text-left">Enter unit credentials to continue.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 ml-1 text-left">Email Address</label>
            <input
              type="email"
              required
              placeholder="unit@system.com"
              className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 ml-1 text-left">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={18} />}
            <span>{loading ? 'Verifying...' : 'Login'}</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/50 text-left">
          <p className="text-[10px] text-slate-600 italic leading-relaxed">
            Notice: Authorization is required for emergency unit access. Attempts are monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnitSignIn;