import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react';

function getRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role =
      payload?.role ||
      payload?.Role ||
      payload?.roles ||
      payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      '';
    if (Array.isArray(role)) return role[0] ?? '';
    return String(role);
  } catch {
    return '';
  }
}

function getEmailFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload?.Email || payload?.email || payload?.UserName || payload?.userName || '').toLowerCase();
  } catch {
    return '';
  }
}

function getDestination(role, email) {
  const r = role.toLowerCase();

  // أدمن
  if (r.includes('admin')) return '/dashboard';

  // لو الـ role هو ResponseUnit نفرق بالـ email
  // الـ bin collectors عندهم email فيه waste أو bin
  if (r.includes('responseunit') || r.includes('unit') || r.includes('responder') || r.includes('response')) {
    if (email.includes('waste') || email.includes('bin') || email.includes('collector')) {
      return '/bin/home';
    }
    return '/unit/dashboard';
  }

  // لو في role صريح للـ bin
  if (r.includes('bin') || r.includes('collector')) return '/bin/home';

  // default
  return '/unit/dashboard';
}

const SmartLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    localStorage.clear();

    try {
      const response = await axios.post('/api/Auth/SignIn', {
        userName: username.trim(),
        password: password.trim(),
      });

      const userData = response.data?.data ?? response.data;
      const token =
        userData?.accessToken ||
        userData?.token ||
        userData?.access_token ||
        response.data?.accessToken ||
        null;

      if (!token) throw new Error('Token not found in response');

      const role = getRoleFromToken(token);
      const email = getEmailFromToken(token);
      const destination = getDestination(role, email);

      const name = userData?.firstName || userData?.fullName || userData?.userName || 'User';
      const userEmail = userData?.email || username.trim();
      const userId = userData?.id || userData?.userId || '';

      if (destination === '/dashboard') {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminName', name);
        localStorage.setItem('adminFirstName', name);
        localStorage.setItem('adminLastName', userData?.lastName || '');
        localStorage.setItem('adminEmail', userEmail);
        localStorage.setItem('adminId', userId);
        if (userData?.phoneNumber) localStorage.setItem('adminPhone', userData.phoneNumber);
      } else if (destination === '/bin/home') {
        localStorage.setItem('binToken', token);
        localStorage.setItem('unitToken', token); // عشان الـ binApi كمان بيقرأ unitToken
        localStorage.setItem('binName', name);
        localStorage.setItem('binEmail', userEmail);
        localStorage.setItem('userRole', 'BinCollector');
      } else {
        localStorage.setItem('unitToken', token);
        localStorage.setItem('unitName', name);
        localStorage.setItem('unitEmail', userEmail);
        if (userId) localStorage.setItem('unitId', String(userId));
      }

      await Swal.fire({
        icon: 'success',
        title: 'Welcome!',
        text: 'Redirecting to your dashboard...',
        timer: 1200,
        showConfirmButton: false,
        background: '#fff',
        color: '#0a1628',
      });

      navigate(destination);

    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.message ||
        'Invalid credentials. Please try again.';

      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: msg,
        confirmButtonColor: '#0a1628',
        background: '#fff',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e8f5e9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72,
            background: '#0a1628',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(10,22,40,0.2)',
          }}>
            <span style={{ fontSize: 32 }}>⦿</span>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 3 }}>
            Smart City System
          </p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0a1628', letterSpacing: -1 }}>
            Welcome Back
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>
            Sign in to access your dashboard
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
        }}>

          {/* Info badge */}
          <div style={{
            background: 'rgba(20,232,66,0.08)',
            border: '1px solid rgba(20,232,66,0.2)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <ShieldCheck size={16} color="#14e842" />
            <p style={{ margin: 0, fontSize: 12, color: '#15803d', fontWeight: 600 }}>
              System auto-detects your role and redirects you
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Username */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <User size={17} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: 12, padding: '13px 14px 13px 42px',
                    fontSize: 14, color: '#0a1628', outline: 'none',
                    transition: 'border .2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#14e842'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Lock size={17} />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: 12, padding: '13px 44px 13px 42px',
                    fontSize: 14, color: '#0a1628', outline: 'none',
                    transition: 'border .2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#14e842'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#94a3b8' : '#0a1628',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '15px',
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: 1,
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'background .2s',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Role hints */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: 1 }}>Access Levels</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { role: 'Admin', color: '#6366f1', desc: 'Full system control' },
                { role: 'Unit Responder', color: '#3b82f6', desc: 'Emergency dashboard' },
                { role: 'Bin Collector', color: '#14e842', desc: 'Collection dashboard' },
              ].map(({ role, color, desc }) => (
                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{role}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>— {desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#94a3b8' }}>
          Smart City Management System © 2025
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SmartLogin;