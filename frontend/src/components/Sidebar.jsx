import React from 'react';
import { 
  Home as HomeIcon, LayoutDashboard, FolderKanban, Bug, Kanban, Target, 
  Clock, ShieldAlert, Zap, Sparkles, FileText, Users, Activity, BarChart3, 
  ShieldCheck, Gauge, Brain, Settings, Building2, UserCheck, Layers,
  HelpCircle, CheckSquare, Rocket, AlertTriangle, BookOpen, Wrench
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const sections = [
    {
      title: 'HOME & WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
        { id: 'home', label: 'Home Feed', icon: HomeIcon },
      ]
    },
    {
      title: 'ORGANIZATION',
      items: [
        { id: 'org', label: 'Organization Overview', icon: Building2 },
        { id: 'departments', label: 'Departments', icon: Layers },
        { id: 'workspaces', label: 'Workspaces', icon: FolderKanban },
        { id: 'teams', label: 'Teams & Squads', icon: Users },
        { id: 'people', label: 'People & Workload', icon: UserCheck },
      ]
    },

    {
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
      title: 'INTELLIGENCE & KNOWLEDGE',
      items: [
        { id: 'intelligence', label: 'Defect Intelligence', icon: Brain },
        { id: 'aicenter', label: 'AI Investigation & QA', icon: Sparkles },
        { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
        { id: 'debt', label: 'Technical Debt Radar', icon: Wrench },
        { id: 'analytics', label: 'Defect Analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'ENGINEERING UTILITIES',
      items: [
        { id: 'timesheets', label: 'Time Tracking', icon: Clock },
        { id: 'automation', label: 'Automation Rules', icon: Zap },
        { id: 'documents', label: 'Documents & Spec', icon: FileText },
      ]
    },
    {
      title: 'ADMIN & SETTINGS',
      items: [
        { id: 'settings', label: '⚙️ Settings Hub', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="glass-panel" style={{ width: '250px', borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0, padding: '1.5rem 1rem', minHeight: 'calc(100vh - 65px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {sections.map((sec, i) => (
          <div key={i}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', paddingLeft: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>
              {sec.title}
            </span>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'transparent',
                      color: isActive ? '#10b981' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
};
