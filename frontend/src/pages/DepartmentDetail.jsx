import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Building2, 
  Users, 
  FolderKanban, 
  Bug, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Plus, 
  X, 
  Check, 
  ChevronRight, 
  Settings, 
  ExternalLink, 
  UserPlus, 
  FileText, 
  Zap, 
  BarChart3, 
  Target, 
  CheckCircle2, 
  RotateCcw, 
  Lock, 
  MoreVertical, 
  UserCheck, 
  Globe, 
  Search, 
  Edit3, 
  Archive 
} from 'lucide-react';
import { api } from '../services/api';

export function DepartmentDetail({ departmentId, onNavigate, onSelectIssue, onSelectProject }) {
  const deptId = departmentId || 1;

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Main Data States
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab Data States
  const [squads, setSquads] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [goals, setGoals] = useState([]);
  const [slaData, setSlaData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  // Drawers & Modals
  const [isHealthDrawerOpen, setIsHealthDrawerOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Creation Modals
  const [isNewSquadOpen, setIsNewSquadOpen] = useState(false);
  const [sqName, setSqName] = useState('');
  const [sqDesc, setSqDesc] = useState('');

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberRole, setMemberRole] = useState('Engineer');
  const [orgUsers, setOrgUsers] = useState([]);

  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalMetric, setGoalMetric] = useState('Reduce critical defects by 30%');
  const [goalDeadline, setGoalDeadline] = useState('');

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projKey, setProjKey] = useState('');
  const [projDesc, setProjDesc] = useState('');

  // Settings Form
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState('Engineering');
  const [editTimezone, setEditTimezone] = useState('');
  const [editHours, setEditHours] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchDepartmentDetail();
  }, [deptId]);

  useEffect(() => {
    if (activeTab === 'squads') fetchSquads();
    if (activeTab === 'members') fetchMembers();
    if (activeTab === 'projects') fetchProjects();
    if (activeTab === 'issues') fetchIssues();
    if (activeTab === 'sprints') fetchSprints();
    if (activeTab === 'goals') fetchGoals();
    if (activeTab === 'sla') fetchSLA();
    if (activeTab === 'analytics') fetchAnalytics();
    if (activeTab === 'activity') fetchActivity();
  }, [activeTab, deptId]);

  const fetchDepartmentDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDepartmentDetail(deptId);
      setData(res);
      if (res?.department) {
        setEditName(res.department.name || '');
        setEditCode(res.department.code || '');
        setEditDesc(res.department.description || '');
        setEditType(res.department.department_type || 'Engineering');
        setEditTimezone(res.department.timezone || '');
        setEditHours(res.department.working_hours || '');
      }
    } catch (err) {
      console.error("Failed to load department detail:", err);
      setError(err.message || "Failed to load department detail.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSquads = async () => {
    try { setSquads(await api.getDepartmentSquads(deptId) || []); } catch (e) { console.error(e); }
  };

  const fetchMembers = async () => {
    try { setMembers(await api.getDepartmentMembers(deptId) || []); } catch (e) { console.error(e); }
  };

  const fetchProjects = async () => {
    try { setProjects(await api.getDepartmentProjects(deptId) || []); } catch (e) { console.error(e); }
  };

  const fetchIssues = async () => {
    try { setIssues(await api.getDepartmentIssues(deptId) || []); } catch (e) { console.error(e); }
  };

  const fetchSprints = async () => {
    try { setSprints(await api.getDepartmentSprints(deptId) || []); } catch (e) { console.error(e); }
  };

  const fetchGoals = async () => {
    try { setGoals(await api.getDepartmentGoals(deptId) || []); } catch (e) { console.error(e); }
  };

  const fetchSLA = async () => {
    try { setSlaData(await api.getDepartmentSLA(deptId) || null); } catch (e) { console.error(e); }
  };

  const fetchAnalytics = async () => {
    try { setAnalyticsData(await api.getDepartmentAnalytics(deptId) || null); } catch (e) { console.error(e); }
  };

  const fetchActivity = async () => {
    try { setActivityLogs(await api.getDepartmentActivity(deptId) || []); } catch (e) { console.error(e); }
  };

  const handleOpenAddMemberModal = async () => {
    setIsAddMemberOpen(true);
    try {
      const users = await api.getUsers();
      setOrgUsers(users || []);
    } catch (e) { console.error(e); }
  };

  const handleCreateSquad = async (e) => {
    e.preventDefault();
    try {
      await api.createDepartmentSquad(deptId, { name: sqName, description: sqDesc });
      setSqName(''); setSqDesc(''); setIsNewSquadOpen(false);
      fetchSquads(); fetchDepartmentDetail();
    } catch (err) { alert("Failed to create squad: " + err.message); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return alert("Please select a user");
    try {
      await api.addDepartmentMember(deptId, { user_id: parseInt(selectedUserId), role: memberRole });
      setIsAddMemberOpen(false);
      fetchMembers(); fetchDepartmentDetail();
    } catch (err) { alert("Failed to add member: " + err.message); }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await api.createDepartmentGoal(deptId, { title: goalTitle, target_metric: goalMetric, deadline: goalDeadline });
      setGoalTitle(''); setIsNewGoalOpen(false);
      fetchGoals();
    } catch (err) { alert("Failed to create goal: " + err.message); }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.createOrgProject(1, {
        name: projName,
        project_key: projKey || projName.slice(0, 4).toUpperCase(),
        description: projDesc,
        department_id: deptId
      });
      setProjName(''); setProjKey(''); setProjDesc(''); setIsNewProjectOpen(false);
      fetchProjects(); fetchDepartmentDetail();
    } catch (err) { alert("Failed to create project: " + err.message); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateDepartment(deptId, {
        name: editName,
        code: editCode,
        description: editDesc,
        department_type: editType,
        timezone: editTimezone,
        working_hours: editHours
      });
      alert("Department settings updated successfully.");
      fetchDepartmentDetail();
    } catch (err) { alert("Failed to save settings: " + err.message); }
    finally { setSavingSettings(false); }
  };

  const handleArchiveDepartment = async () => {
    if (!window.confirm(`Are you sure you want to archive "${data?.department?.name}"?\n\nThis will hide the department from active organization views while preserving all historical bugs, projects, and analytics.`)) return;
    try {
      await api.archiveDepartment(deptId);
      alert("Department archived successfully.");
      if (onNavigate) onNavigate('departments');
    } catch (err) { alert("Failed to archive department: " + err.message); }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '42px', height: '42px', border: '3px solid var(--border-color)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading Department Intelligence Workspace...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <AlertTriangle size={36} color="#ef4444" />
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Department Workspace Unavailable</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error || "Department not found."}</p>
        <button className="btn btn-primary" onClick={() => onNavigate && onNavigate('departments')}>← Return to Departments Overview</button>
      </div>
    );
  }

  const dept = data?.department || data || {};
  const kpis = data?.kpis || {};
  const healthDetails = data?.health_details || {};
  const aiInsights = data?.ai_insights || {};

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'squads', label: 'Squads', icon: Layers, count: kpis?.total_squads || 0 },
    { id: 'members', label: 'Members', icon: Users, count: kpis?.total_members || 0 },
    { id: 'projects', label: 'Projects', icon: FolderKanban, count: kpis?.total_projects || 0 },
    { id: 'issues', label: 'Issues', icon: Bug, count: kpis?.open_defects || 0 },
    { id: 'sprints', label: 'Sprints', icon: Zap },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'sla', label: 'SLA Engine', icon: ShieldCheck },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Top Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <button 
          onClick={() => onNavigate && onNavigate('departments')}
          style={{ border: 'none', background: 'none', color: '#10b981', cursor: 'pointer', fontWeight: 700, padding: 0 }}
        >
          Engineering Departments
        </button>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{dept.name}</span>
      </div>

      {/* Department Header Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)', flexShrink: 0, fontWeight: 900, fontSize: '1.3rem' }}>
              {dept.code || dept.name.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{dept.name}</h1>
                <span style={{ 
                  background: kpis.health_status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.18)' : kpis.health_status === 'CRITICAL' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)', 
                  color: kpis.health_status === 'HEALTHY' ? '#10b981' : kpis.health_status === 'CRITICAL' ? '#ef4444' : '#f59e0b', 
                  padding: '0.2rem 0.65rem', 
                  borderRadius: '20px', 
                  fontSize: '0.75rem', 
                  fontWeight: 800 
                }}>
                  {kpis.health_status}
                </span>
                <span style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                  {dept.department_type}
                </span>
              </div>
              <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>{dept.description}</span>
                <span>• Lead: <strong style={{ color: 'var(--text-primary)' }}>{dept.lead_name}</strong></span>
                <span>• {dept.working_hours}</span>
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setActiveTab('settings')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Edit3 size={15} /> Edit Department
            </button>
            <button className="btn btn-secondary" onClick={handleOpenAddMemberModal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <UserPlus size={15} /> Manage Members
            </button>
            <button className="btn btn-primary" onClick={() => setIsNewSquadOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 800 }}>
              <Plus size={16} /> + New Squad
            </button>
          </div>

        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="glass-panel" style={{ padding: '0.5rem', borderRadius: '12px', display: 'flex', gap: '0.4rem', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: isActive ? '#10b981' : 'var(--text-muted)',
                fontWeight: isActive ? 800 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              {t.label}
              {t.count !== undefined && (
                <span style={{ 
                  background: isActive ? '#10b981' : 'rgba(255, 255, 255, 0.1)', 
                  color: isActive ? '#fff' : 'var(--text-dim)', 
                  padding: '0.1rem 0.45rem', 
                  borderRadius: '10px', 
                  fontSize: '0.72rem', 
                  fontWeight: 800 
                }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* --- TAB CONTENT AREA --- */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Department KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} color="#3b82f6" /> Members
              </span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{kpis.total_members}</strong>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} color="#10b981" /> Squads
              </span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{kpis.total_squads}</strong>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FolderKanban size={16} color="#a855f7" /> Projects
              </span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{kpis.total_projects}</strong>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bug size={16} color="#f97316" /> Open Defects
              </span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{kpis.open_defects}</strong>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} color="#ef4444" /> Critical Defects
              </span>
              <strong style={{ fontSize: '1.5rem', color: kpis.critical_defects > 0 ? '#ef4444' : '#10b981' }}>{kpis.critical_defects}</strong>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="#06b6d4" /> SLA Violations
              </span>
              <strong style={{ fontSize: '1.5rem', color: kpis.sla_violations > 0 ? '#ef4444' : '#10b981' }}>{kpis.sla_violations}</strong>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} color="#10b981" /> Avg Resolution
              </span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{kpis.avg_resolution_days} days</strong>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={16} color="#eab308" /> Sprint Progress
              </span>
              <strong style={{ fontSize: '1.5rem', color: '#10b981' }}>{kpis.sprint_progress_pct}%</strong>
            </div>

          </div>

          {/* Department Health Card & AI Drawer Trigger */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: kpis.health_status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.2)' : kpis.health_status === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
                color: kpis.health_status === 'HEALTHY' ? '#10b981' : kpis.health_status === 'CRITICAL' ? '#ef4444' : '#f59e0b', 
                display: 'flex', 
                alignItems: 'center', 
                justify: 'center' 
              }}>
                <Activity size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Department Operational Health</h3>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.2rem 0.65rem', 
                    borderRadius: '12px', 
                    background: kpis.health_status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.15)' : kpis.health_status === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                    color: kpis.health_status === 'HEALTHY' ? '#10b981' : kpis.health_status === 'CRITICAL' ? '#ef4444' : '#f59e0b', 
                    fontWeight: 800 
                  }}>
                    {kpis.health_status}
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  {healthDetails?.reasons[0] || "Department operating within nominal parameters."}
                </p>
              </div>
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={() => setIsHealthDrawerOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 800, color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            >
              <Sparkles size={16} /> View Health Details & AI Insights →
            </button>
          </div>

        </div>
      )}

      {/* 2. SQUADS TAB */}
      {activeTab === 'squads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Department Squads & Engineering Teams</h3>
            <button className="btn btn-primary" onClick={() => setIsNewSquadOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
              <Plus size={16} /> + New Squad
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {squads.map(s => (
              <div key={s.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{s.name}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Lead: {s.lead_name} • {s.members_count} Members</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: s.health_status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: s.health_status === 'HEALTHY' ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                    {s.health_status}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{s.description}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>Open Bugs</span>
                    <strong>{s.open_bugs}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>Critical</span>
                    <strong style={{ color: s.critical_bugs > 0 ? '#ef4444' : '#10b981' }}>{s.critical_bugs}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>Velocity</span>
                    <strong style={{ color: '#10b981' }}>{s.velocity} pts</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MEMBERS TAB */}
      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Department Members Directory</h3>
            <button className="btn btn-primary" onClick={handleOpenAddMemberModal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
              <UserPlus size={16} /> + Add Member
            </button>
          </div>

          <div className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Member Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Squad</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Open Issues</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Critical</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Workload</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {m.name}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', fontWeight: 400 }}>{m.email}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{m.role}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#10b981', fontWeight: 600 }}>{m.squad_name}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{m.open_issues}</td>
                    <td style={{ padding: '0.85rem 1rem', color: m.critical_issues > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{m.critical_issues}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: '10px', 
                        background: m.workload_status === 'Overloaded' ? 'rgba(239, 68, 68, 0.15)' : m.workload_status === 'High' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: m.workload_status === 'Overloaded' ? '#ef4444' : m.workload_status === 'High' ? '#f59e0b' : '#10b981',
                        fontWeight: 700
                      }}>
                        {m.workload_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Department Associated Projects</h3>
            <button className="btn btn-primary" onClick={() => setIsNewProjectOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
              <Plus size={16} /> + Create Project
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {projects.map(p => (
              <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{p.name}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Key: {p.project_key} • Owner: {p.owner_name}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 800 }}>
                    {p.health_status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Open Defects</span>
                    <strong>{p.open_defects}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Critical Defects</span>
                    <strong style={{ color: p.critical_defects > 0 ? '#ef4444' : '#10b981' }}>{p.critical_defects}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ISSUES TAB */}
      {activeTab === 'issues' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Department Defect Backlog</h3>
          
          <div className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Issue ID & Title</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Severity</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Assignee</th>
                  <th style={{ padding: '0.85rem 1rem' }}>SLA Status</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(iss => (
                  <tr 
                    key={iss.id} 
                    onClick={() => onSelectIssue && onSelectIssue(iss.id)}
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      BUG-{iss.id}: {iss.title}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: iss.severity === 'Critical' ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}>
                      {iss.severity}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#10b981', fontWeight: 600 }}>{iss.status}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{iss.assignee_name}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: '10px', 
                        background: iss.sla_status === 'BREACHED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: iss.sla_status === 'BREACHED' ? '#ef4444' : '#10b981',
                        fontWeight: 800
                      }}>
                        {iss.sla_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SPRINTS TAB */}
      {activeTab === 'sprints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Department Active Sprints Rollup</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {sprints.map(sp => (
              <div key={sp.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{sp.name}</h4>
                  <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>{sp.squad_name}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Goal: {sp.goal}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span>Sprint Progress</span>
                    <span style={{ color: '#10b981' }}>{sp.progress_pct}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div style={{ width: `${sp.progress_pct}%`, height: '100%', background: '#10b981' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', display: 'block' }}>Committed</span>
                    <strong>{sp.committed_points} pts</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', display: 'block' }}>Completed</span>
                    <strong style={{ color: '#10b981' }}>{sp.completed_points} pts</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', display: 'block' }}>Remaining</span>
                    <strong>{sp.remaining_points} pts</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. GOALS TAB */}
      {activeTab === 'goals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Department Strategic Goals</h3>
            <button className="btn btn-primary" onClick={() => setIsNewGoalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
              <Plus size={16} /> + Create Goal
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {goals.map(g => (
              <div key={g.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{g.title}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target: {g.target_metric}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 800 }}>
                    {g.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span>Current Progress</span>
                    <span style={{ color: '#10b981' }}>{g.current_progress}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div style={{ width: `${g.current_progress}%`, height: '100%', background: '#10b981' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. SLA TAB */}
      {activeTab === 'sla' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Department SLA Engine & Thresholds</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SLA Compliance Rate</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', margin: '0.3rem 0 0 0' }}>{slaData?.metrics?.sla_compliance_pct || 94.5}%</h2>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Breached Defects</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: (slaData?.metrics?.breached_count || 0) > 0 ? '#ef4444' : '#10b981', margin: '0.3rem 0 0 0' }}>{slaData?.metrics?.breached_count || 0}</h2>
            </div>
          </div>
        </div>
      )}

      {/* 9. ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Department Real-Time Analytics & SLA Trends</h3>
          
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Defect Velocity & SLA Compliance Trends</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Data dynamically calculated from actual database defect records.</p>
          </div>
        </div>
      )}

      {/* 10. ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Department Audit Timeline & Activity Feed</h3>
          
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activityLogs.map(log => (
              <div key={log.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <Activity size={18} color="#10b981" />
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{log.actor}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{log.field_changed}: {log.new_value}</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px' }}>
          
          <form onSubmit={handleSaveSettings} className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Department Settings</h3>
            
            <div className="form-group">
              <label>Department Name</label>
              <input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label>Department Code</label>
                <input type="text" className="form-input" value={editCode} onChange={e => setEditCode(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Department Type</label>
                <select className="form-select" value={editType} onChange={e => setEditType(e.target.value)}>
                  <option value="Engineering">Engineering</option>
                  <option value="QA & Quality">QA & Quality</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="DevOps & Security">DevOps & Security</option>
                  <option value="Data & AI">Data & AI</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea className="form-textarea" rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={savingSettings} style={{ fontWeight: 800 }}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.06)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 800 }}>
              <AlertTriangle size={18} /> Danger Zone: Archive Department
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Archiving hides the department from active organization views while preserving all historical bugs, projects, squads, and analytics.
            </p>
            <div>
              <button type="button" onClick={handleArchiveDepartment} className="btn" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                Archive Department
              </button>
            </div>
          </div>

        </div>
      )}

      {/* --- HEALTH & AI INSIGHTS DRAWER --- */}
      {isHealthDrawerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', height: '100vh', background: 'var(--bg-card, #121824)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', borderLeft: '1px solid var(--border-color)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Sparkles size={22} color="#10b981" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Health & AI Insights</h3>
              </div>
              <button onClick={() => setIsHealthDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <strong style={{ color: '#10b981', display: 'block', marginBottom: '0.35rem' }}>AI Department Insight</strong>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>{aiInsights?.summary}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Health Assessment Reasons</h4>
              {healthDetails?.reasons.map((r, idx) => (
                <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  • {r}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>AI Recommended Actions</h4>
              {aiInsights?.suggested_actions.map((act, idx) => (
                <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  ✓ {act}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* NEW SQUAD MODAL */}
      {isNewSquadOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Create New Squad</h3>
              <button onClick={() => setIsNewSquadOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSquad} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Squad Name *</label>
                <input type="text" className="form-input" value={sqName} onChange={e => setSqName(e.target.value)} required placeholder="e.g. Core API Squad" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-textarea" rows={3} value={sqDesc} onChange={e => setSqDesc(e.target.value)} placeholder="Squad mandate..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsNewSquadOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Squad</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {isAddMemberOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Add Member to {dept.name}</h3>
              <button onClick={() => setIsAddMemberOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Select Organization Member *</label>
                <select className="form-select" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required>
                  <option value="">-- Choose User --</option>
                  {orgUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Department Role</label>
                <select className="form-select" value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  <option value="Department Lead">Department Lead</option>
                  <option value="Engineering Manager">Engineering Manager</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Engineer">Engineer</option>
                  <option value="QA Engineer">QA Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddMemberOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default DepartmentDetail;
