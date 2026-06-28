import React, { useState } from 'react';
import { 
  Bell, 
  Mail, 
  Shield, 
  Lock, 
  Smartphone, 
  LogOut, 
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  User,
  HelpCircle,
  Edit2
} from 'lucide-react';

export default function BinSettings() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailReports, setEmailReports] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  const handleLogout = () => {
    ['binToken', 'unitToken', 'binName', 'binEmail'].forEach(k => localStorage.removeItem(k));
    window.location.href = '/bin/login';
  };

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: '0 auto', 
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }}>
      {/* Profile Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
        borderRadius: 24,
        padding: '32px 24px',
        textAlign: 'center',
        border: '2px dashed #14e842',
        position: 'relative'
      }}>
        {/* Profile Picture */}
        <div style={{ 
          position: 'relative', 
          display: 'inline-block',
          marginBottom: 16
        }}>
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
            color: '#fff',
            boxShadow: '0 4px 16px rgba(20,232,66,0.3)',
            overflow: 'hidden'
          }}>
            {/* لو فيه صورة حقيقية، استخدم <img> */}
            <span>W</span>
          </div>
          <div style={{ 
            position: 'absolute', 
            bottom: 4, 
            right: 4,
            width: 28,
            height: 28,
            background: '#14e842',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid #fff'
          }}>
            <Edit2 size={14} color="#0a1628" />
          </div>
        </div>

        {/* Name & Email */}
        <h2 style={{ 
          margin: '0 0 4px', 
          fontSize: 24, 
          fontWeight: 900, 
          color: '#0a1628'
        }}>
          WasteUnit1
        </h2>
        <p style={{ 
          margin: '0 0 12px', 
          fontSize: 14, 
          color: '#64748b'
        }}>
          wasteunit1@smartbins.com
        </p>

        {/* Admin Badge */}
        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(20,232,66,0.1)',
          color: '#14e842',
          padding: '6px 16px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 16
        }}>
        
        </div>

        
      </div>

      {/* Notification Settings */}
      <div style={{ 
        background: '#fff',
        borderRadius: 20,
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #f1f5f9'
        }}>
          <Bell size={20} color="#94a3b8" />
          <h3 style={{ 
            margin: 0, 
            fontSize: 13, 
            fontWeight: 900, 
            color: '#0a1628',
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            Notification Settings
          </h3>
        </div>

        {/* Push Notifications */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px 0',
          borderBottom: '1px solid #f8fafc'
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#0a1628' }}>
              Push Notifications
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
              System alerts & critical updates
            </p>
          </div>
          <button 
            onClick={() => setPushNotifications(!pushNotifications)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: 0
            }}
          >
            {pushNotifications ? (
              <ToggleRight size={32} color="#14e842" />
            ) : (
              <ToggleLeft size={32} color="#cbd5e1" />
            )}
          </button>
        </div>

        {/* Email Reports */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px 0'
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#0a1628' }}>
              Email Reports
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
              Weekly efficiency analytics
            </p>
          </div>
          <button 
            onClick={() => setEmailReports(!emailReports)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: 0
            }}
          >
            {emailReports ? (
              <ToggleRight size={32} color="#14e842" />
            ) : (
              <ToggleLeft size={32} color="#cbd5e1" />
            )}
          </button>
        </div>
      </div>

      {/* Account Security */}
      <div style={{ 
        background: '#fff',
        borderRadius: 20,
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #f1f5f9'
        }}>
          <Shield size={20} color="#94a3b8" />
          <h3 style={{ 
            margin: 0, 
            fontSize: 13, 
            fontWeight: 900, 
            color: '#0a1628',
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            Account Security
          </h3>
        </div>

        {/* Change Password */}
        <div 
          onClick={() => {/* فتح مودال تغيير الباسورد */}}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: '1px solid #f8fafc',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              background: 'rgba(20,232,66,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={18} color="#14e842" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0a1628' }}>
              Change Password
            </span>
          </div>
          <ChevronRight size={20} color="#94a3b8" />
        </div>

        {/* Two-Factor Authentication */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              background: 'rgba(148,163,184,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Smartphone size={18} color="#94a3b8" />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0a1628' }}>
                Two-Factor Authentication
              </span>
              <span style={{ 
                marginLeft: 8,
                fontSize: 10, 
                fontWeight: 700, 
                color: twoFactorAuth ? '#14e842' : '#94a3b8',
                background: twoFactorAuth ? 'rgba(20,232,66,0.1)' : 'rgba(148,163,184,0.1)',
                padding: '2px 8px',
                borderRadius: 4
              }}>
                {twoFactorAuth ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setTwoFactorAuth(!twoFactorAuth)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: 0
            }}
          >
            {twoFactorAuth ? (
              <ToggleRight size={32} color="#14e842" />
            ) : (
              <ToggleLeft size={32} color="#cbd5e1" />
            )}
          </button>
        </div>
      </div>

      {/* Help Center */}
      <div 
        onClick={() => {/* فتح الـ Help Center */}}
        style={{ 
          background: '#fff',
          borderRadius: 20,
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        onMouseEnter={e => { 
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => { 
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 10, 
            background: 'rgba(148,163,184,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HelpCircle size={18} color="#94a3b8" />
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#0a1628' }}>
              Help Center
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
              Documentation & Support
            </p>
          </div>
        </div>
        <ChevronRight size={20} color="#94a3b8" />
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{ 
          background: 'rgba(239,68,68,0.05)',
          color: '#ef4444',
          border: '2px dashed #ef4444',
          borderRadius: 20,
          padding: '20px 24px',
          fontSize: 14,
          fontWeight: 900,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'all 0.2s',
          textTransform: 'uppercase',
          letterSpacing: 1
        }}
        onMouseEnter={e => { 
          e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => { 
          e.currentTarget.style.background = 'rgba(239,68,68,0.05)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <LogOut size={18} />
        Log Out of SmartBins
      </button>
    </div>
  );
}