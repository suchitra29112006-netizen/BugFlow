import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Activity, Award, Code, CheckCircle2, Clock, Search, 
  Filter, AlertTriangle, Briefcase, Cpu, ExternalLink, X, Mail, UserCheck, 
  Plus, Download, Sparkles, Layers, FolderKanban, BarChart2, Check, RefreshCw,
  LayoutGrid, List, FileText, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

const VIEWS = [
  { id: 'directory', label: 'Directory', icon: LayoutGrid },
  { id: 'workload', label: 'Workload', icon: Activity },
  { id: 'capacity', label: 'Capacity Matrix', icon: BarChart2 },
  { id: 'skills', label: 'Skill Matrix', icon: Award },
  { id: 'availability', label: 'Availability', icon: Clock },
];

export function PeoplePage() {
  const [activeView, setActiveView] = useState('directory');
  const [people, setPeople] = useState([]);
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedWs, setSelectedWs] = useState('ALL');
  const [selectedSquad, setSelectedSquad] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedWorkload, setSelectedWorkload] = useState('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState('ALL');
  const [selectedSkill, setSelectedSkill] = useState('ALL');

  // Member Workload Drawer State
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [drawerData, setDrawerData] = useState(null);
  const [loadingDrawer, setLoadingDrawer] = useState(false);

  // Modals & Drawers
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Developer');
  const [newMemberCapacity, setNewMemberCapacity] = useState(40);
  const [syncing, setSyncing] = useState(false);

  // Workload Planner Modal State
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerSkill, setPlannerSkill] = useState('');
  const [plannerMatches, setPlannerMatches] = useState([]);
  const [loadingPlanner, setLoadingPlanner] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchPeopleData();
    fetchOrgContext();
  }, [selectedDept, selectedWs, selectedSquad, selectedRole, selectedWorkload, selectedAvailability, selectedSkill, searchTerm]);

  const fetchPeopleData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [peopleRes, overviewRes] = await Promise.all([
        api.getPeople({
          search: searchTerm,
          department_id: selectedDept !== 'ALL' ? selectedDept : undefined,
          workspace_id: selectedWs !== 'ALL' ? selectedWs : undefined,
          squad_id: selectedSquad !== 'ALL' ? selectedSquad : undefined,
          role: selectedRole !== 'ALL' ? selectedRole : undefined,
          workload_status: selectedWorkload !== 'ALL' ? selectedWorkload : undefined,
          availability_status: selectedAvailability !== 'ALL' ? selectedAvailability : undefined,
          skill: selectedSkill !== 'ALL' ? selectedSkill : undefined
        }),
        api.getPeopleOverview().catch(() => null)
      ]);
      setPeople(peopleRes || []);
      setOverview(overviewRes);
    } catch (err) {
      console.error("Failed to load People & Workload data:", err);
      setError(err.message || "Failed connecting to People API.");
      setPeople([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgContext = async () => {
    try {
      const [depts, wss, tms] = await Promise.all([
        api.getDepartments().catch(() => []),
        api.getWorkspaces().catch(() => []),
        api.getWorkspaceTeams(1).catch(() => [])
      ]);
      setDepartments(depts || []);
      setWorkspaces(wss || []);
      setTeams(tms || []);
    } catch (err) {
      console.error("Failed fetching org context:", err);
    }
  };

  const handleInspectMember = async (memberId) => {
    setSelectedMemberId(memberId);
    setLoadingDrawer(true);
    try {
      const data = await api.getPersonWorkloadDrawer(memberId);
      setDrawerData(data);
    } catch (err) {
      console.error("Failed fetching member drawer data:", err);
    } finally {
      setLoadingDrawer(false);
    }
  };

  const handleSyncCapacity = async () => {
    setSyncing(true);
    try {
      await api.syncPeopleCapacity();
      fetchPeopleData();
    } catch (err) {
      alert("Failed syncing capacity data: " + (err.message || err));
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const blob = await api.exportPeopleWorkloadCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bugflow_people_workload_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed exporting workload CSV: " + (err.message || err));
    } finally {
      setExporting(false);
    }
  };

  const handleOpenPlanner = async (skill = '') => {
    setActiveView('workload');
    setIsPlannerOpen(true);
    setPlannerSkill(skill);
    setLoadingPlanner(true);
    try {
      const res = await api.getAiAssignmentMatch({ required_skill: skill && skill !== 'ALL' ? skill : undefined });
      setPlannerMatches(res.suggested_assignees || []);
    } catch (err) {
      console.error("Failed loading workload planner matches:", err);
      setPlannerMatches([]);
    } finally {
      setLoadingPlanner(false);
    }
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.addPerson({
        name: newMemberName,
        email: newMemberEmail,
        role: newMemberRole,
        weekly_capacity: parseInt(newMemberCapacity)
      });
      setNewMemberName('');
      setNewMemberEmail('');
      setIsAddMemberOpen(false);
      fetchPeopleData();
    } catch (err) {
      alert("Failed adding member: " + (err.message || err));
    }
  };

  // Extract unique skills from people list for dynamic filter dropdown
  const allSkills = Array.from(new Set(people.flatMap(p => p.skills || [])));

  // KPI summary metrics
  const kpis = overview?.kpis || {
    total_members: people.length,
    avg_allocation_pct: 69.0,
    available_capacity_pct: 31.0,
    at_risk_count: people.filter(p => p.status === 'AT_RISK').length,
    overloaded_count: people.filter(p => p.status === 'OVERLOADED').length,
    active_issues_count: people.reduce((sum, p) => sum + (p.workload?.open_bugs || 0), 0),
    critical_issues_count: people.reduce((sum, p) => sum + (p.workload?.critical_bugs || 0), 0),
    unavailable_count: 1
  };

  const selectStyle = {
    height: '40px',
    minHeight: '40px',
    padding: '0.45rem 2.2rem 0.45rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.84rem',
    lineHeight: '1.3',
    background: 'var(--bg-card, #121824)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    boxSizing: 'border-box',
    width: '100%',
    cursor: 'pointer'
  };

  return (
    <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1500px', margin: '0 auto' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Users size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                People & Workload
              </h1>
              <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '850px' }}>
                Manage team capacity, workload, skills, assignments, and engineering availability across BugFlow.
              </p>
            </div>
          </div>
        </div>

        {/* HEADER ACTIONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setIsAddMemberOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <Plus size={16} /> + Add Member
          </button>
          
          <button 
            className="btn-secondary"
            onClick={handleSyncCapacity}
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={syncing ? "spin" : ""} /> {syncing ? 'Syncing...' : 'Sync Capacity Data'}
          </button>

          <button 
            className="btn-secondary"
            onClick={handleExportCSV}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <Download size={15} className={exporting ? "spin" : ""} /> {exporting ? 'Exporting...' : 'Export'}
          </button>

          <button 
            className="btn-secondary"
            onClick={() => handleOpenPlanner('')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
          >
            <Activity size={15} /> Workload Planner
          </button>
        </div>
      </div>

      {/* TOP KPI SECTION (8 CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
        
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>TOTAL MEMBERS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{kpis.total_members}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Active members</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>AVG ALLOCATION</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: kpis.avg_allocation_pct > 85 ? '#ef4444' : '#10b981', marginTop: '0.2rem' }}>{kpis.avg_allocation_pct}%</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Across active members</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>AVAILABLE CAPACITY</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.2rem' }}>{kpis.available_capacity_pct}%</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Remaining allocation</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>AT RISK</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: kpis.at_risk_count > 0 ? '#f97316' : 'var(--text-primary)', marginTop: '0.2rem' }}>{kpis.at_risk_count}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Above warning threshold</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>OVERLOADED</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: kpis.overloaded_count > 0 ? '#ef4444' : '#10b981', marginTop: '0.2rem' }}>{kpis.overloaded_count}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Members above 100%</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>ACTIVE ISSUES</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{kpis.active_issues_count}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Currently assigned</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>CRITICAL ISSUES</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: kpis.critical_issues_count > 0 ? '#ef4444' : '#10b981', marginTop: '0.2rem' }}>{kpis.critical_issues_count}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Assigned critical defects</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>UNAVAILABLE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{kpis.unavailable_count}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>On leave / unavailable</div>
        </div>

      </div>

      {/* AI WORKLOAD INSIGHTS BANNER */}
      {overview?.ai_insights && overview.ai_insights.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.1rem 1.4rem', borderRadius: '14px', border: '1px solid rgba(168, 85, 247, 0.3)', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#a855f7', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>AI WORKLOAD INSIGHT</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {overview.ai_insights[0].title}: <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{overview.ai_insights[0].description}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setActiveView('workload')} style={{ background: 'none', border: '1px solid #a855f7', color: '#a855f7', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            Review Capacity &rarr;
          </button>
        </div>
      )}

      {/* VIEW SWITCHER HEADER */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
        {VIEWS.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.1rem',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #10b981' : '3px solid transparent',
                color: isActive ? '#10b981' : 'var(--text-muted)',
                fontWeight: isActive ? 800 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', gridColumn: 'span 2', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search by name, email, skill, role, squad..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem', height: '40px', borderRadius: '8px', fontSize: '0.84rem', boxSizing: 'border-box', width: '100%' }}
            />
          </div>

          {/* Department Filter */}
          <div>
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* Workspace Filter */}
          <div>
            <select value={selectedWs} onChange={e => setSelectedWs(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Workspaces</option>
              {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          {/* Squad / Team Filter */}
          <div>
            <select value={selectedSquad} onChange={e => setSelectedSquad(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Squads</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Roles</option>
              <option value="DEVELOPER">Developer</option>
              <option value="QA">QA Engineer</option>
              <option value="ADMIN">Admin / Lead</option>
              <option value="REPORTER">Product / Reporter</option>
            </select>
          </div>

          {/* Workload Status Filter */}
          <div>
            <select value={selectedWorkload} onChange={e => setSelectedWorkload(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Workload States</option>
              <option value="AVAILABLE">Available (0-49%)</option>
              <option value="OPTIMAL">Optimal (50-79%)</option>
              <option value="AT_RISK">At Risk (80-99%)</option>
              <option value="OVERLOADED">Overloaded (100%+)</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <select value={selectedAvailability} onChange={e => setSelectedAvailability(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Availability</option>
              <option value="Available">Available</option>
              <option value="Limited">Limited</option>
              <option value="Fully Allocated">Fully Allocated</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          {/* Skills Filter */}
          <div>
            <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Verified Skills</option>
              {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

        </div>

        {/* Reset Filters if any active */}
        {(searchTerm || selectedDept !== 'ALL' || selectedWs !== 'ALL' || selectedSquad !== 'ALL' || selectedRole !== 'ALL' || selectedWorkload !== 'ALL' || selectedAvailability !== 'ALL' || selectedSkill !== 'ALL') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('ALL');
                setSelectedWs('ALL');
                setSelectedSquad('ALL');
                setSelectedRole('ALL');
                setSelectedWorkload('ALL');
                setSelectedAvailability('ALL');
                setSelectedSkill('ALL');
              }}
              style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <X size={14} /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* VIEW CONTENT RENDERING */}
      {loading ? (
        <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Analyzing capacity, assignments, and workload allocations...
        </div>
      ) : people.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <Users size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No Team Members Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
            No engineering members match your active filter criteria. Clear filters or add new team members.
          </p>
          <button className="btn btn-primary" onClick={() => { setSearchTerm(''); setSelectedRole('ALL'); setSelectedWorkload('ALL'); setSelectedSkill('ALL'); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* 1. DIRECTORY VIEW */}
          {activeView === 'directory' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {people.map((p) => {
                const status = p.status || p.workload_status || 'OPTIMAL';
                const utilizationPct = p.utilization_pct || p.capacity_pct || p.capacity_percentage || 75;
                const allocatedHours = p.allocated_hours || 30;
                const capacityHours = p.capacity_hours || 40;
                const availableHours = p.available_hours || 10;
                const skills = p.skills || ["Python", "FastAPI", "React", "PostgreSQL"];
                const isOverloaded = status === 'OVERLOADED';
                const isAtRisk = status === 'AT_RISK';
                const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

                return (
                  <div key={p.id} className="glass-panel" style={{ padding: '1.4rem', borderRadius: '16px', border: isOverloaded ? '1px solid rgba(239, 68, 68, 0.4)' : (isAtRisk ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid var(--border-color)'), display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Member Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: isOverloaded ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' : 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.05rem', flexShrink: 0 }}>
                        {initials}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </h3>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {p.role} • <strong style={{ color: 'var(--text-primary)' }}>{p.department || 'Engineering'}</strong>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{p.squad || 'Core Squad'} • {p.workspace || 'Engineering Workspace'}</div>
                      </div>

                      <span style={{ 
                        fontSize: '0.72rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '12px', 
                        fontWeight: 800,
                        background: isOverloaded ? 'rgba(239, 68, 68, 0.15)' : (isAtRisk ? 'rgba(249, 115, 22, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                        color: isOverloaded ? '#ef4444' : (isAtRisk ? '#f97316' : '#10b981')
                      }}>
                        {status}
                      </span>
                    </div>

                    {/* Allocation Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                        <span><strong>{utilizationPct}% allocated</strong> ({allocatedHours}h / {capacityHours}h)</span>
                        <strong style={{ color: availableHours > 0 ? '#10b981' : '#ef4444' }}>{availableHours}h available</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, utilizationPct)}%`, height: '100%', background: isOverloaded ? '#ef4444' : (isAtRisk ? '#f97316' : '#10b981'), borderRadius: '3px' }} />
                      </div>
                    </div>

                    {/* Current Work Items */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'var(--bg-card, #121824)', padding: '0.65rem', borderRadius: '8px', textAlign: 'center', fontSize: '0.78rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Active Bugs</span>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>{p.workload?.open_bugs ?? p.active_assigned_bugs ?? 3}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Critical</span>
                        <div style={{ fontWeight: 800, color: (p.workload?.critical_bugs ?? 0) > 0 ? '#ef4444' : '#10b981', marginTop: '0.1rem' }}>{p.workload?.critical_bugs ?? 0}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Sprint Items</span>
                        <div style={{ fontWeight: 800, color: '#3b82f6', marginTop: '0.1rem' }}>{(p.workload?.open_bugs ?? p.active_assigned_bugs ?? 3) + 1}</div>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {skills.map((s, idx) => (
                        <span key={idx} style={{ fontSize: '0.72rem', padding: '0.18rem 0.55rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button 
                      onClick={() => handleInspectMember(p.id)}
                      className="btn-secondary"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.2rem' }}
                    >
                      <Cpu size={15} /> Inspect Workload
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. WORKLOAD VIEW */}
          {activeView === 'workload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {['AVAILABLE', 'OPTIMAL', 'AT_RISK', 'OVERLOADED'].map((groupStatus) => {
                const groupMembers = people.filter(p => (p.status || p.workload_status || 'OPTIMAL') === groupStatus);
                const statusColor = groupStatus === 'AVAILABLE' ? '#3b82f6' : (groupStatus === 'OPTIMAL' ? '#10b981' : (groupStatus === 'AT_RISK' ? '#f97316' : '#ef4444'));

                return (
                  <div key={groupStatus} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColor }} />
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{groupStatus} ({groupMembers.length})</h3>
                    </div>

                    {groupMembers.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No members currently in {groupStatus} workload status.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {groupMembers.map((p) => (
                          <div key={p.id} onClick={() => handleInspectMember(p.id)} style={{ padding: '0.9rem 1.1rem', borderRadius: '10px', background: 'var(--bg-card, #121824)', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{p.name}</strong>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.role} • {p.squad || 'Core Squad'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ fontSize: '0.95rem', color: statusColor }}>{p.utilization_pct || p.capacity_pct || 75}%</strong>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{p.available_hours || 10}h avail</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. CAPACITY MATRIX VIEW */}
          {activeView === 'capacity' && (
            <div className="glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card, #121824)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Member</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Department</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Squad</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Workspace</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Capacity</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Allocated</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Available</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Active Bugs</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.id} onClick={() => handleInspectMember(p.id)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                      <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</td>
                      <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{p.department || 'Engineering'}</td>
                      <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{p.squad || 'Core Squad'}</td>
                      <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{p.workspace || 'Workspace'}</td>
                      <td style={{ padding: '0.9rem 1.1rem' }}>{p.capacity_hours || 40}h</td>
                      <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: (p.utilization_pct || 75) >= 100 ? '#ef4444' : 'var(--text-primary)' }}>{p.allocated_hours || 30}h ({p.utilization_pct || 75}%)</td>
                      <td style={{ padding: '0.9rem 1.1rem', color: '#10b981', fontWeight: 700 }}>{p.available_hours || 10}h</td>
                      <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: '#f97316' }}>{p.workload?.open_bugs ?? p.active_assigned_bugs ?? 3}</td>
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: (p.status || p.workload_status) === 'OVERLOADED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: (p.status || p.workload_status) === 'OVERLOADED' ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                          {p.status || p.workload_status || 'OPTIMAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. SKILL MATRIX VIEW */}
          {activeView === 'skills' && (
            <div className="glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card, #121824)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Member</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Role</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Verified Skill Capabilities</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Available Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => {
                    const skills = p.skills || ["Python", "FastAPI", "React", "PostgreSQL"];
                    return (
                      <tr key={p.id} onClick={() => handleInspectMember(p.id)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                        <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{p.role}</td>
                        <td style={{ padding: '0.9rem 1.1rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {skills.map((s, idx) => (
                              <span key={idx} style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981', fontWeight: 600 }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: '#3b82f6' }}>{p.available_hours || 10} Hours Available</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. AVAILABILITY VIEW */}
          {activeView === 'availability' && (
            <div className="glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card, #121824)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Member</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>This Week Available</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Next Week Est. Available</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Availability Status</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.id} onClick={() => handleInspectMember(p.id)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                      <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</td>
                      <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: '#10b981' }}>{p.available_hours || 10} Hours</td>
                      <td style={{ padding: '0.9rem 1.1rem', color: '#3b82f6' }}>{(p.available_hours || 10) + 8} Hours</td>
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', fontWeight: 600 }}>
                          {p.availability_status || 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* MEMBER WORKLOAD DRAWER */}
      {selectedMemberId && drawerData && drawerData.member && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', background: 'var(--bg-card, #121824)', borderLeft: '1px solid var(--border-color)', zIndex: 1100, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{drawerData.member.name}</h3>
            <button onClick={() => { setSelectedMemberId(null); setDrawerData(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Org Context */}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>{drawerData.member.role}</strong> • {drawerData.member.department || 'Engineering'} &gt; {drawerData.member.squad || 'Core Squad'}
          </div>

          {/* Capacity Breakdown */}
          <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>Capacity</span>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{drawerData.member.capacity_hours || 40}h / week</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>Allocated</span>
              <strong style={{ fontSize: '1rem', color: '#f97316' }}>{drawerData.member.allocated_hours || 30}h ({drawerData.member.utilization_pct || 75}%)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>Available</span>
              <strong style={{ fontSize: '1rem', color: '#10b981' }}>{drawerData.member.available_hours || 10}h</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>Status</span>
              <strong style={{ fontSize: '0.9rem', color: (drawerData.member.status || drawerData.member.workload_status) === 'OVERLOADED' ? '#ef4444' : '#10b981' }}>{drawerData.member.status || drawerData.member.workload_status || 'OPTIMAL'}</strong>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {(drawerData.member.skills || ["Python", "FastAPI", "React"]).map((s, idx) => (
                <span key={idx} style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 600 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Current Assigned Defects */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Current Active Defects ({(drawerData.assigned_issues || []).length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(drawerData.assigned_issues || []).map((issue) => (
                <div key={issue.id} style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{issue.issue_key || `BUG-${issue.id}`}: {issue.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status: {issue.status} • Est: {issue.estimated_hours || 4}h</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>
                    {issue.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {isAddMemberOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Add New Team Member</h3>
              </div>
              <button onClick={() => setIsAddMemberOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Aarav Sharma" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address *</label>
                <input type="email" className="form-input" placeholder="aarav@bugflow.io" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Role</label>
                  <select className="form-select" value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)}>
                    <option value="Developer">Developer</option>
                    <option value="QA">QA Engineer</option>
                    <option value="Admin">Admin / Lead</option>
                    <option value="Reporter">Product Manager</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Capacity (h/wk)</label>
                  <input type="number" className="form-input" value={newMemberCapacity} onChange={e => setNewMemberCapacity(e.target.value)} min={10} max={60} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddMemberOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORKLOAD PLANNER MODAL */}
      {isPlannerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Activity size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>AI Workload & Capacity Planner</h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Match active engineering backlog items with available team members based on skills and capacity.</p>
                </div>
              </div>
              <button onClick={() => setIsPlannerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Skill Selector Filter */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sparkles size={18} color="#a855f7" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Filter by Required Skill:</span>
              </div>
              <select 
                value={plannerSkill} 
                onChange={(e) => handleOpenPlanner(e.target.value)} 
                className="form-select" 
                style={{ height: '38px', minHeight: '38px', padding: '0.4rem 2rem 0.4rem 0.75rem', lineHeight: '1.3', borderRadius: '8px', fontSize: '0.84rem', maxWidth: '240px', boxSizing: 'border-box' }}
              >
                <option value="">All Skills</option>
                {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* AI Recommendation Cards */}
            {loadingPlanner ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Analyzing capacity and skill availability across all squads...
              </div>
            ) : plannerMatches.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No capacity matches found for skill "{plannerSkill}".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Recommended Assignees ({plannerMatches.length})
                </h4>

                {plannerMatches.map((match) => (
                  <div key={match.member_id} style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                        {match.name ? match.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{match.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{match.role} • {match.email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>
                          ✨ {match.recommendation_reason}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>{match.available_hours}h avail</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{match.utilization_pct}% utilization</div>
                      </div>
                      <button 
                        onClick={() => { setIsPlannerOpen(false); handleInspectMember(match.member_id); }}
                        className="btn-secondary"
                        style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Inspect Workload
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => setIsPlannerOpen(false)}>Close Planner</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
