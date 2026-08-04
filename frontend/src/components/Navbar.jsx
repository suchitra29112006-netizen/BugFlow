import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bug, LogOut, User as UserIcon, Sun, Moon, QrCode, FileText } from 'lucide-react';

export const Navbar = ({ theme, onToggleTheme, onOpenQRCode, onOpenWeeklyReport, onHome }) => {
  const { user, logout } = useAuth();

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '0.85rem 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={onHome}>
          <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #f97316 100%)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}>
            <Bug size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              BugFlow <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', verticalAlign: 'middle', marginLeft: '4px' }}>v1.0 AI</span>
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* QR Code Button */}
          <button className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }} onClick={onOpenQRCode} title="Scan QR Code for Mobile Bug Reporting">
            <QrCode size={16} color="#10b981" />
          </button>

          {/* Weekly PDF Report Launcher */}
          <button className="btn btn-peach" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }} onClick={onOpenWeeklyReport} title="AI Weekly Executive PDF Report">
            <FileText size={16} />
            Weekly AI Report
          </button>

          {/* Theme Switcher Button Label (Light Mode / Dark Mode) */}
          <button
            className="btn btn-secondary"
            onClick={onToggleTheme}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', gap: '0.4rem' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={16} color="#f97316" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={16} color="#10b981" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          {user && (
            <>
              <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.25rem' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                  <UserIcon size={18} color="#10b981" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.name}</span>
                  <span className="badge badge-reported" style={{ fontSize: '0.65rem', padding: '1px 6px', width: 'fit-content' }}>
                    {user.role}
                  </span>
                </div>
              </div>

              <button className="btn btn-secondary" onClick={logout} title="Sign Out" style={{ padding: '0.5rem 0.75rem' }}>
                <LogOut size={16} />
              </button>
            </>
          )}

        </div>
      </div>
    </header>
  );
};
