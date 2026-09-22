import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  FolderKanban, 
  ShieldCheck, 
  Activity, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  FileText, 
  Pin, 
  Clock, 
  AlertTriangle, 
  Layers, 
  ArrowUpRight, 
  ChevronRight, 
  Briefcase, 
  Bug, 
  Check, 
  X, 
  UserPlus, 
  Globe, 
  DollarSign, 
  Search, 
  Filter,
  Trash2,
  FolderPlus,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import OrgSettingsModal from '../components/OrgSettingsModal';
import { ReportIssueModal } from '../components/ReportIssueModal';

export function OrganizationDetail({ orgId = 1, onNavigate, onSelectIssue, onSelectProject }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview | departments | projects | members | issues | documents | activity
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Issues & Members States
  const [orgIssues, setOrgIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [issueSearch, setIssueSearch] = useState('');
  const [issueSeverityFilter, setIssueSeverityFilter] = useState('');

  const [orgMembers, setOrgMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Modals & Drawer States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState(null);

  const [newProjectData, setNewProjectData] = useState({
    name: '',
    project_key: '',
    description: '',
    department_id: '',
    project_type: 'Software Development',
    priority: 'Medium'
  });
  const [creatingProject, setCreatingProject] = useState(false);

  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectData.name.trim()) return;
    setCreatingProject(true);
    try {
      await api.createOrgProject(orgId, {
        ...newProjectData,
        department_id: newProjectData.department_id ? parseInt(newProjectData.department_id) : null
      });
      setIsCreateProjectOpen(false);
      setNewProjectData({ name: '', project_key: '', description: '', department_id: '', project_type: 'Software Development', priority: 'Medium' });
      fetchOrganizationDetail();
    } catch (err) {
      alert("Failed to create project: " + err.message);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (e, projectId, projectName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete project "${projectName}" and all its issues? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteProject(projectId);
      fetchOrganizationDetail();
    } catch (err) {
      alert("Failed to delete project: " + err.message);
    }
  };

  const handleDeleteIssue = async (e, issueId, issueTitle) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete issue "${issueTitle}" (#${issueId})?`)) {
      return;
    }
    try {
      await api.deleteIssue(issueId);
      fetchOrgIssues();
      fetchOrganizationDetail();
    } catch (err) {
      alert("Failed to delete issue: " + err.message);
    }
  };

  useEffect(() => {
    fetchOrganizationDetail();
  }, [orgId]);

  const fetchOrganizationDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOrganizationDetail(orgId);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch org detail:", err);
      setError(err.message || "Organization not found or access denied.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgIssues = async () => {
    setLoadingIssues(true);
    try {
      const params = {};
      if (issueSeverityFilter) params.severity = issueSeverityFilter;
      if (issueSearch) params.search = issueSearch;
      const res = await api.getOrgIssues(orgId, params);
      setOrgIssues(res || []);
    } catch (err) {
      console.error("Failed to load org issues:", err);
    } finally {
      setLoadingIssues(false);
    }
  };

  const fetchOrgMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await api.getOrgMembers(orgId);
      setOrgMembers(res || []);
    } catch (err) {
      console.error("Failed to load org members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'issues') fetchOrgIssues();
    if (activeTab === 'members') fetchOrgMembers();
  }, [activeTab, issueSeverityFilter, issueSearch]);

  const handleTogglePin = async (docId, currentPin, e) => {
    e.stopPropagation();
    try {
      await api.put(`/api/v1/organizations/documents/${docId}/pin`, {
        is_pinned: !currentPin
      });
      fetchOrganizationDetail();
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Loading Organization Command Center...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1.25rem', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={32} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Organization Access Error</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{error || "Organization not found or you lack permission to view this organization."}</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate ? onNavigate('org') : window.location.href = '/#org'}>
          ← Return to Organization Overview
        </button>
      </div>
    );
  }

  const org = data.organization;
  const kpis = data.kpis;
  const departments = data.departments || [];
  const projects = data.projects || [];
  const recentActivity = data.recent_activity || [];
  const pinnedDocs = data.pinned_documents || [];
  const healthTrend = data.health_trend_8_weeks || [];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Top Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <button 
          onClick={() => onNavigate ? onNavigate('org') : window.location.href = '/#org'}
          style={{ border: 'none', background: 'none', color: '#10b981', cursor: 'pointer', fontWeight: 700, padding: 0 }}
        >
          Organization Overview
        </button>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{org.name}</span>
      </div>

      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)', flexShrink: 0 }}>
              <Building2 size={32} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>{org.name}</h1>
                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800 }}>
                  {kpis.health_rating} ({kpis.health_score}%)
                </span>
                <span style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                  {org.plan}
                </span>
              </div>
              <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>{org.description} • {org.industry} • {org.company_size} • {org.timezone}</span>
                {org.website && (
                  <a 
                    href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 800, textDecoration: 'underline' }}
                    title={`Open ${org.name} Demo Website`}
                  >
                    <Globe size={14} /> {org.website} <ExternalLink size={12} />
                  </a>
                )}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setIsReportModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.1rem', borderRadius: '8px', background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', color: '#fff', fontWeight: 800, cursor: 'pointer', border: 'none' }}
            >
              <Bug size={16} /> + Report Issue
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setIsSettingsModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.95rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <Settings size={16} /> ⚙ Org Settings
            </button>
          </div>

        </div>
      </div>

      {/* Main Tab Bar Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'departments', label: `🏢 Departments & Squads (${departments.length})` },
          { id: 'projects', label: `📁 Projects (${projects.length})` },
          { id: 'members', label: '👥 Members & Workload' },
          { id: 'issues', label: '🐛 Bugs & Issues' },
          { id: 'documents', label: `📌 Documents (${pinnedDocs.length})` },
          { id: 'activity', label: '⚡ Activity Audit Feed' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.65rem 1.1rem',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #10b981' : '3px solid transparent',
              background: activeTab === tab.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              color: activeTab === tab.id ? '#10b981' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* KPI Summary Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>OPEN DEFECT BACKLOG</span>
                <Bug size={18} color="#f59e0b" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.5rem', color: 'var(--text-main)' }}>{kpis.total_open_defects}</div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>↓ Active Defect Volume</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>CRITICAL UNRESOLVED</span>
                <AlertTriangle size={18} color="#ef4444" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.5rem', color: '#ef4444' }}>{kpis.critical_unresolved}</div>
              <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>Requires Priority Triage</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>RESOLVED THIS WEEK</span>
                <CheckCircle2 size={18} color="#10b981" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.5rem', color: '#10b981' }}>{kpis.resolved_this_week}</div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>↑ Engineering Throughput</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>PLATFORM HEALTH SCORE</span>
                <Activity size={18} color="#a855f7" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.5rem', color: '#a855f7' }}>{kpis.health_score}%</div>
              <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 700 }}>SLA Compliance Metric</span>
            </div>
          </div>

          {/* 8-Week Health Trend */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>📈 8-Week Organization Health Trend</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '180px', padding: '1rem 0' }}>
              {healthTrend.map((item, idx) => (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', marginBottom: '0.35rem' }}>{item.health_score}%</span>
                  <div style={{ width: '100%', height: `${item.health_score}%`, background: 'linear-gradient(180deg, #10b981 0%, rgba(16, 185, 129, 0.2) 100%)', borderRadius: '6px 6px 0 0' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 700 }}>{item.week}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity & Pinned Docs Dual Column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem' }}>⚡ Recent Activity Feed</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentActivity.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recent activity logged for this organization.</p>
                ) : (
                  recentActivity.map(act => (
                    <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>{act.user_name}</strong> updated <strong>{act.field_changed}</strong> on <span style={{ color: '#10b981' }}>{act.issue_title}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{act.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem' }}>📌 Pinned Documents</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {pinnedDocs.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No pinned documents for this organization.</p>
                ) : (
                  pinnedDocs.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} color="#10b981" />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{doc.title}</div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Category: {doc.category} • By {doc.author_name}</span>
                        </div>
                      </div>
                      <button onClick={(e) => handleTogglePin(doc.id, doc.is_pinned, e)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                        <Pin size={16} color={doc.is_pinned ? '#10b981' : 'var(--text-muted)'} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: DEPARTMENTS & SQUADS */}
      {activeTab === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {departments.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>No Departments Configured</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>Create departments using the Organization Wizard or Org Settings.</p>
            </div>
          ) : (
            departments.map(dept => (
              <div key={dept.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{dept.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>{dept.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-assigned">{dept.squads?.length || 0} Squads</span>
                    <span className="badge badge-medium">{dept.open_bug_count || 0} Open Bugs</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {dept.squads?.map(squad => (
                    <div 
                      key={squad.id} 
                      onClick={() => setSelectedSquad(squad)}
                      style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{squad.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>{squad.velocity} pts/sprint</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Lead: {squad.lead_name} • {squad.member_count} Members</p>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: squad.open_bugs > 0 ? '#f59e0b' : '#10b981' }}>
                        {squad.open_bugs} Open Defects Assigned →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>📁 Organization Projects Rollup</h3>
            <button 
              className="btn btn-primary"
              onClick={() => setIsCreateProjectOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1rem', background: '#10b981', border: 'none', color: '#fff', fontWeight: 800, borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <FolderPlus size={16} /> + Create Project for {org.name}
            </button>
          </div>

          {projects.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FolderPlus size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>No projects configured for this organization.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setIsCreateProjectOpen(true)}
                style={{ marginTop: '0.75rem', background: '#10b981', border: 'none', color: '#fff', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
              >
                + Create First Project
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Project Name</th>
                    <th style={{ padding: '0.75rem' }}>Key</th>
                    <th style={{ padding: '0.75rem' }}>Health Status</th>
                    <th style={{ padding: '0.75rem' }}>Open Defects</th>
                    <th style={{ padding: '0.75rem' }}>Critical Defects</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(proj => (
                    <tr 
                      key={proj.id} 
                      onClick={() => onSelectProject ? onSelectProject(proj.id) : (onNavigate ? onNavigate('issues') : null)}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{proj.name}</td>
                      <td style={{ padding: '0.85rem' }}><span className="badge badge-assigned">{proj.project_key}</span></td>
                      <td style={{ padding: '0.85rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 800,
                          background: proj.health_status === 'On Track' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: proj.health_status === 'On Track' ? '#10b981' : '#ef4444'
                        }}>
                          {proj.health_status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem' }}>{proj.open_defect_count}</td>
                      <td style={{ padding: '0.85rem', color: proj.critical_defect_count > 0 ? '#ef4444' : 'inherit', fontWeight: proj.critical_defect_count > 0 ? 800 : 400 }}>{proj.critical_defect_count}</td>
                      <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ color: '#10b981', fontWeight: 700 }}>View Issues →</span>
                          <button 
                            onClick={(e) => handleDeleteProject(e, proj.id, proj.name)}
                            title="Delete Project"
                            style={{ border: 'none', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '0.35rem 0.55rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MEMBERS */}
      {activeTab === 'members' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>👥 Organization Members & Workload</h3>
          {loadingMembers ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading organization member workload...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {orgMembers.map(member => (
                <div key={member.id} style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{member.name}</strong>
                    <span className="badge badge-assigned" style={{ fontSize: '0.72rem' }}>{member.role}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{member.email}</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
                    <strong>Active Workload:</strong> {member.active_defects_count} defects ({member.capacity_utilization_pct}% capacity)
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${member.capacity_utilization_pct}%`, height: '100%', background: member.capacity_utilization_pct > 80 ? '#ef4444' : '#10b981' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BUGS & ISSUES */}
      {activeTab === 'issues' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search org defects..."
                  value={issueSearch}
                  onChange={e => setIssueSearch(e.target.value)}
                  style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
                />
              </div>

              <select 
                className="form-select" 
                value={issueSeverityFilter} 
                onChange={e => setIssueSeverityFilter(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
              >
                <option value="">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => setIsReportModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.1rem', borderRadius: '8px', background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', color: '#fff', fontWeight: 800, cursor: 'pointer', border: 'none' }}
            >
              <Bug size={16} /> + Report Issue for {org.name}
            </button>
          </div>

          {/* Issues List Table */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            {loadingIssues ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading org defects...</p>
            ) : orgIssues.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bug size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p>No defects logged for this organization matching criteria.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Issue ID & Title</th>
                      <th style={{ padding: '0.75rem' }}>Severity</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem' }}>Priority</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgIssues.map(iss => (
                      <tr 
                        key={iss.id} 
                        onClick={() => onSelectIssue ? onSelectIssue(iss.id) : null}
                        style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                      >
                        <td style={{ padding: '0.85rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>#{iss.id} — {iss.title}</span>
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          <span className={`badge badge-${iss.severity?.toLowerCase()}`}>{iss.severity}</span>
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          <span className="badge badge-assigned">{iss.status}</span>
                        </td>
                        <td style={{ padding: '0.85rem' }}>{iss.priority}</td>
                        <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>Inspect →</span>
                            <button 
                              onClick={(e) => handleDeleteIssue(e, iss.id, iss.title)}
                              title="Delete Issue"
                              style={{ border: 'none', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '0.35rem 0.55rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 6: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>📌 Organization Knowledge Base & Pinned Docs</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {pinnedDocs.map(doc => (
              <div key={doc.id} style={{ padding: '1.1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    <FileText size={18} color="#10b981" /> {doc.title}
                  </div>
                  <button onClick={(e) => handleTogglePin(doc.id, doc.is_pinned, e)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                    <Pin size={16} color={doc.is_pinned ? '#10b981' : 'var(--text-muted)'} />
                  </button>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Category: {doc.category} • Author: {doc.author_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Created: {doc.created_at}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>⚡ Organization Audit Trail & Activity Feed</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivity.map(act => (
              <div key={act.id} style={{ padding: '0.85rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>{act.user_name}</strong> updated <span style={{ color: '#10b981', fontWeight: 700 }}>{act.field_changed}</span> on <strong>{act.issue_title}</strong>
                  {act.new_value && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({act.new_value})</span>}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{act.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Squad Detail Drawer Modal */}
      {selectedSquad && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-card" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{selectedSquad.name} Squad Detail</h3>
              <button onClick={() => setSelectedSquad(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div><strong>Lead Engineer:</strong> {selectedSquad.lead_name}</div>
              <div><strong>Team Members:</strong> {selectedSquad.member_count}</div>
              <div><strong>Sprint Velocity:</strong> {selectedSquad.velocity} story points</div>
              <div><strong>Active Open Defects:</strong> {selectedSquad.open_bugs}</div>
              <div><strong>Description:</strong> {selectedSquad.description || 'Engineering squad.'}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedSquad(null)}>Close Drawer</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateProjectOpen && (
        <div className="modal-overlay" style={{ zIndex: 1250 }}>
          <div className="modal-card" style={{ maxWidth: '520px', width: '100%', padding: '1.75rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderPlus size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Create Project for {org.name}</h3>
              </div>
              <button onClick={() => setIsCreateProjectOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem' }}>Project Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Core API Service, Mobile App"
                  value={newProjectData.name}
                  onChange={e => {
                    const name = e.target.value;
                    const autoKey = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
                    setNewProjectData(prev => ({ ...prev, name, project_key: prev.project_key || autoKey }));
                  }}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem' }}>Project Key</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="form-input"
                    placeholder="e.g. CORE, MOB"
                    value={newProjectData.project_key}
                    onChange={e => setNewProjectData(prev => ({ ...prev, project_key: e.target.value.toUpperCase() }))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem' }}>Department</label>
                  <select
                    className="form-select"
                    value={newProjectData.department_id}
                    onChange={e => setNewProjectData(prev => ({ ...prev, department_id: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="">(No Department)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem' }}>Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Describe the target goals and scope of this project..."
                  value={newProjectData.description}
                  onChange={e => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem' }}>Project Type</label>
                  <select
                    className="form-select"
                    value={newProjectData.project_type}
                    onChange={e => setNewProjectData(prev => ({ ...prev, project_type: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="Software Development">Software Development</option>
                    <option value="Infrastructure & Cloud">Infrastructure & Cloud</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Security & Compliance">Security & Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem' }}>Priority</label>
                  <select
                    className="form-select"
                    value={newProjectData.priority}
                    onChange={e => setNewProjectData(prev => ({ ...prev, priority: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateProjectOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingProject} style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 800 }}>
                  {creatingProject ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-scoped Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        projects={projects}
        onIssueCreated={() => {
          setIsReportModalOpen(false);
          fetchOrganizationDetail();
          if (activeTab === 'issues') fetchOrgIssues();
        }}
        onOpenIssueDetail={onSelectIssue}
      />

      {/* Org Settings Modal */}
      <OrgSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        organization={org}
        onUpdated={fetchOrganizationDetail}
        onDeleted={() => onNavigate ? onNavigate('org') : (window.location.href = '/#org')}
      />

    </div>
  );
}

export default OrganizationDetail;
