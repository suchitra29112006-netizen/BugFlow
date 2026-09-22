import React, { useState, useEffect } from 'react';
import { 
  Target, Plus, CheckCircle2, AlertTriangle, TrendingUp, Sparkles, FolderKanban, X,
  Search, Filter, LayoutGrid, List, Clock, ChevronRight, Activity, Calendar, Eye
} from 'lucide-react';
import { api } from '../services/api';

const VIEW_MODES = [
  { id: 'cards', label: 'Cards', icon: LayoutGrid },
  { id: 'table', label: 'Table', icon: List },
  { id: 'timeline', label: 'Timeline', icon: Clock },
];

export function GoalsPage({ onSelectGoal }) {

  const [goals, setGoals] = useState([]);
  const [kpis, setKpis] = useState({
    total_active_objectives: 0,
    on_track: 0,
    at_risk: 0,
    behind: 0,
    avg_progress: 0.0,
    due_this_quarter: 0
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards');

  // Context Data
  const [departments, setDepartments] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [squads, setSquads] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedWs, setSelectedWs] = useState('ALL');
  const [selectedSquad, setSelectedSquad] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');

  // New Engineering Goal Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState('Engineering');
  const [timePeriod, setTimePeriod] = useState('Q4 2026');
  const [deptId, setDeptId] = useState('');
  const [wsId, setWsId] = useState('');
  const [targetMetric, setTargetMetric] = useState('100% Completion');
  const [deadlineDays, setDeadlineDays] = useState(60);

  // Key Results inside modal
  const [modalKRs, setModalKRs] = useState([
    { title: 'Zero Critical Defects', direction: 'LOWER_IS_BETTER', start_value: 3, target_value: 0, unit: 'defects', data_source: 'BUGS_TASKS' }
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGoalsData();
    fetchOrgContext();
  }, [searchTerm, selectedStatus, selectedDept, selectedWs, selectedSquad, selectedType, selectedPeriod]);

  const fetchGoalsData = async () => {
    setLoading(true);
    try {
      const res = await api.getGoals({
        search: searchTerm,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        department_id: selectedDept !== 'ALL' ? selectedDept : undefined,
        workspace_id: selectedWs !== 'ALL' ? selectedWs : undefined,
        team_id: selectedSquad !== 'ALL' ? selectedSquad : undefined,
        goal_type: selectedType !== 'ALL' ? selectedType : undefined,
        time_period: selectedPeriod !== 'ALL' ? selectedPeriod : undefined
      });
      setGoals(res.goals || []);
      setKpis(res.kpis || {
        total_active_objectives: 0,
        on_track: 0,
        at_risk: 0,
        behind: 0,
        avg_progress: 0,
        due_this_quarter: 0
      });
    } catch (err) {
      console.error("Failed loading goals:", err);
      setGoals([]);
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
      setSquads(tms || []);
    } catch (err) {
      console.error("Failed fetching org context:", err);
    }
  };

  const handleAddKRToModal = () => {
    setModalKRs([...modalKRs, { title: '', direction: 'HIGHER_IS_BETTER', start_value: 0, target_value: 100, unit: '%', data_source: 'MANUAL' }]);
  };

  const handleUpdateKRInModal = (index, field, value) => {
    const updated = [...modalKRs];
    updated[index][field] = value;
    setModalKRs(updated);
  };

  const handleRemoveKRFromModal = (index) => {
    setModalKRs(modalKRs.filter((_, idx) => idx !== index));
  };

  const handleCreateGoalSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await api.createGoal({
        title: title.trim(),
        description: description.trim(),
        goal_type: goalType,
        time_period: timePeriod,
        department_id: deptId ? parseInt(deptId, 10) : undefined,
        workspace_id: wsId ? parseInt(wsId, 10) : undefined,
        target_metric: targetMetric.trim(),
        deadline_days: parseInt(deadlineDays, 10) || 60,
        key_results: modalKRs.filter(kr => kr.title.trim())
      });

      setTitle('');
      setDescription('');
      setIsModalOpen(false);
      fetchGoalsData();
    } catch (err) {
      alert("Failed creating goal: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigateGoal = (goalId) => {
    if (onSelectGoal) {
      onSelectGoal(goalId);
    } else {
      navigate(`/goals/${goalId}`);
    }
  };

  const selectStyle = {
    height: '38px',
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
    <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1500px', margin: '0 auto' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Target size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Goals & OKRs
              </h1>
              <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '850px' }}>
                Connect engineering objectives to measurable key results, projects, squads, sprints, and operational outcomes.
              </p>
            </div>
          </div>
        </div>

        {/* HEADER ACTIONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <Plus size={16} /> + New Engineering Goal
          </button>

          <button 
            className="btn-secondary"
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <Activity size={15} /> View Progress
          </button>

          <select 
            value={selectedPeriod} 
            onChange={e => setSelectedPeriod(e.target.value)} 
            className="form-select" 
            style={{ height: '38px', minHeight: '38px', padding: '0.4rem 2rem 0.4rem 0.75rem', lineHeight: '1.3', borderRadius: '8px', fontSize: '0.84rem', minWidth: '130px', boxSizing: 'border-box' }}
          >
            <option value="ALL">All Quarters</option>
            <option value="Q4 2026">Q4 2026</option>
            <option value="Q3 2026">Q3 2026</option>
            <option value="Q2 2026">Q2 2026</option>
          </select>
        </div>
      </div>

      {/* TOP KPI OVERVIEW SECTION (6 CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
        
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>ACTIVE OBJECTIVES</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{kpis.total_active_objectives}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Currently active</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>ON TRACK</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>{kpis.on_track}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Progressing as expected</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>AT RISK</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: kpis.at_risk > 0 ? '#f59e0b' : 'var(--text-primary)', marginTop: '0.2rem' }}>{kpis.at_risk}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Require attention</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>BEHIND</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: kpis.behind > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: '0.2rem' }}>{kpis.behind}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Below expected progress</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>AVERAGE PROGRESS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.2rem' }}>{kpis.avg_progress}%</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Across active objectives</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>DUE THIS QUARTER</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{kpis.due_this_quarter}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Upcoming deadlines</div>
        </div>

      </div>

      {/* FILTER TOOLBAR & VIEW MODE SWITCHER */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        
        {/* Top Control Line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          
          {/* View Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-card, #121824)', borderRadius: '8px', padding: '0.2rem', border: '1px solid var(--border-color)' }}>
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: isActive ? '#10b981' : 'none',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Icon size={14} /> {mode.label}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            Showing <strong>{goals.length}</strong> engineering objectives
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', gridColumn: 'span 2', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search goals, key results, owner..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem', height: '38px', borderRadius: '8px', fontSize: '0.84rem', boxSizing: 'border-box', width: '100%' }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Statuses</option>
              <option value="ON_TRACK">On Track</option>
              <option value="AT_RISK">At Risk</option>
              <option value="BEHIND">Behind</option>
              <option value="COMPLETED">Completed</option>
              <option value="NOT_STARTED">Not Started</option>
            </select>
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

          {/* Squad Filter */}
          <div>
            <select value={selectedSquad} onChange={e => setSelectedSquad(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Squads</option>
              {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Goal Type Filter */}
          <div>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="form-select" style={selectStyle}>
              <option value="ALL">All Types</option>
              <option value="Engineering">Engineering</option>
              <option value="Quality">Quality</option>
              <option value="Reliability">Reliability</option>
              <option value="Security">Security</option>
              <option value="Operational">Operational</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>

        </div>

        {/* Reset Filters */}
        {(searchTerm || selectedStatus !== 'ALL' || selectedDept !== 'ALL' || selectedWs !== 'ALL' || selectedSquad !== 'ALL' || selectedType !== 'ALL') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.2rem' }}>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('ALL');
                setSelectedDept('ALL');
                setSelectedWs('ALL');
                setSelectedSquad('ALL');
                setSelectedType('ALL');
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
          Computing OKR progress, key results, and linked work metrics...
        </div>
      ) : goals.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <Target size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No Engineering Objectives Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
            No engineering goals match your active filter criteria. Clear filters or create a new objective.
          </p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + New Engineering Goal
          </button>
        </div>
      ) : (
        <>
          {/* 1. CARDS VIEW */}
          {viewMode === 'cards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {goals.map((g) => {
                const statusColor = g.status === 'COMPLETED' ? '#10b981' : (g.status === 'ON_TRACK' ? '#10b981' : (g.status === 'AT_RISK' ? '#f59e0b' : '#ef4444'));

                return (
                  <div key={g.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: g.status === 'AT_RISK' ? '1px solid rgba(245, 158, 11, 0.4)' : (g.status === 'BEHIND' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)'), display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: `${statusColor}20`, color: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Target size={26} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{g.title}</h3>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderRadius: '20px', background: `${statusColor}20`, color: statusColor, fontWeight: 800 }}>
                              {g.status.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {g.goal_type} • {g.time_period}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0', maxWidth: '900px' }}>{g.description}</p>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{g.current_progress}%</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Target: {g.target_metric}</div>
                      </div>
                    </div>

                    {/* Progress Bar & Expected Progress Marker */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                        <span>Progress: <strong>{g.current_progress}%</strong></span>
                        <span>Expected Trajectory: <strong>{g.expected_progress}%</strong></span>
                      </div>
                      <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ height: '100%', width: `${g.current_progress}%`, background: statusColor, borderRadius: '4px' }} />
                      </div>
                    </div>

                    {/* Linked Work Summary Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', fontSize: '0.82rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Owner: <strong style={{ color: 'var(--text-primary)' }}>{g.owner_name}</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Key Results: <strong style={{ color: '#10b981' }}>{g.key_results_count} KRs</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Linked: <strong style={{ color: '#3b82f6' }}>{g.linked_counts.projects} Projects • {g.linked_counts.squads} Squads • {g.linked_counts.sprints} Sprints • {g.linked_counts.issues} Issues</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Due: <strong style={{ color: 'var(--text-primary)' }}>{g.target_date ? new Date(g.target_date).toLocaleDateString() : 'Dec 31, 2026'}</strong></span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleNavigateGoal(g.id)} 
                          className="btn-secondary"
                          style={{ padding: '0.45rem 0.95rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Eye size={15} /> View Objective &rarr;
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* 2. TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card, #121824)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Objective Title</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Type & Period</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Owner</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Key Results</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Progress</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.1rem' }}>Due Date</th>
                    <th style={{ padding: '0.85rem 1.1rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g) => {
                    const statusColor = g.status === 'COMPLETED' ? '#10b981' : (g.status === 'ON_TRACK' ? '#10b981' : (g.status === 'AT_RISK' ? '#f59e0b' : '#ef4444'));

                    return (
                      <tr key={g.id} onClick={() => handleNavigateGoal(g.id)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                        <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {g.title}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{g.department_name} • {g.workspace_name}</div>
                        </td>
                        <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{g.goal_type} ({g.time_period})</td>
                        <td style={{ padding: '0.9rem 1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{g.owner_name}</td>
                        <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: '#10b981' }}>{g.key_results_count} KRs</td>
                        <td style={{ padding: '0.9rem 1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{g.current_progress}%</td>
                        <td style={{ padding: '0.9rem 1.1rem' }}>
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: `${statusColor}20`, color: statusColor, fontWeight: 800 }}>
                            {g.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>
                          {g.target_date ? new Date(g.target_date).toLocaleDateString() : 'Dec 31, 2026'}
                        </td>
                        <td style={{ padding: '0.9rem 1.1rem', textAlign: 'right' }}>
                          <button onClick={(e) => { e.stopPropagation(); handleNavigateGoal(g.id); }} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 700 }}>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. TIMELINE VIEW */}
          {viewMode === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {goals.map((g) => (
                <div key={g.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{g.title}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800 }}>{g.current_progress}% Completed</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Start: <strong>{g.start_date ? new Date(g.start_date).toLocaleDateString() : 'Sep 01, 2026'}</strong></span>
                    <span>Target: <strong>{g.target_date ? new Date(g.target_date).toLocaleDateString() : 'Dec 31, 2026'}</strong></span>
                    <span>Status: <strong style={{ color: g.status === 'ON_TRACK' ? '#10b981' : '#f59e0b' }}>{g.status}</strong></span>
                  </div>

                  {/* Timeline Bar */}
                  <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${g.current_progress}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)', borderRadius: '5px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* NEW ENGINEERING GOAL MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Target size={22} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create New Engineering Objective</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              <div className="form-group">
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Objective Title *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Sub-2 Hour Incident SLA Resolution" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Description & Strategy</label>
                <textarea 
                  className="form-textarea" 
                  rows={2} 
                  placeholder="Describe the high-level outcome, business impact, and engineering strategy..." 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Goal Type</label>
                  <select className="form-select" value={goalType} onChange={e => setGoalType(e.target.value)}>
                    <option value="Engineering">Engineering</option>
                    <option value="Quality">Quality</option>
                    <option value="Reliability">Reliability</option>
                    <option value="Security">Security</option>
                    <option value="Operational">Operational</option>
                    <option value="Delivery">Delivery</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Time Period</label>
                  <select className="form-select" value={timePeriod} onChange={e => setTimePeriod(e.target.value)}>
                    <option value="Q4 2026">Q4 2026</option>
                    <option value="Q3 2026">Q3 2026</option>
                    <option value="Q2 2026">Q2 2026</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Deadline (Days)</label>
                  <input type="number" className="form-input" value={deadlineDays} onChange={e => setDeadlineDays(e.target.value)} min={7} max={365} />
                </div>
              </div>

              {/* Key Results Multi-Editor */}
              <div style={{ borderTop: '1px border var(--border-color)', paddingTop: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>Measurable Key Results ({modalKRs.length})</h4>
                  <button type="button" onClick={handleAddKRToModal} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                    + Add Key Result
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {modalKRs.map((kr, idx) => (
                    <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          placeholder="KR Title (e.g. 0 Critical Incidents)" 
                          className="form-input" 
                          style={{ flex: 1, fontSize: '0.82rem', height: '34px' }}
                          value={kr.title} 
                          onChange={e => handleUpdateKRInModal(idx, 'title', e.target.value)} 
                        />
                        <button type="button" onClick={() => handleRemoveKRFromModal(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <X size={16} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                        <select className="form-select" style={{ fontSize: '0.78rem', height: '36px', minHeight: '36px', padding: '0.35rem 1.8rem 0.35rem 0.5rem', lineHeight: '1.2', boxSizing: 'border-box' }} value={kr.direction} onChange={e => handleUpdateKRInModal(idx, 'direction', e.target.value)}>
                          <option value="HIGHER_IS_BETTER">Higher is Better</option>
                          <option value="LOWER_IS_BETTER">Lower is Better</option>
                          <option value="MAINTAIN">Maintain</option>
                        </select>

                        <input type="number" step="any" placeholder="Start" className="form-input" style={{ fontSize: '0.78rem', height: '36px', minHeight: '36px', padding: '0.35rem 0.5rem', lineHeight: '1.2', boxSizing: 'border-box' }} value={kr.start_value} onChange={e => handleUpdateKRInModal(idx, 'start_value', parseFloat(e.target.value))} />
                        <input type="number" step="any" placeholder="Target" className="form-input" style={{ fontSize: '0.78rem', height: '36px', minHeight: '36px', padding: '0.35rem 0.5rem', lineHeight: '1.2', boxSizing: 'border-box' }} value={kr.target_value} onChange={e => handleUpdateKRInModal(idx, 'target_value', parseFloat(e.target.value))} />
                        
                        <select className="form-select" style={{ fontSize: '0.78rem', height: '36px', minHeight: '36px', padding: '0.35rem 1.8rem 0.35rem 0.5rem', lineHeight: '1.2', boxSizing: 'border-box' }} value={kr.data_source} onChange={e => handleUpdateKRInModal(idx, 'data_source', e.target.value)}>
                          <option value="MANUAL">Manual</option>
                          <option value="BUGS_TASKS">Bugs Engine</option>
                          <option value="SLA_ENGINE">SLA Engine</option>
                          <option value="QA_TEST_MGMT">QA & Test Coverage</option>
                          <option value="RELEASES">Releases</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating Objective...' : 'Create Objective'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
