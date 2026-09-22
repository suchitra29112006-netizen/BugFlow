import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, Plus, Search, Filter, Layers, Globe, Lock, Shield, Eye, X, 
  Activity, AlertTriangle, CheckCircle, Users, GitBranch, ShieldAlert, Cpu, 
  BarChart2, Server, LayoutGrid, List
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  'All', 'Product', 'Engineering', 'Platform', 'Data & AI', 
  'Internal', 'Customer', 'Research', 'Operations', 'Other'
];

export default function WorkspacesPage({ onSelectWorkspace }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // grid or portfolio

  // Modal State
  const [isNewWsOpen, setIsNewWsOpen] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsKey, setWsKey] = useState('');
  const [wsType, setWsType] = useState('Engineering');
  const [wsLeadId, setWsLeadId] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [wsVisibility, setWsVisibility] = useState('Organization');
  const [wsTimezone, setWsTimezone] = useState('UTC');
  const [wsSprintLength, setWsSprintLength] = useState(14);

  useEffect(() => {
    fetchWorkspaces();
    fetchUsers();
  }, [selectedCategory, search, sortBy]);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkspaces({
        category: selectedCategory,
        search: search,
        sort_by: sortBy
      });
      setWorkspaces(res || []);
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/v1/users');
      setUsers(res || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const handleCreateWs = async (e) => {
    e.preventDefault();
    try {
      await api.createWorkspace({
        name: wsName,
        key: wsKey ? wsKey.toUpperCase() : wsName.slice(0, 4).toUpperCase(),
        workspace_type: wsType,
        lead_id: wsLeadId ? parseInt(wsLeadId) : null,
        description: wsDesc,
        visibility: wsVisibility,
        timezone: wsTimezone,
        default_sprint_length: parseInt(wsSprintLength)
      });

      setWsName('');
      setWsKey('');
      setWsDesc('');
      setWsLeadId('');
      setIsNewWsOpen(false);
      fetchWorkspaces();
    } catch (err) {
      alert("Failed to create workspace: " + (err.message || err));
    }
  };

  // Aggregated Portfolio Metrics
  const totalProjects = workspaces.reduce((sum, w) => sum + (w.projects_count || 0), 0);
  const totalOpenIssues = workspaces.reduce((sum, w) => sum + (w.open_issues_count || 0), 0);
  const totalCriticalIssues = workspaces.reduce((sum, w) => sum + (w.critical_issues_count || 0), 0);
  const totalActiveSprints = workspaces.reduce((sum, w) => sum + (w.active_sprints_count || 0), 0);

  return (
    <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1480px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <FolderKanban size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Workspaces & Project Portfolios
              </h1>
              <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '850px', lineHeight: 1.45 }}>
                Workspaces unify related projects, teams, repositories, issues, sprints, releases, incidents, documentation, and engineering analytics into a single collaborative workspace.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-card, #1e293b)', borderRadius: '8px', padding: '0.2rem', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#3b82f6' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <LayoutGrid size={15} /> Grid
            </button>
            <button 
              onClick={() => setViewMode('portfolio')}
              style={{
                background: viewMode === 'portfolio' ? '#3b82f6' : 'transparent',
                color: viewMode === 'portfolio' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <BarChart2 size={15} /> Portfolio View
            </button>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={() => setIsNewWsOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}
          >
            <Plus size={18} /> + New Workspace
          </button>
        </div>
      </div>

      {/* Portfolio Overview KPI Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <FolderKanban size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL WORKSPACES</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{workspaces.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE PROJECTS</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalProjects}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.12)', color: '#f97316' }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>OPEN DEFECT LOAD</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalOpenIssues}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>CRITICAL ISSUES</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalCriticalIssues}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE SPRINTS</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalActiveSprints}</div>
          </div>
        </div>
      </div>

      {/* Filters, Search & Category Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '20px',
                border: selectedCategory === cat ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                background: selectedCategory === cat ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card, #121824)',
                color: selectedCategory === cat ? '#3b82f6' : 'var(--text-muted)',
                fontWeight: selectedCategory === cat ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '500px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search workspaces by name, key, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem', width: '100%', height: '38px', borderRadius: '8px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{ height: '38px', minHeight: '38px', borderRadius: '8px', padding: '0.4rem 2rem 0.4rem 0.75rem', lineHeight: '1.3', fontSize: '0.85rem', boxSizing: 'border-box' }}
            >
              <option value="name">Workspace Name</option>
              <option value="projects_count">Most Projects</option>
              <option value="open_issues_count">Highest Open Defects</option>
              <option value="health_status">Health Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Loading Workspaces...
        </div>
      ) : workspaces.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <FolderKanban size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No Workspaces Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
            No engineering workspaces match your search or filter criteria. Create your first workspace to aggregate projects and teams.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setIsNewWsOpen(true)}
            style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', fontSize: '0.88rem' }}
          >
            + Create Workspace
          </button>
        </div>
      ) : viewMode === 'portfolio' ? (
        /* PORTFOLIO VIEW TABLE */
        <div className="glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card, #121824)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1.1rem' }}>Workspace</th>
                <th style={{ padding: '0.85rem 1.1rem' }}>Category</th>
                <th style={{ padding: '0.85rem 1.1rem' }}>Lead</th>
                <th style={{ padding: '0.85rem 1.1rem' }}>Projects</th>
                <th style={{ padding: '0.85rem 1.1rem' }}>Teams</th>
                <th style={{ padding: '0.85rem 1.1rem' }}>Defects (Open / Crit)</th>
                <th style={{ padding: '0.85rem 1.1rem' }}>Health</th>
                <th style={{ padding: '0.85rem 1.1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((ws) => (
                <tr key={ws.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                  <td style={{ padding: '1rem 1.1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${ws.color_theme || '#10b981'}20`, color: ws.color_theme || '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FolderKanban size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          {ws.name}
                          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {ws.key}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{ws.description || 'Workspace container'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.1rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', fontWeight: 600 }}>
                      {ws.workspace_type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {ws.lead_name || 'Engineering Lead'}
                  </td>
                  <td style={{ padding: '1rem 1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {ws.projects_count}
                  </td>
                  <td style={{ padding: '1rem 1.1rem', color: 'var(--text-muted)' }}>
                    {ws.teams_count}
                  </td>
                  <td style={{ padding: '1rem 1.1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 700, color: ws.open_issues_count > 0 ? '#f97316' : 'var(--text-muted)' }}>
                        {ws.open_issues_count} open
                      </span>
                      {ws.critical_issues_count > 0 && (
                        <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>
                          {ws.critical_issues_count} crit
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.1rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.2rem 0.65rem', 
                      borderRadius: '12px', 
                      fontWeight: 700,
                      background: ws.health_status === 'Healthy' ? 'rgba(16, 185, 129, 0.15)' : ws.health_status === 'At Risk' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: ws.health_status === 'Healthy' ? '#10b981' : ws.health_status === 'At Risk' ? '#eab308' : '#ef4444',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                      {ws.health_status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => onSelectWorkspace && onSelectWorkspace(ws.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Open Center
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW CARDS */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.35rem' }}>
          {workspaces.map((ws) => (
            <div 
              key={ws.id} 
              className="glass-panel" 
              onClick={() => onSelectWorkspace && onSelectWorkspace(ws.id)}
              style={{ 
                padding: '1.5rem', 
                borderRadius: '16px', 
                border: '1px solid var(--border-color)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.1rem',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${ws.color_theme || '#10b981'}20`, color: ws.color_theme || '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderKanban size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {ws.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 700 }}>
                        {ws.key}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {ws.workspace_type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Health Badge */}
                <span style={{ 
                  fontSize: '0.72rem', 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '12px', 
                  fontWeight: 700,
                  background: ws.health_status === 'Healthy' ? 'rgba(16, 185, 129, 0.15)' : ws.health_status === 'At Risk' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: ws.health_status === 'Healthy' ? '#10b981' : ws.health_status === 'At Risk' ? '#eab308' : '#ef4444',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                  {ws.health_status}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {ws.description || 'Cross-functional workspace container linking related engineering projects, teams, and defect backlogs.'}
              </p>

              {/* Key Metrics Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', background: 'var(--bg-card, #121824)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Projects</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>{ws.projects_count}</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Defects</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: ws.open_issues_count > 0 ? '#f97316' : 'var(--text-primary)', marginTop: '0.1rem' }}>{ws.open_issues_count}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Teams</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>{ws.teams_count}</div>
                </div>
              </div>

              {/* Footer Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', pt: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div>Lead: <strong style={{ color: 'var(--text-primary)' }}>{ws.lead_name || 'Engineering Lead'}</strong></div>
                <div style={{ color: '#3b82f6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Command Center &rarr;
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Workspace Modal */}
      {isNewWsOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', borderRadius: '18px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <FolderKanban size={22} color="#3b82f6" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Create New Workspace</h2>
              </div>
              <button onClick={() => setIsNewWsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWs} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Workspace Name *</label>
                  <input type="text" className="form-input" placeholder="e.g. Platform Infrastructure Workspace" value={wsName} onChange={e => setWsName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Key</label>
                  <input type="text" className="form-input" placeholder="PLAT" value={wsKey} onChange={e => setWsKey(e.target.value)} maxLength={6} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category / Type</label>
                  <select className="form-select" value={wsType} onChange={e => setWsType(e.target.value)}>
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Platform">Platform</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Internal">Internal</option>
                    <option value="Customer">Customer</option>
                    <option value="Research">Research</option>
                    <option value="Operations">Operations</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Workspace Lead</label>
                  <select className="form-select" value={wsLeadId} onChange={e => setWsLeadId(e.target.value)}>
                    <option value="">Select Lead User...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Describe the engineering scope and cross-functional goals of this workspace..." value={wsDesc} onChange={e => setWsDesc(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Visibility</label>
                  <select className="form-select" value={wsVisibility} onChange={e => setWsVisibility(e.target.value)}>
                    <option value="Organization">Organization (All Members)</option>
                    <option value="Private">Private (Members Only)</option>
                    <option value="Public">Public</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Sprint Cadence (Days)</label>
                  <input type="number" className="form-input" value={wsSprintLength} onChange={e => setWsSprintLength(e.target.value)} min={7} max={30} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsNewWsOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>Create Workspace</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
