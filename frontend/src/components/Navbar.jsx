import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bug, LogOut, User as UserIcon, Sun, Moon, QrCode, FileText, 
  Search, Sparkles, Plus, ChevronDown, Building2, Target, Kanban, 
  FolderKanban, Clock, Users, HelpCircle
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { api } from '../services/api';

export const Navbar = ({ 
  theme, 
  onToggleTheme, 
  onOpenQRCode, 
  onOpenWeeklyReport, 
  onHome, 
  onSelectIssue, 
  onOpenCommandPalette, 
  onOpenCopilot, 
  onOpenReportModal,
  onOpenQuickCreate
}) => {
  const { user, logout } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("Enterprise Engineering Workspace");
  const createMenuRef = useRef(null);
  const orgMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
        setIsCreateOpen(false);
      }
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target)) {
        setIsOrgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickAction = (type) => {
    setIsCreateOpen(false);
    if (onOpenQuickCreate) {
      onOpenQuickCreate(type);
    } else {
      onOpenReportModal();
    }
  };

  return (
    <header style={{ 
      height: '52px', 
      background: 'var(--bg-secondary)', 
      borderBottom: '1px solid var(--border-color)', 
      position: 'sticky', 
      top: 0, 
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.25rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        
        {/* Left Section: Logo & Context Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={onHome}>
            <div style={{ background: '#10b981', width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bug size={18} color="#ffffff" />
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              BugFlow
            </span>
          </div>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }} />

          {/* Organization Switcher Context */}
          <div style={{ position: 'relative' }} ref={orgMenuRef}>
            <button 
              style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            >
              <Building2 size={14} color="#10b981" />
              <span>{selectedOrg}</span>
              <ChevronDown size={14} color="var(--text-dim)" />
            </button>

            {isOrgDropdownOpen && (
              <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', width: '260px', padding: '0.5rem', zIndex: 101, background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.35rem 0.5rem' }}>Switch Organization</div>
                <div 
                  style={{ padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                  onClick={() => { setSelectedOrg("Enterprise Engineering Workspace"); setIsOrgDropdownOpen(false); }}
                >
                  🏢 Enterprise Engineering Workspace
                </div>
                <div 
                  style={{ padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}
                  onClick={() => { setSelectedOrg("Cloud Infrastructure Guild"); setIsOrgDropdownOpen(false); }}
                >
                  ☁️ Cloud Infrastructure Guild
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Center Section: Global Search Bar (Cmd+K) */}
        <div style={{ flex: 1, maxWidth: '420px', margin: '0 1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={onOpenCommandPalette}
            style={{ 
              width: '100%', 
              justify: 'space-between', 
              padding: '0.35rem 0.75rem', 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)', 
              background: 'var(--bg-primary)',
              borderRadius: '6px'
            }}
            title="Global Search & Quick Actions (Ctrl+K)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={14} />
              <span>Search issues, projects, teams...</span>
            </div>
            <span style={{ fontSize: '0.68rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>⌘K</span>
          </button>
        </div>

        {/* Right Section: Quick Create, AI Copilot, Notifications, User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          
          {/* Quick Create + Dropdown */}
          <div style={{ position: 'relative' }} ref={createMenuRef}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', gap: '0.3rem' }}
              onClick={() => setIsCreateOpen(!isCreateOpen)}
            >
              <Plus size={15} />
              <span>Create</span>
              <ChevronDown size={13} />
            </button>

            {isCreateOpen && (
              <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', width: '200px', padding: '0.4rem', zIndex: 101, background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div 
                  style={{ padding: '0.45rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => handleQuickAction('issue')}
                >
                  <Bug size={14} color="#ef4444" /> New Issue / Defect
                </div>
                <div 
                  style={{ padding: '0.45rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => handleQuickAction('project')}
                >
                  <FolderKanban size={14} color="#f97316" /> New Project
                </div>
                <div 
                  style={{ padding: '0.45rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => handleQuickAction('sprint')}
                >
                  <Kanban size={14} color="#3b82f6" /> New Sprint
                </div>
                <div 
                  style={{ padding: '0.45rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => handleQuickAction('time')}
                >
                  <Clock size={14} color="#10b981" /> Log Work Time
                </div>
                <div 
                  style={{ padding: '0.45rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => handleQuickAction('goal')}
                >
                  <Target size={14} color="#a855f7" /> New Goal / OKR
                </div>
              </div>
            )}
          </div>

          {/* AI Copilot Button */}
          <button 
            className="btn btn-peach" 
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', gap: '0.35rem' }} 
            onClick={onOpenCopilot} 
            title="Ask BugFlow Copilot AI"
          >
            <Sparkles size={14} />
            <span>AI Copilot</span>
          </button>

          {/* Notification Center */}
          <NotificationCenter onSelectIssue={onSelectIssue} />

          {/* QR Code Button */}
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }} onClick={onOpenQRCode} title="Scan QR Code for Mobile Bug Reporting">
            <QrCode size={15} color="#10b981" />
          </button>

          {/* Theme Switcher Button */}
          <button
            className="btn btn-secondary"
            onClick={onToggleTheme}
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={15} color="#f97316" /> : <Moon size={15} color="#10b981" />}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.25rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }} title={`${user.name} (${user.role})`}>
                <UserIcon size={15} color="#10b981" />
              </div>
              <button className="btn btn-secondary" onClick={logout} title="Sign Out" style={{ padding: '0.35rem 0.5rem' }}>
                <LogOut size={14} />
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
