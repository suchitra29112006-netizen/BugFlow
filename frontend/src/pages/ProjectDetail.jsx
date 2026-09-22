import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FolderKanban, ArrowLeft, Activity, Bug, Calendar, Clock, CheckCircle2, 
  AlertTriangle, ShieldAlert, Sparkles, Users, Rocket, FileText, BarChart2, 
  Send, RefreshCw, Archive, RotateCcw, Trash2, ExternalLink, Filter, Plus, ChevronRight, Check
} from 'lucide-react';

export function ProjectDetail({ projectId, onBack, onSelectIssue }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Tab Data States
  const [issues, setIssues] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [goals, setGoals] = useState([]);
  const [squads, setSquads] = useState([]);
  const [releases, setReleases] = useState([]);
  const [qaData, setQaData] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [activities, setActivities] = useState([]);

  // AI Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchProjectDetail();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    if (activeTab === 'issues') fetchIssues();
    else if (activeTab === 'sprints') fetchSprints();
    else if (activeTab === 'milestones') fetchMilestones();
    else if (activeTab === 'goals') fetchGoals();
    else if (activeTab === 'squads') fetchSquads();
    else if (activeTab === 'releases') fetchReleases();
    else if (activeTab === 'qa') fetchQA();
    else if (activeTab === 'incidents') fetchIncidents();
    else if (activeTab === 'analytics') fetchAnalytics();
    else if (activeTab === 'ai-insights') fetchAIInsights();
    else if (activeTab === 'activity') fetchActivities();
  }, [projectId, activeTab]);

  const fetchProjectDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getProjectDetail(projectId);
      setProject(data);
    } catch (err) {
      console.error("Failed loading project detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try { setIssues(await api.getProjectIssues(projectId)); } catch (e) { setIssues([]); }
  };
  const fetchSprints = async () => {
    try { setSprints(await api.getProjectSprints(projectId)); } catch (e) { setSprints([]); }
  };
  const fetchMilestones = async () => {
    try { setMilestones(await api.getProjectMilestones(projectId)); } catch (e) { setMilestones([]); }
  };
  const fetchGoals = async () => {
    try { setGoals(await api.getProjectGoals(projectId)); } catch (e) { setGoals([]); }
  };
  const fetchSquads = async () => {
    try { setSquads(await api.getProjectSquads(projectId)); } catch (e) { setSquads([]); }
  };
  const fetchReleases = async () => {
    try { setReleases(await api.getProjectReleases(projectId)); } catch (e) { setReleases([]); }
  };
  const fetchQA = async () => {
    try { setQaData(await api.getProjectQA(projectId)); } catch (e) { setQaData(null); }
  };
  const fetchIncidents = async () => {
    try { setIncidents(await api.getProjectIncidents(projectId)); } catch (e) { setIncidents([]); }
  };
  const fetchAnalytics = async () => {
    try { setAnalytics(await api.getProjectAnalytics(projectId)); } catch (e) { setAnalytics(null); }
  };
  const fetchAIInsights = async () => {
    try { setAiInsights(await api.getProjectAIInsights(projectId)); } catch (e) { setAiInsights(null); }
  };
  const fetchActivities = async () => {
    try { setActivities(await api.getProjectActivity(projectId)); } catch (e) { setActivities([]); }
  };

  const handleArchiveToggle = async () => {
    if (!project) return;
    try {
      if (project.status === 'Archived') {
        const updated = await api.restoreProject(project.id);
        setProject(updated);
      } else {
        const updated = await api.archiveProject(project.id);
        setProject(updated);
      }
    } catch (err) {
      alert(err.message || "Failed changing project archive status.");
    }
  };

  const handleSendAIChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await api.askProjectAI(projectId, userMsg);
      setChatMessages(prev => [...prev, { role: 'ai', text: res.answer, evidence: res.evidence }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Apologies, telemetry assistant encountered an issue processing your query." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Project Workspace...</div>;
  }

  if (!project) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>Project workspace not found.</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Back to Projects
        </button>
      </div>
    );
  }

  const getHealthBadge = (health) => {
    if (health === 'Critical') return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)', icon: AlertTriangle };
    if (health === 'At Risk') return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', icon: AlertTriangle };
    if (health === 'Healthy') return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)', icon: CheckCircle2 };
    return { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af', border: 'rgba(107, 114, 128, 0.3)', icon: Clock };
  };

  const hBadge = getHealthBadge(project.health);
  const HIcon = hBadge.icon;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: FolderKanban },
    { id: 'issues', label: 'Issues & Bugs', icon: Bug, count: project.issue_count },
    { id: 'sprints', label: 'Sprints', icon: Clock },
    { id: 'milestones', label: 'Milestones', icon: Calendar },
    { id: 'goals', label: 'Goals & OKRs', icon: CheckCircle2 },
    { id: 'squads', label: 'Squads & Members', icon: Users },
    { id: 'releases', label: 'Releases', icon: Rocket },
    { id: 'qa', label: 'QA & Testing', icon: ShieldAlert },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'ai-insights', label: 'AI Project Insights', icon: Sparkles },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1600px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Top Navigation & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Projects Portfolio
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={handleArchiveToggle} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            {project.status === 'Archived' ? <RotateCcw size={15} color="#34d399" /> : <Archive size={15} color="#fbbf24" />}
            {project.status === 'Archived' ? 'Restore Project' : 'Archive Project'}
          </button>
        </div>
      </div>

      {/* Project Workspace Header Card */}
      <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.15rem' }}>
              {project.project_key ? project.project_key.slice(0, 3) : 'PRJ'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{project.name}</h1>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                  KEY: {project.project_key || 'N/A'}
                </span>
              </div>
              <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{project.description || 'No description provided.'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.7rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              {project.status.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.7rem', borderRadius: '6px', background: hBadge.bg, color: hBadge.text, border: `1px solid ${hBadge.border}`, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <HIcon size={13} /> {project.health.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.7rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
              PRIORITY: {project.priority}
            </span>
          </div>
        </div>

        {/* Project Meta Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <span><strong>Type:</strong> {project.project_type}</span>
          <span><strong>Workspace:</strong> {project.workspace_name || 'Global'}</span>
          <span><strong>Department:</strong> {project.department_name || 'Engineering'}</span>
          <span><strong>Project Lead:</strong> {project.owner?.name || 'Admin'}</span>
          <span><strong>Environment:</strong> {project.environment}</span>
          {project.repository_url && (
            <a href={project.repository_url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}>
              <ExternalLink size={13} /> Repository
            </a>
          )}
        </div>

        {/* Health Evidence Alerts if At Risk or Critical */}
        {project.health_reasons && project.health_reasons.length > 0 && project.health !== 'Healthy' && (
          <div style={{ padding: '0.85rem 1.15rem', borderRadius: '10px', background: hBadge.bg, border: `1px solid ${hBadge.border}`, color: hBadge.text, fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <HIcon size={16} />
            <div>
              <strong>Operational Risk Factors Detected:</strong> {project.health_reasons.join(" • ")}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Switcher Navigation */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {TABS.map(tab => {
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
                background: isActive ? 'var(--bg-card, #121824)' : 'transparent',
                color: isActive ? 'var(--accent-primary, #6366f1)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-primary, #6366f1)' : '2px solid transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              {tab.label}
              {tab.count !== undefined && (
                <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '10px', background: isActive ? 'var(--accent-primary, #6366f1)' : 'rgba(255,255,255,0.1)', color: '#fff' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main KPI Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            
            <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Derived Progress</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem' }}>{project.calculated_progress}%</div>
              <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '0.6rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${project.calculated_progress}%`, background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)', borderRadius: '3px' }} />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Open Work Items</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8', marginTop: '0.3rem' }}>{project.open_issues_count}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Linked: {project.issue_count}</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Critical Defects</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: project.critical_issues_count > 0 ? '#ef4444' : '#10b981', marginTop: '0.3rem' }}>
                {project.critical_issues_count}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {project.critical_issues_count > 0 ? 'Requires Priority Triage' : 'No Critical Blockers'}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Sprint</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {project.active_sprint ? project.active_sprint.name : 'None Active'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
                {project.active_sprint ? `${project.active_sprint.progress}% Complete` : 'No Sprint Running'}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upcoming Release</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                {project.upcoming_release ? project.upcoming_release.version : 'None Planned'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {project.upcoming_release ? project.upcoming_release.status : 'On Schedule'}
              </span>
            </div>

          </div>

          {/* Detailed Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Squads Breakdown */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Assigned Squads & Engineering Teams</h3>
                {project.squads && project.squads.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
                    {project.squads.map(sq => (
                      <div key={sq.id} style={{ padding: '0.85rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{sq.name}</div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Assigned Engineering Squad</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No squads explicitly assigned yet.</p>
                )}
              </div>

              {/* AI Insight Snippet */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: 800, fontSize: '0.95rem' }}>
                  <Sparkles size={18} /> AI Telemetry Intelligence
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {project.ai_insight || "Project telemetry shows stable execution. All milestone dates and work item resolution trajectories are aligned."}
                </p>
                <button onClick={() => setActiveTab('ai-insights')} className="btn-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                  View Full Risk Analysis <ChevronRight size={14} />
                </button>
              </div>

            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Key Dates</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Start Date:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not Set'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Target Date:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{project.target_date ? new Date(project.target_date).toLocaleDateString() : 'Not Set'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Visibility:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{project.visibility}</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT: ISSUES */}
      {activeTab === 'issues' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Project Bugs & Work Items ({issues.length})</h3>
          </div>
          {issues.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No issues or defects linked to this project yet.
            </div>
          ) : (
            <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>ID</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Issue Title</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Severity</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Priority</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#818cf8' }}>#{item.id}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: item.severity === 'CRITICAL' ? '#ef4444' : 'var(--text-muted)' }}>{item.severity}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{item.priority}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{item.assignee_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SPRINTS */}
      {activeTab === 'sprints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Project Sprints ({sprints.length})</h3>
          {sprints.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active or historical sprints linked to this project.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.15rem' }}>
              {sprints.map(sp => (
                <div key={sp.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sp.name}</h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: sp.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.08)', color: sp.status === 'ACTIVE' ? '#34d399' : 'var(--text-muted)' }}>
                      {sp.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                    Completed: <strong>{sp.completed_items}</strong> / <strong>{sp.total_items}</strong> items ({sp.progress}%)
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${sp.progress}%`, background: '#10b981', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MILESTONES */}
      {activeTab === 'milestones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Project Milestones ({milestones.length})</h3>
          {milestones.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No milestones defined for this project.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {milestones.map(m => (
                <div key={m.id} className="glass-panel" style={{ padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{m.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{m.description || 'No milestone description.'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.82rem', color: m.is_overdue ? '#ef4444' : 'var(--text-muted)', fontWeight: m.is_overdue ? 700 : 500 }}>
                      Due: {m.due_date ? new Date(m.due_date).toLocaleDateString() : 'N/A'} {m.is_overdue && '(OVERDUE)'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px', background: m.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: m.status === 'Completed' ? '#34d399' : '#fbbf24' }}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: GOALS & OKRS */}
      {activeTab === 'goals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Linked Strategic Goals & OKRs ({goals.length})</h3>
          {goals.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No strategic goals linked to this project yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {goals.map(g => (
                <div key={g.link_id} className="glass-panel" style={{ padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{g.title}</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Type: {g.goal_type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{g.progress_percentage}% Progress</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                      {g.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SQUADS */}
      {activeTab === 'squads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Project Engineering Squads ({squads.length})</h3>
          {squads.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No squads assigned to this project yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.15rem' }}>
              {squads.map(sq => (
                <div key={sq.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{sq.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{sq.description || 'Dedicated project engineering squad.'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <span>Members: <strong>{sq.member_count}</strong></span>
                    <span>Active Issues: <strong>{sq.open_issues_count}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: RELEASES */}
      {activeTab === 'releases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Releases & Deployments ({releases.length})</h3>
          {releases.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No releases configured for this project.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {releases.map(r => (
                <div key={r.id} className="glass-panel" style={{ padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>{r.version} — {r.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Target Date: {r.target_release_date ? new Date(r.target_release_date).toLocaleDateString() : 'TBD'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                      {r.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px', background: r.risk_level === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.08)', color: r.risk_level === 'HIGH' ? '#f87171' : 'var(--text-muted)' }}>
                      RISK: {r.risk_level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: QA */}
      {activeTab === 'qa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>QA & Test Management</h3>
          {qaData ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.15rem' }}>
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Test Suites</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem' }}>{qaData.test_suites_count}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Test Cases</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8', marginTop: '0.3rem' }}>{qaData.test_cases_count}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pass Rate</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '0.3rem' }}>{qaData.pass_rate}%</div>
              </div>
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automated Coverage</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.3rem' }}>{qaData.automated_coverage}</div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No QA test suites linked yet.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: INCIDENTS */}
      {activeTab === 'incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Project Incident Log ({incidents.length})</h3>
          {incidents.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active or historical production incidents recorded for this project.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {incidents.map(inc => (
                <div key={inc.id} className="glass-panel" style={{ padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inc.title}</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Severity: {inc.severity}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                    {inc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Project Defect & Velocity Analytics</h3>
          {analytics ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Status Distribution</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  {Object.entries(analytics.status_breakdown || {}).map(([st, cnt]) => (
                    <div key={st} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{st}:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{cnt}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Quality Metrics</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>SLA Compliance Rate:</span>
                    <strong style={{ color: '#10b981' }}>{analytics.sla_compliance_rate}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Average Sprint Velocity:</span>
                    <strong style={{ color: '#818cf8' }}>{analytics.sprint_velocity_avg} pts/sprint</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Defect Escape Rate:</span>
                    <strong style={{ color: '#38bdf8' }}>{analytics.defect_escape_rate}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading analytics...
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: AI INSIGHTS & INTERACTIVE ASSISTANT */}
      {activeTab === 'ai-insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Risk Summary Card */}
          {aiInsights ? (
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.4)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#a855f7', fontWeight: 800, fontSize: '1.1rem' }}>
                <Sparkles size={22} /> AI Project Intelligence Analysis
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {aiInsights.summary}
              </p>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Evidence-Based Telemetry:</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {aiInsights.evidence.map((ev, idx) => (
                    <li key={idx}>{ev}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Recommended Corrective Actions:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {aiInsights.recommendations.map((rec, idx) => (
                    <div key={idx} style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Check size={15} color="#34d399" />
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Gathering project AI insights...
            </div>
          )}

          {/* Interactive Project AI Chat Assistant Drawer */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '340px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#6366f1" /> Ask BugFlow AI About This Project
            </h3>

            {/* Chat Stream */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.5rem', maxHeight: '300px' }}>
              {chatMessages.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
                  Ask any question about release status, defect risks, or milestone velocity for <strong>{project.name}</strong>.
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '0.85rem 1.15rem', borderRadius: '12px', background: msg.role === 'user' ? 'var(--accent-primary, #6366f1)' : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.88rem', lineHeight: 1.45 }}>
                    {msg.text}
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendAIChat} style={{ display: 'flex', gap: '0.65rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. What is the current sprint completion trajectory?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{ flex: 1, fontSize: '0.88rem' }}
              />
              <button type="submit" className="btn btn-primary" disabled={chatLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Send size={15} /> {chatLoading ? 'Thinking...' : 'Ask AI'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB CONTENT: ACTIVITY LOG */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Project Audit & Activity Log</h3>
          {activities.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No audit logs recorded for project work items yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activities.map(act => (
                <div key={act.id} className="glass-panel" style={{ padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{act.user_name}</strong>: {act.action}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {act.timestamp ? new Date(act.timestamp).toLocaleString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
