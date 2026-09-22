import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, Layers, Users, Bug, Cpu, GitBranch, Rocket, AlertTriangle, 
  FileText, BarChart2, Activity, Settings, ArrowLeft, Plus, CheckCircle, 
  ExternalLink, Search, Filter, Shield, Clock, Sparkles, RefreshCw, Trash2, 
  ChevronRight, Play, Eye, X
} from 'lucide-react';
import { api } from '../services/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGridIcon },
  { id: 'projects', label: 'Projects', icon: Layers },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'issues', label: 'Issues', icon: Bug },
  { id: 'sprints', label: 'Sprints', icon: Cpu },
  { id: 'repositories', label: 'Repositories', icon: GitBranch },
  { id: 'releases', label: 'Releases', icon: Rocket },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function LayoutGridIcon(props) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

export default function WorkspaceDetail({ workspaceId, onBack, onNavigateToProject }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data states for tabs
  const [overviewData, setOverviewData] = useState(null);
  const [projectsData, setProjectsData] = useState([]);
  const [teamsData, setTeamsData] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [issuesData, setIssuesData] = useState([]);
  const [sprintsData, setSprintsData] = useState([]);
  const [reposData, setReposData] = useState([]);
  const [releasesData, setReleasesData] = useState([]);
  const [incidentsData, setIncidentsData] = useState([]);
  const [docsData, setDocsData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activityData, setActivityData] = useState([]);

  // AI Drawer state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Settings form state
  const [editName, setEditName] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState('Engineering');
  const [editVisibility, setEditVisibility] = useState('Organization');
  const [editStatus, setEditStatus] = useState('Active');
  const [editTimezone, setEditTimezone] = useState('UTC');
  const [editSprintLength, setEditSprintLength] = useState(14);
  const [activeSettingsSection, setActiveSettingsSection] = useState('general');

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      loadTabData(activeTab);
    }
  }, [activeTab, workspaceId]);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const ws = await api.getWorkspace(workspaceId);
      setWorkspace(ws);
      setEditName(ws.name || '');
      setEditKey(ws.key || '');
      setEditDesc(ws.description || '');
      setEditType(ws.workspace_type || 'Engineering');
      setEditVisibility(ws.visibility || 'Organization');
      setEditStatus(ws.status || 'Active');
      setEditTimezone(ws.timezone || 'UTC');
      setEditSprintLength(ws.default_sprint_length || 14);
    } catch (err) {
      console.error("Failed to fetch workspace detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab) => {
    try {
      if (tab === 'overview') {
        const res = await api.getWorkspaceOverview(workspaceId);
        setOverviewData(res);
        if (res.ai_insights) setAiInsights(res.ai_insights);
      } else if (tab === 'projects') {
        const res = await api.getWorkspaceProjects(workspaceId);
        setProjectsData(res || []);
      } else if (tab === 'teams') {
        const res = await api.getWorkspaceTeams(workspaceId);
        setTeamsData(res || []);
      } else if (tab === 'members') {
        const res = await api.getWorkspaceMembers(workspaceId);
        setMembersData(res || []);
      } else if (tab === 'issues') {
        const res = await api.getWorkspaceIssues(workspaceId);
        setIssuesData(res || []);
      } else if (tab === 'sprints') {
        const res = await api.getWorkspaceSprints(workspaceId);
        setSprintsData(res || []);
      } else if (tab === 'repositories') {
        const res = await api.getWorkspaceRepositories(workspaceId);
        setReposData(res || []);
      } else if (tab === 'releases') {
        const res = await api.getWorkspaceReleases(workspaceId);
        setReleasesData(res || []);
      } else if (tab === 'incidents') {
        const res = await api.getWorkspaceIncidents(workspaceId);
        setIncidentsData(res || []);
      } else if (tab === 'documents') {
        const res = await api.getWorkspaceDocuments(workspaceId);
        setDocsData(res || []);
      } else if (tab === 'analytics') {
        const res = await api.getWorkspaceAnalytics(workspaceId);
        setAnalyticsData(res);
      } else if (tab === 'activity') {
        const res = await api.getWorkspaceActivity(workspaceId);
        setActivityData(res || []);
      }
    } catch (err) {
      console.error(`Failed loading ${tab} data:`, err);
    }
  };

  const handleGenerateAiInsights = async () => {
    setGeneratingAi(true);
    try {
      const res = await api.generateWorkspaceAIInsights(workspaceId);
      if (res.insights) setAiInsights(res.insights);
      setIsAiDrawerOpen(true);
    } catch (err) {
      alert("Failed generating AI insights: " + (err.message || err));
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateWorkspace(workspaceId, {
        name: editName,
        key: editKey,
        description: editDesc,
        workspace_type: editType,
        visibility: editVisibility,
        status: editStatus,
        timezone: editTimezone,
        default_sprint_length: parseInt(editSprintLength)
      });
      alert("Workspace settings updated successfully!");
      loadWorkspace();
    } catch (err) {
      alert("Failed updating workspace settings: " + (err.message || err));
    }
  };

  const handleArchiveWorkspace = async () => {
    if (window.confirm(`Are you sure you want to archive workspace '${workspace?.name}'?`)) {
      try {
        await api.updateWorkspace(workspaceId, { status: 'Archived' });
        alert("Workspace archived.");
        loadWorkspace();
      } catch (err) {
        alert("Failed to archive workspace: " + (err.message || err));
      }
    }
  };

  const handleDeleteWorkspace = async () => {
    if (window.confirm(`PERMANENT ACTION: Are you sure you want to delete workspace '${workspace?.name}'?`)) {
      try {
        await api.deleteWorkspace(workspaceId);
        alert("Workspace deleted successfully.");
        onBack && onBack();
      } catch (err) {
        alert("Failed to delete workspace: " + (err.message || err));
      }
    }
  };

  if (loading || !workspace) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Workspace Command Center...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1500px', margin: '0 auto' }}>
      
      {/* Back Button & Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to Workspaces
        </button>

        <button 
          onClick={handleGenerateAiInsights}
          disabled={generatingAi}
          style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
            color: '#fff',
            border: 'none',
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <Sparkles size={16} /> {generatingAi ? 'Analyzing Workspace...' : 'AI Workspace Insights'}
        </button>
      </div>

      {/* Workspace Command Center Banner Header */}
      <div className="glass-panel" style={{ padding: '1.6rem', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${workspace.color_theme || '#10b981'}25`, color: workspace.color_theme || '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            <FolderKanban size={32} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{workspace.name}</h1>
              <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 700 }}>
                {workspace.key}
              </span>
              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', fontWeight: 700 }}>
                {workspace.workspace_type}
              </span>
              <span style={{ 
                fontSize: '0.72rem', 
                padding: '0.15rem 0.55rem', 
                borderRadius: '12px', 
                fontWeight: 700,
                background: workspace.health_status === 'Healthy' ? 'rgba(16, 185, 129, 0.15)' : workspace.health_status === 'At Risk' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: workspace.health_status === 'Healthy' ? '#10b981' : workspace.health_status === 'At Risk' ? '#eab308' : '#ef4444'
              }}>
                ● {workspace.health_status}
              </span>
            </div>

            <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '850px' }}>
              {workspace.description || 'Central collaborative workspace unifying projects, teams, repositories, and defect analytics.'}
            </p>

            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>Lead: <strong style={{ color: 'var(--text-primary)' }}>{workspace.lead_name || 'Engineering Lead'}</strong></div>
              <div>Owner: <strong style={{ color: 'var(--text-primary)' }}>{workspace.owner_name || 'System Admin'}</strong></div>
              <div>Cadence: <strong style={{ color: 'var(--text-primary)' }}>{workspace.default_sprint_length} Days</strong></div>
              <div>Timezone: <strong style={{ color: 'var(--text-primary)' }}>{workspace.timezone}</strong></div>
            </div>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ textAlign: 'center', background: 'var(--bg-card, #121824)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Projects</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{workspace.projects_count}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--bg-card, #121824)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Teams</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{workspace.teams_count}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--bg-card, #121824)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Defects</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: workspace.open_issues_count > 0 ? '#f97316' : 'var(--text-primary)' }}>{workspace.open_issues_count}</div>
          </div>
        </div>
      </div>

      {/* 13 NAVIGATION TABS HEADER */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1rem',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                color: isActive ? '#3b82f6' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}
      <div style={{ minHeight: '400px' }}>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && overviewData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Health Evaluation Drawer */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'linear-gradient(135deg, rgba(18, 24, 36, 0.8) 0%, rgba(30, 41, 59, 0.5) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: overviewData.health.status === 'Healthy' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)', color: overviewData.health.status === 'Healthy' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                  {overviewData.health.score}%
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>WORKSPACE HEALTH EVALUATION</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Status: <span style={{ color: overviewData.health.status === 'Healthy' ? '#10b981' : '#ef4444' }}>{overviewData.health.status}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxWidth: '600px' }}>
                {overviewData.health.reasons.map((r, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: '#3b82f6' }}>•</span> {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Projects Grid */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Linked Projects</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {overviewData.recent_projects.map((p) => (
                  <div key={p.id} className="glass-panel" style={{ padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{p.name}</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>{p.project_key}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>{p.description || 'Project repository'}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Open Issues: <strong style={{ color: '#f97316' }}>{p.issues_count}</strong></span>
                      <button onClick={() => onNavigateToProject && onNavigateToProject(p.id)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}>View Project &rarr;</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 2. PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Workspace Projects Portfolio</h3>
            <div className="glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card, #121824)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Project Name</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Key</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Owner</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Environment</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Open Defects</th>
                    <th style={{ padding: '0.85rem 1.1rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsData.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</td>
                      <td style={{ padding: '0.9rem 1.1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.project_key}</td>
                      <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-primary)' }}>{p.owner_name}</td>
                      <td style={{ padding: '0.9rem 1.1rem' }}><span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>{p.environment}</span></td>
                      <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: '#f97316' }}>{p.open_issues_count}</td>
                      <td style={{ padding: '0.9rem 1.1rem', textAlign: 'right' }}>
                        <button onClick={() => onNavigateToProject && onNavigateToProject(p.id)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>View Project</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. TEAMS TAB */}
        {activeTab === 'teams' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Cross-Department Engineering Teams</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.1rem' }}>
              {teamsData.map((t) => (
                <div key={t.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{t.name}</span>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 700 }}>
                      {t.department_name}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Focus: <strong>{t.focus_area}</strong></div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Lead: <strong>{t.lead_name}</strong> • {t.members_count} Members</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. MEMBERS TAB */}
        {activeTab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Workspace Members & Contributors</h3>
            <div className="glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card, #121824)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Member</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Email</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Role</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Assigned Defects</th>
                  </tr>
                </thead>
                <tbody>
                  {membersData.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</td>
                      <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{m.email}</td>
                      <td style={{ padding: '0.9rem 1.1rem' }}><span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', fontWeight: 600 }}>{m.role}</span></td>
                      <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: '#f97316' }}>{m.assigned_issues_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. ISSUES TAB */}
        {activeTab === 'issues' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Workspace Defect Backlog</h3>
            <div className="glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card, #121824)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Issue Title</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Severity</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {issuesData.map((i) => (
                    <tr key={i.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{i.title}</td>
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: i.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)', color: i.severity === 'CRITICAL' ? '#ef4444' : '#f97316', fontWeight: 700 }}>
                          {i.severity}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', fontWeight: 600 }}>
                          {i.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{i.assigned_to_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. SPRINTS TAB */}
        {activeTab === 'sprints' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Active & Planned Sprints</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.1rem' }}>
              {sprintsData.map((s) => (
                <div key={s.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{s.name}</span>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>{s.status}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{s.goal}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Points: <strong>{s.completed_story_points} / {s.planned_story_points}</strong></span>
                    <span>Health: <strong style={{ color: '#10b981' }}>{s.health_score}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. REPOSITORIES TAB */}
        {activeTab === 'repositories' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Connected Repositories & CI/CD Pipelines</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.1rem' }}>
              {reposData.map((r, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <GitBranch size={18} color="#3b82f6" /> {r.name}
                    </div>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>{r.build_status || 'PASSING'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.url}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Open PRs: <strong style={{ color: '#3b82f6' }}>{r.open_prs || 2}</strong></span>
                    <span>Branch: <strong style={{ color: 'var(--text-primary)' }}>{r.default_branch || 'main'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. RELEASES TAB */}
        {activeTab === 'releases' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Release Roadmaps & Versions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.1rem' }}>
              {releasesData.map((rel) => (
                <div key={rel.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{rel.version} - {rel.name}</span>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 700 }}>{rel.status}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{rel.description || 'Targeted release deliverable'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. INCIDENTS TAB */}
        {activeTab === 'incidents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>System & Defect Incidents</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.1rem' }}>
              {incidentsData.map((inc) => (
                <div key={inc.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{inc.incident_code}: {inc.title}</span>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>{inc.severity}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status: <strong>{inc.status}</strong> • Component: <strong>{inc.affected_components}</strong></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Workspace Documentation & Specs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.1rem' }}>
              {docsData.map((doc) => (
                <div key={doc.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <FileText size={18} color="#3b82f6" /> {doc.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type: {doc.doc_type} • Author: {doc.author_name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. ANALYTICS TAB */}
        {activeTab === 'analytics' && analyticsData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Workspace Real-Time Analytics</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              
              {/* Chart 1: Issue Distribution */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>1. Defect Status Distribution</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {analyticsData.issue_distribution.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                        {item.status}
                      </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: SLA & Quality metrics */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>2. SLA & CI Health Metrics</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>SLA Compliance Rate:</span>
                    <strong style={{ color: '#10b981' }}>{analyticsData.sla_compliance_rate}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>CI Build Success Rate:</span>
                    <strong style={{ color: '#10b981' }}>{analyticsData.ci_build_success_rate}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Automated Test Pass Rate:</span>
                    <strong style={{ color: '#10b981' }}>{analyticsData.automated_test_pass_rate}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Incident MTTR:</span>
                    <strong style={{ color: '#3b82f6' }}>{analyticsData.incident_mean_time_to_resolution_hours} Hours</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 12. ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Audit Trail & Activity Timeline</h3>
            <div className="glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activityData.map((act) => (
                <div key={act.id} style={{ display: 'flex', itemsAlign: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{act.action}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>by {act.user_name}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{new Date(act.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 13. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
            
            {/* Settings Sub-Sidebar */}
            <div className="glass-panel" style={{ borderRadius: '12px', padding: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem', height: 'fit-content' }}>
              {['general', 'members', 'projects', 'teams', 'repositories', 'workflow', 'sprints', 'notifications', 'danger'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setActiveSettingsSection(sec)}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeSettingsSection === sec ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: activeSettingsSection === sec ? '#3b82f6' : (sec === 'danger' ? '#ef4444' : 'var(--text-muted)'),
                    fontWeight: activeSettingsSection === sec ? 700 : 500,
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {sec === 'danger' ? 'Danger Zone' : `${sec} Settings`}
                </button>
              ))}
            </div>

            {/* Settings Body */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              {activeSettingsSection === 'general' && (
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>General Workspace Settings</h3>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Workspace Name</label>
                    <input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Workspace Key</label>
                      <input type="text" className="form-input" value={editKey} onChange={e => setEditKey(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category / Type</label>
                      <select className="form-select" value={editType} onChange={e => setEditType(e.target.value)}>
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product</option>
                        <option value="Platform">Platform</option>
                        <option value="Data & AI">Data & AI</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
                    <textarea className="form-textarea" rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', padding: '0.55rem 1.25rem' }}>Save Settings</button>
                </form>
              )}

              {activeSettingsSection === 'danger' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>Danger Zone</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Actions here affect workspace resources permanently.</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Archive Workspace</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Marks workspace read-only while preserving projects.</div>
                    </div>
                    <button type="button" onClick={handleArchiveWorkspace} className="btn-secondary" style={{ color: '#eab308', borderColor: '#eab308' }}>Archive</button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)' }}>
                    <div>
                      <strong style={{ color: '#ef4444', fontSize: '0.9rem' }}>Delete Workspace</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Permanently removes this workspace and resets project references.</div>
                    </div>
                    <button type="button" onClick={handleDeleteWorkspace} className="btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>Delete Workspace</button>
                  </div>
                </div>
              )}

              {activeSettingsSection !== 'general' && activeSettingsSection !== 'danger' && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Settings size={32} style={{ marginBottom: '0.5rem' }} />
                  <div>{activeSettingsSection.toUpperCase()} configuration settings actively linked to Organization defaults.</div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* AI INSIGHTS DRAWER */}
      {isAiDrawerOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', background: 'var(--bg-card, #121824)', borderLeft: '1px solid var(--border-color)', zIndex: 1100, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="#a855f7" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>AI Workspace Insights</h3>
            </div>
            <button onClick={() => setIsAiDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            {aiInsights.map((insight) => (
              <div key={insight.id} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.5rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', fontWeight: 700, width: 'fit-content' }}>
                  {insight.category || insight.type || 'Recommendation'}
                </span>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{insight.title}</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{insight.description || insight.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
