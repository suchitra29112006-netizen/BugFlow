import React, { useState, useEffect } from 'react';
import { 
  Home as HomeIcon, LayoutDashboard, FolderKanban, Bug, Kanban, Target, 
  Clock, ShieldAlert, Zap, Sparkles, FileText, Users, Activity, BarChart3, 
  ShieldCheck, Gauge, Brain, Settings, Building2, UserCheck, Layers,
  HelpCircle, CheckSquare, Rocket, AlertTriangle, BookOpen, ChevronDown, ChevronRight
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const sections = [
    {
      id: 'home_workspace',
      title: 'HOME & WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
        { id: 'home', label: 'Home Feed', icon: HomeIcon },
      ]
    },
    {
      id: 'organization',
      title: 'ORGANIZATION',
      items: [
        { id: 'org', label: 'Organization Overview', icon: Building2 },
        { id: 'departments', label: 'Departments', icon: Layers },
        { id: 'workspaces', label: 'Workspaces', icon: FolderKanban },
        { id: 'people', label: 'People & Workload', icon: UserCheck },
      ]
    },
    {
      id: 'planning_work',
      title: 'PLANNING & WORK',
      items: [
        { id: 'goals', label: 'Goals & OKRs', icon: Target },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'issues', label: 'Bugs & Tasks', icon: Bug },
        { id: 'sprints', label: 'Sprints & Calendar', icon: Kanban },
        { id: 'milestones', label: 'Milestones', icon: Layers },
        { id: 'askportal', label: 'Ask & Bug Portal', icon: HelpCircle },
      ]
    },
    {
      id: 'quality_ops',
      title: 'QUALITY & OPERATIONS',
      items: [
        { id: 'testmgmt', label: 'QA & Test Management', icon: CheckSquare },
        { id: 'releases', label: 'Releases & Deployments', icon: Rocket },
        { id: 'incidents', label: 'Incident Center', icon: AlertTriangle },
        { id: 'security', label: 'Security Center', icon: ShieldCheck },
        { id: 'sla', label: 'SLA Engine', icon: ShieldAlert },
        { id: 'performance', label: 'Performance Center', icon: Gauge },
      ]
    },
    {
      id: 'intelligence',
      title: 'INTELLIGENCE & KNOWLEDGE',
      items: [
        { id: 'intelligence', label: 'Defect Intelligence', icon: Brain },
        { id: 'kb', label: 'Engineering Knowledge Hub', icon: BookOpen },
        { id: 'analytics', label: 'Defect Analytics', icon: BarChart3 },
      ]
    },
    {
      id: 'utilities',
      title: 'ENGINEERING UTILITIES',
      items: [
        { id: 'timesheets', label: 'Time Tracking', icon: Clock },
        { id: 'documents', label: 'Engineering Knowledge Hub', icon: FileText },
      ]
    },
    {
      id: 'admin',
      title: 'ADMIN & SETTINGS',
      items: [
        { id: 'settings', label: '⚙️ Settings Hub', icon: Settings },
      ]
    }
  ];

  // State map tracking expanded/collapsed status of each domain category
  const [openSections, setOpenSections] = useState(() => {
    const initialState = {};
    sections.forEach(sec => {
      initialState[sec.id] = true;
    });
    return initialState;
  });

  // Auto-expand section when active tab changes
  useEffect(() => {
    if (!activeTab) return;
    const parentSection = sections.find(sec => sec.items.some(item => item.id === activeTab));
    if (parentSection && !openSections[parentSection.id]) {
      setOpenSections(prev => ({ ...prev, [parentSection.id]: true }));
    }
  }, [activeTab]);

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <aside 
      className="glass-panel" 
      style={{ 
        width: '270px', 
        borderRadius: 0, 
        borderTop: 0, 
        borderBottom: 0, 
        borderLeft: 0, 
        padding: '1.25rem 0.85rem', 
        minHeight: 'calc(100vh - 65px)',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {sections.map((sec) => {
          const isOpen = !!openSections[sec.id];
          const hasActiveChild = sec.items.some(item => item.id === activeTab);

          return (
            <div 
              key={sec.id}
              style={{
                borderRadius: '8px',
                backgroundColor: hasActiveChild ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                padding: '0.2rem',
                transition: 'background-color 0.2s ease'
              }}
            >
              {/* Main Domain Header Button */}
              <button
                onClick={() => toggleSection(sec.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.65rem',
                  border: 'none',
                  background: 'transparent',
                  color: hasActiveChild ? '#10b981' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  borderRadius: '6px',
                  transition: 'color 0.2s ease, background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {sec.title}
                </span>
                {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>

              {/* Collapsible Sub-Domains Navigation */}
              {isOpen && (
                <nav 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.2rem',
                    marginTop: '0.25rem',
                    paddingLeft: '0.25rem'
                  }}
                >
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.625rem 0.75rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: isActive 
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.08) 100%)' 
                            : 'transparent',
                          color: isActive ? '#10b981' : 'var(--text-main)',
                          fontWeight: isActive ? 700 : 500,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                          transition: 'all 0.18s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Icon size={17} style={{ strokeWidth: isActive ? 2.3 : 1.8 }} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
