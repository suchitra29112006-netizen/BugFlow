import React, { useState, useEffect } from 'react';
import { 
  Home as HomeIcon, LayoutDashboard, FolderKanban, Bug, Kanban, Target, 
  Clock, ShieldAlert, Zap, Sparkles, FileText, Users, Activity, BarChart3, 
  ShieldCheck, Gauge, Brain, Settings, Building2, UserCheck, Layers,
  HelpCircle, CheckSquare, Rocket, AlertTriangle, BookOpen, ChevronDown, ChevronRight,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const [collapsed, setCollapsed] = useState(false);

  const sections = [
    {
      id: 'workspace',
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
        { id: 'home', label: 'Home Feed', icon: HomeIcon },
        { id: 'issues', label: 'Bugs & Tasks', icon: Bug },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'sprints', label: 'Sprints & Board', icon: Kanban },
        { id: 'goals', label: 'Goals & OKRs', icon: Target },
      ]
    },
    {
      id: 'people',
      title: 'PEOPLE & TEAMS',
      items: [
        { id: 'teams', label: 'Teams & Squads', icon: Users },
        { id: 'people', label: 'People & Workload', icon: UserCheck },
        { id: 'departments', label: 'Departments', icon: Layers },
      ]
    },
    {
      id: 'engineering',
      title: 'ENGINEERING',
      items: [
        { id: 'timesheets', label: 'Time Tracking', icon: Clock },
        { id: 'analytics', label: 'Defect Analytics', icon: BarChart3 },
        { id: 'performance', label: 'Database Advisor', icon: Gauge },
        { id: 'testmgmt', label: 'QA & Testing', icon: CheckSquare },
        { id: 'releases', label: 'Releases & Deploy', icon: Rocket },
        { id: 'security', label: 'Security Center', icon: ShieldCheck },
        { id: 'sla', label: 'SLA Engine', icon: ShieldAlert },
      ]
    },
    {
      id: 'intelligence',
      title: 'AI & KNOWLEDGE',
      items: [
        { id: 'intelligence', label: 'Defect Intelligence', icon: Brain },
        { id: 'documents', label: 'Engineering Hub', icon: FileText },
        { id: 'askportal', label: 'Ask Bug Portal', icon: HelpCircle },
      ]
    },
    {
      id: 'system',
      title: 'SYSTEM',
      items: [
        { id: 'org', label: 'Organization', icon: Building2 },
        { id: 'workspaces', label: 'Workspaces', icon: FolderKanban },
        { id: 'settings', label: 'Settings Hub', icon: Settings },
      ]
    }
  ];

  const [openSections, setOpenSections] = useState(() => {
    const initialState = {};
    sections.forEach(sec => { initialState[sec.id] = true; });
    return initialState;
  });

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <aside style={{ 
      width: collapsed ? '64px' : '230px', 
      transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      background: 'var(--bg-sidebar)', 
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 52px)',
      userSelect: 'none',
      zIndex: 90
    }}>
      
      {/* Collapse / Expand Toggle Header */}
      <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
        {!collapsed && (
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ENGINEERING WORKSPACE
          </span>
        )}
        <button 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {sections.map(section => {
          const isOpen = openSections[section.id];
          return (
            <div key={section.id}>
              
              {!collapsed && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0.25rem 0.5rem', 
                    cursor: 'pointer',
                    color: 'var(--text-dim)',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.25rem'
                  }}
                  onClick={() => toggleSection(section.id)}
                >
                  <span>{section.title}</span>
                  {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>
              )}

              {(isOpen || collapsed) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: collapsed ? '0.55rem 0' : '0.45rem 0.65rem',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          borderRadius: '6px',
                          border: 'none',
                          background: isActive ? 'var(--accent-glow)' : 'transparent',
                          color: isActive ? 'var(--accent-primary-hover)' : 'var(--text-main)',
                          fontSize: '0.82rem',
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease-in-out',
                          textAlign: 'left'
                        }}
                        onClick={() => setActiveTab(item.id)}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon size={16} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                        {!collapsed && <span>{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Sidebar Footer Context */}
      {!collapsed && (
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>BugFlow v3.0 Pro</span>
          <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', background: 'var(--accent-glow)', color: 'var(--accent-primary-hover)', fontWeight: 700 }}>ACTIVE</span>
        </div>
      )}

    </aside>
  );
};
