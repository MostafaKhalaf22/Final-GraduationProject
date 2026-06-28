import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Save, X, Loader2 } from 'lucide-react';
import { getMyProfile } from '../../api/binApi';
import Swal from 'sweetalert2';

export default function BinProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    phoneNumber: '',
  });

  // جلب البيانات من الـ API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getMyProfile();
        if (data) {
          setProfile(data);
          const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
          setFormData({
            fullName: fullName || data.fullName || '',
            address: data.address || data.location || '',
            phoneNumber: data.phoneNumber || data.phone || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // حفظ التغييرات
  const handleSave = async () => {
    setSaving(true);
    try {
      // تحديث البروفايل المحلي
      setProfile(prev => ({ ...prev, ...formData }));
      
      // تحديث الـ localStorage
      localStorage.setItem('binName', formData.fullName);
      localStorage.setItem('binEmail', profile?.email || '');

      setEditing(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: 'Your changes have been saved successfully.',
        timer: 2000,
        showConfirmButton: false,
        background: '#fff',
        confirmButtonColor: '#14e842'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save changes',
        background: '#fff',
        confirmButtonColor: '#14e842'
      });
    } finally {
      setSaving(false);
    }
  };

  // إلغاء التعديل
  const handleCancel = () => {
    const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();
    setFormData({
      fullName: fullName || profile?.fullName || '',
      address: profile?.address || profile?.location || '',
      phoneNumber: profile?.phoneNumber || profile?.phone || '',
    });
    setEditing(false);
  };

  // حساب الحروف الأولى
  const getInitials = () => {
    const name = formData.fullName || profile?.fullName || 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        gap: 16
      }}>
        <Loader2 size={40} color="#14e842" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>Loading profile...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '0 auto', 
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }}>

      {/* ══════════ Profile Header ══════════ */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0a1628 0%, #1e293b 100%)',
        borderRadius: 24,
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        {/* Profile Picture */}
        <div style={{ 
          width: 100, 
          height: 100, 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #14e842, #0a9e30)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          fontWeight: 900,
          color: '#0a1628',
          margin: '0 auto 16px',
          boxShadow: '0 0 0 4px rgba(20,232,66,0.3)',
        }}>
          {profile?.profileImage ? (
            <img src={profile.profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            getInitials()
          )}
        </div>

        {/* Name */}
        <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 900, color: '#fff' }}>
          {formData.fullName || 'User'}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          {profile?.email || '—'}
        </p>
      </div>

      {/* ══════════ Edit / Save Buttons ══════════ */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        {editing ? (
          <>
            <button 
              onClick={handleCancel}
              disabled={saving}
              style={{ 
                background: '#f1f5f9', 
                color: '#64748b', 
                border: '1px solid #e2e8f0',
                borderRadius: 12, 
                padding: '12px 24px', 
                fontSize: 13, 
                fontWeight: 900, 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
              }}
            >
              <X size={16} />
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              style={{ 
                background: '#14e842', 
                color: '#0a1628', 
                border: 'none',
                borderRadius: 12, 
                padding: '12px 24px', 
                fontSize: 13, 
                fontWeight: 900, 
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                opacity: saving ? 0.6 : 1,
                boxShadow: '0 4px 16px rgba(20,232,66,0.3)',
              }}
            >
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        ) : (
          <button 
            onClick={() => setEditing(true)}
            style={{ 
              background: '#0a1628', 
              color: '#fff', 
              border: 'none',
              borderRadius: 12, 
              padding: '12px 24px', 
              fontSize: 13, 
              fontWeight: 900, 
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
            }}
          >
            <User size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {/* ══════════ Profile Information ══════════ */}
      <div style={{ 
        background: '#fff',
        borderRadius: 20,
        padding: '28px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <User size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Full Name
            </label>
            {editing ? (
              <input 
                value={formData.fullName} 
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your full name"
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  borderRadius: 12, 
                  border: '2px solid #e2e8f0', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#0a1628',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => { e.target.style.borderColor = '#14e842'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0a1628', padding: '14px 0' }}>
                {formData.fullName || '—'}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <Phone size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Phone Number
            </label>
            {editing ? (
              <input 
                value={formData.phoneNumber} 
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="Enter your phone number"
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  borderRadius: 12, 
                  border: '2px solid #e2e8f0', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#0a1628',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => { e.target.style.borderColor = '#14e842'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0a1628', padding: '14px 0' }}>
                {formData.phoneNumber || '—'}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <MapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Address
            </label>
            {editing ? (
              <input 
                value={formData.address} 
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter your address"
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  borderRadius: 12, 
                  border: '2px solid #e2e8f0', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#0a1628',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => { e.target.style.borderColor = '#14e842'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0a1628', padding: '14px 0' }}>
                {formData.address || '—'}
              </p>
            )}
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}