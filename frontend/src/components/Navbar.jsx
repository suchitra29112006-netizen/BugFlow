import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bug, LogOut, User as UserIcon, Sun, Moon, QrCode, FileText, Download, Command, Search, Sparkles, Plus } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { api } from '../services/api';

export const Navbar = ({ theme, onToggleTheme, onOpenQRCode, onOpenWeeklyReport, onHome, onSelectIssue, onOpenCommandPalette, onOpenCopilot, onOpenReportModal }) => {
  const { user, logout } = useAuth();

  const handleExportCSV = () => {
    api.exportAuditCSV();
  };

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '0.85rem 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* Brand & Command Palette Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={onHome}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #f97316 100%)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}>
              <Bug size={22} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                BugFlow <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', verticalAlign: 'middle', marginLeft: '4px' }}>v3.0 AI</span>
              </h2>
            </div>
          </div>

          {/* Command Palette Button (Ctrl+K) */}
          <button
            className="btn btn-secondary"
            onClick={onOpenCommandPalette}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', gap: '0.5rem' }}
            title="Quick Command Search (Ctrl+K)"
          >
            <Search size={14} />
            <span>Ask BugFlow...</span>
            <span style={{ fontSize: '0.68rem', background: 'rgba(0,0,0,0.08)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>Ctrl+K</span>
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* BugFlow Copilot AI Button */}
          <button className="btn btn-primary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', gap: '0.4rem' }} onClick={onOpenCopilot} title="Ask BugFlow Copilot AI">
            <Sparkles size={16} />
            <span>BugFlow AI</span>
          </button>



          {/* Notification Center */}
          <NotificationCenter onSelectIssue={onSelectIssue} />

          {/* QR Code Button */}
          <button className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }} onClick={onOpenQRCode} title="Scan QR Code for Mobile Bug Reporting">
            <QrCode size={16} color="#10b981" />
          </button>

          {/* Weekly PDF Report Launcher */}
          <button className="btn btn-peach" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }} onClick={onOpenWeeklyReport} title="AI Weekly Executive PDF Report">
            <FileText size={16} />
            Weekly AI Report
          </button>

          {/* Theme Switcher Button */}
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
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.name || 'User'}</span>
                  <span className="badge badge-reported" style={{ fontSize: '0.65rem', padding: '1px 6px', width: 'fit-content' }}>
                    {user?.role || 'Member'}
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
