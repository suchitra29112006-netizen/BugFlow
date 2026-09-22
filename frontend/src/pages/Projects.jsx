import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  FolderKanban, Plus, Bug, Calendar, User, Trash2, Search, Filter, LayoutGrid, 
  List, BarChart2, Sparkles, Clock, AlertTriangle, CheckCircle2, ShieldAlert, Rocket, 
  ExternalLink, Archive, RotateCcw, ChevronRight, RefreshCw, X, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Projects = ({ onSelectProject }) => {
  const { user } = useAuth();
  
  // Data States
  const [projects, setProjects] = useState([]);
  const [kpis, setKpis] = useState({
    total_projects: 0,
    active_projects: 0,
    planning_projects: 0,
    at_risk_projects: 0,
    critical_projects: 0,
    completed_projects: 0,
    open_issues: 0,
    critical_issues: 0,
    active_sprints: 0,
    upcoming_releases: 0
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table' | 'portfolio'

  // Context dropdowns
  const [workspaces, setWorkspaces] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedHealth, setSelectedHealth] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedWs, setSelectedWs] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedSquad, setSelectedSquad] = useState('ALL');
  const [sortBy, setSortBy] = useState('created');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Create Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('Software Development');
  const [priority, setPriority] = useState('Medium');
  const [statusVal, setStatusVal] = useState('Active');
  const [workspaceId, setWorkspaceId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [environment, setEnvironment] = useState('Production');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [visibility, setVisibility] = useState('Public');
  const [selectedSquadIds, setSelectedSquadIds] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjectsData();
    fetchOrgContext();
  }, [searchTerm, selectedStatus, selectedHealth, selectedPriority, selectedType, selectedWs, selectedDept, selectedSquad, sortBy, includeArchived]);

  const fetchProjectsData = async () => {
    setLoading(true);
    try {
      const [pList, kpiRes] = await Promise.all([
        api.getProjects({
          search: searchTerm,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          health: selectedHealth !== 'ALL' ? selectedHealth : undefined,
          priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
          project_type: selectedType !== 'ALL' ? selectedType : undefined,
          workspace_id: selectedWs !== 'ALL' ? selectedWs : undefined,
          department_id: selectedDept !== 'ALL' ? selectedDept : undefined,
          team_id: selectedSquad !== 'ALL' ? selectedSquad : undefined,
          sort_by: sortBy,
          include_archived: includeArchived
        }),
        api.getPortfolioKPIs().catch(() => ({}))
      ]);
      setProjects(pList || []);
      if (kpiRes && kpiRes.total_projects !== undefined) {
        setKpis(kpiRes);
      }
    } catch (err) {
      console.error("Failed loading projects portfolio:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgContext = async () => {
    try {
      const [wss, depts, tms, usrs] = await Promise.all([
        api.getWorkspaces().catch(() => []),
        api.getDepartments().catch(() => []),
        api.getWorkspaceTeams(1).catch(() => []),
        api.getUsers().catch(() => [])
      ]);
      setWorkspaces(wss || []);
      setDepartments(depts || []);
      setTeams(tms || []);
      setUsers(usrs || []);
    } catch (err) {
      console.error("Failed fetching context data:", err);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSelectedHealth('ALL');
    setSelectedPriority('ALL');
    setSelectedType('ALL');
    setSelectedWs('ALL');
    setSelectedDept('ALL');
    setSelectedSquad('ALL');
    setSortBy('created');
    setIncludeArchived(false);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError('');
    setSubmitting(true);
    try {
      await api.createProject({
        name,
        project_key: projectKey || undefined,
        description,
        project_type: projectType,
        priority,
        status: statusVal,
        workspace_id: workspaceId ? parseInt(workspaceId) : undefined,
        department_id: departmentId ? parseInt(departmentId) : undefined,
        repository_url: repoUrl || undefined,
        environment,
        start_date: startDate || undefined,
        target_date: targetDate || undefined,
        visibility,
        squad_ids: selectedSquadIds
      });
      setName('');
      setProjectKey('');
      setDescription('');
      setIsModalOpen(false);
      fetchProjectsData();
    } catch (err) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveToggle = async (proj, e) => {
    e.stopPropagation();
    try {
      if (proj.status === 'Archived') {
        await api.restoreProject(proj.id);
      } else {
        await api.archiveProject(proj.id);
      }
      fetchProjectsData();
    } catch (err) {
      alert(err.message || 'Failed to update project archive status.');
    }
  };

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this project and dependent records?")) return;

    try {
      await api.deleteProject(id);
      fetchProjectsData();
    } catch (err) {
      alert(err.message || 'Failed to delete project.');
    }
  };

  const getHealthBadge = (health) => {
    if (health === 'Critical') return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)', icon: AlertTriangle };
    if (health === 'At Risk') return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', icon: AlertTriangle };
    if (health === 'Healthy') return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)', icon: CheckCircle2 };
    return { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af', border: 'rgba(107, 114, 128, 0.3)', icon: Clock };
  };

  const selectStyle = {
    height: '38px',
    minHeight: '38px',
    padding: '0.4rem 2rem 0.4rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.83rem',
    lineHeight: '1.3',
    background: 'var(--bg-card, #121824)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    boxSizing: 'border-box',
    width: '100%',
    cursor: 'pointer'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1600px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderKanban size={22} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Projects & Portfolio</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>
            Manage engineering projects, delivery progress, teams, issues, releases, and project health across BugFlow.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={fetchProjectsData} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
            <Plus size={16} /> Create New Project
          </button>
        </div>
      </div>

      {/* TOP 10 REAL KPI CARDS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
        
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Projects</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{kpis.total_projects}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>{kpis.active_projects}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Planning</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a855f7', marginTop: '0.2rem' }}>{kpis.planning_projects}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>At Risk</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>{kpis.at_risk_projects}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Critical</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: kpis.critical_projects > 0 ? '#ef4444' : '#10b981', marginTop: '0.2rem' }}>{kpis.critical_projects}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>{kpis.completed_projects}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Open Issues</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8', marginTop: '0.2rem' }}>{kpis.open_issues}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Critical Issues</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: kpis.critical_issues > 0 ? '#f87171' : '#34d399', marginTop: '0.2rem' }}>{kpis.critical_issues}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Sprints</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.2rem' }}>{kpis.active_sprints}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Releases</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c084fc', marginTop: '0.2rem' }}>{kpis.upcoming_releases}</div>
        </div>

      </div>

      {/* FILTER TOOLBAR & VIEW SWITCHER */}
      <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* View Switcher */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none', background: viewMode === 'cards' ? 'var(--accent-primary, #6366f1)' : 'transparent', color: viewMode === 'cards' ? '#fff' : 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <LayoutGrid size={15} /> Cards View
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none', background: viewMode === 'table' ? 'var(--accent-primary, #6366f1)' : 'transparent', color: viewMode === 'table' ? '#fff' : 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <List size={15} /> Table View
            </button>
            <button
              onClick={() => setViewMode('portfolio')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none', background: viewMode === 'portfolio' ? 'var(--accent-primary, #6366f1)' : 'transparent', color: viewMode === 'portfolio' ? '#fff' : 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <BarChart2 size={15} /> Executive Portfolio
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeArchived} onChange={e => setIncludeArchived(e.target.checked)} />
              Include Archived Projects
            </label>

            <button onClick={handleClearFilters} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', borderRadius: '8px' }}>
              Clear Filters
            </button>
          </div>

        </div>

        {/* Filter Toolbar Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search name, key, desc..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', height: '38px', borderRadius: '8px', fontSize: '0.83rem', boxSizing: 'border-box', width: '100%' }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Planning">Planning</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Health Filter */}
          <div>
            <select value={selectedHealth} onChange={e => setSelectedHealth(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Health States</option>
              <option value="Healthy">Healthy</option>
              <option value="At Risk">At Risk</option>
              <option value="Critical">Critical</option>
              <option value="No Data">No Data</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Project Type Filter */}
          <div>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Project Types</option>
              <option value="Software Development">Software Development</option>
              <option value="Infrastructure & Cloud">Infrastructure & Cloud</option>
              <option value="Quality Assurance">Quality Assurance</option>
              <option value="Security & Compliance">Security & Compliance</option>
              <option value="Data & AI">Data & AI</option>
              <option value="Mobile Application">Mobile Application</option>
              <option value="Payment Gateway">Payment Gateway</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="form-select" style={selectStyle}>
              <option value="created">Recently Created</option>
              <option value="priority">Priority</option>
              <option value="progress">Derived Progress</option>
              <option value="open_issues">Most Open Issues</option>
              <option value="critical_issues">Most Critical Defects</option>
              <option value="name">Project Name</option>
            </select>
          </div>

        </div>

      </div>

      {/* VIEW CARDS */}
      {viewMode === 'cards' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading projects portfolio...</div>
        ) : projects.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
            <FolderKanban size={48} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
            <h3>No Projects Found</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem 0' }}>Adjust search filters or create your first software project.</p>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Create New Project</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.35rem' }}>
            {projects.map((proj) => {
              const hBadge = getHealthBadge(proj.health);
              const HIcon = hBadge.icon;
              return (
                <div
                  key={proj.id}
                  className="glass-panel"
                  style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-card, #121824)' }}
                  onClick={() => onSelectProject(proj.id)}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f3f4f6', margin: 0 }}>{proj.name}</h3>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                            {proj.project_key || 'PRJ'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                          {proj.workspace_name || 'Global'} • {proj.department_name || 'Engineering'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.55rem', borderRadius: '6px', background: hBadge.bg, color: hBadge.text, border: `1px solid ${hBadge.border}`, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <HIcon size={12} /> {proj.health}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.15rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.45 }}>
                      {proj.description || 'No project scope description provided.'}
                    </p>

                    {/* Squad Tags */}
                    {proj.squads && proj.squads.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.15rem' }}>
                        {proj.squads.map(sq => (
                          <span key={sq.id} style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
                            {sq.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '1.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Derived Progress</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{proj.calculated_progress}%</strong>
                      </div>
                      <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${proj.calculated_progress}%`, background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)', borderRadius: '3px' }} />
                      </div>
                    </div>

                    {/* AI Insight Snippet */}
                    {proj.ai_insight && (
                      <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', color: 'var(--text-main)', fontSize: '0.78rem', marginBottom: '1.15rem', lineHeight: 1.4 }}>
                        <Sparkles size={13} color="#a855f7" style={{ display: 'inline', marginRight: '0.35rem' }} />
                        {proj.ai_insight}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions & Stats */}
                  <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', gap: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Bug size={13} color="#818cf8" />
                        <strong>{proj.open_issues_count}</strong> Open
                      </span>
                      {proj.critical_issues_count > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444' }}>
                          <AlertTriangle size={13} />
                          <strong>{proj.critical_issues_count}</strong> Critical
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', borderRadius: '6px' }}
                        onClick={(e) => handleArchiveToggle(proj, e)}
                        title={proj.status === 'Archived' ? 'Restore Project' : 'Archive Project'}
                      >
                        {proj.status === 'Archived' ? <RotateCcw size={13} color="#34d399" /> : <Archive size={13} color="#fbbf24" />}
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.3rem 0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px' }}
                        onClick={(e) => handleDeleteProject(proj.id, e)}
                        title="Delete Project"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* VIEW TABLE */}
      {viewMode === 'table' && (
        <div className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.9rem 1rem' }}>Project</th>
                <th style={{ padding: '0.9rem 1rem' }}>Key</th>
                <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                <th style={{ padding: '0.9rem 1rem' }}>Health</th>
                <th style={{ padding: '0.9rem 1rem' }}>Priority</th>
                <th style={{ padding: '0.9rem 1rem' }}>Workspace</th>
                <th style={{ padding: '0.9rem 1rem' }}>Department</th>
                <th style={{ padding: '0.9rem 1rem' }}>Lead</th>
                <th style={{ padding: '0.9rem 1rem' }}>Progress</th>
                <th style={{ padding: '0.9rem 1rem' }}>Open Issues</th>
                <th style={{ padding: '0.9rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(proj => {
                const hBadge = getHealthBadge(proj.health);
                const HIcon = hBadge.icon;
                return (
                  <tr key={proj.id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => onSelectProject(proj.id)}>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{proj.name}</td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#818cf8' }}>{proj.project_key || 'PRJ'}</td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                        {proj.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '4px', background: hBadge.bg, color: hBadge.text, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <HIcon size={12} /> {proj.health}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>{proj.priority}</td>
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)' }}>{proj.workspace_name || 'Global'}</td>
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)' }}>{proj.department_name || 'Engineering'}</td>
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)' }}>{proj.owner?.name || 'Admin'}</td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ height: '6px', width: '60px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${proj.calculated_progress}%`, background: '#10b981' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{proj.calculated_progress}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: proj.critical_issues_count > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                      {proj.open_issues_count} {proj.critical_issues_count > 0 && `(${proj.critical_issues_count} Crit)`}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); onSelectProject(proj.id); }} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
                        Open Workspace
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW PORTFOLIO */}
      {viewMode === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {['Critical', 'At Risk', 'Healthy', 'No Data'].map(hState => {
            const group = projects.filter(p => p.health === hState);
            if (group.length === 0) return null;
            const hBadge = getHealthBadge(hState);
            const HIcon = hBadge.icon;
            return (
              <div key={hState} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: `1px solid ${hBadge.border}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hBadge.text, fontWeight: 800, fontSize: '1.1rem' }}>
                  <HIcon size={20} /> {hState.toUpperCase()} PROJECTS PORTFOLIO ({group.length})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {group.map(p => (
                    <div key={p.id} style={{ padding: '1.15rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => onSelectProject(p.id)}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.name} ({p.project_key})</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.3rem 0 0.85rem 0' }}>{p.workspace_name} • {p.department_name}</div>
                      
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div>Progress: <strong>{p.calculated_progress}%</strong></div>
                        <div>Open Defects: <strong>{p.open_issues_count}</strong> ({p.critical_issues_count} Critical)</div>
                        {p.health_reasons && p.health_reasons.length > 0 && (
                          <div style={{ color: hBadge.text, marginTop: '0.3rem', fontSize: '0.78rem' }}>
                            Primary Signal: {p.health_reasons[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW PROJECT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px', width: '100%', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Create New Software Project</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            {error && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Project Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. AI Defect Intelligence Engine"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Project Key</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. AIDEV"
                    value={projectKey}
                    onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Scope, software architecture, and deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Organization & Setup */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Project Type</label>
                  <select className="form-select" value={projectType} onChange={e => setProjectType(e.target.value)}>
                    <option value="Software Development">Software Development</option>
                    <option value="Infrastructure & Cloud">Infrastructure & Cloud</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Security & Compliance">Security & Compliance</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Mobile Application">Mobile Application</option>
                    <option value="Payment Gateway">Payment Gateway</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Priority</label>
                  <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Workspace</label>
                  <select className="form-select" value={workspaceId} onChange={e => setWorkspaceId(e.target.value)}>
                    <option value="">Select Workspace...</option>
                    {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Department</label>
                  <select className="form-select" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
                    <option value="">Select Department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Repository URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://github.com/org/repo"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating Project...' : 'Create Project'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
