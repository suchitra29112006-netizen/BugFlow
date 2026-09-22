import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Kanban, Sparkles, Plus, Layers, ShieldCheck, AlertTriangle, TrendingUp, CheckCircle2, Clock, Users, ArrowRight, Bot, Target, HelpCircle, Activity, Zap, Loader2, Trash2, Bug, Search, X } from 'lucide-react';
import { AISprintPlannerModal } from '../components/AISprintPlannerModal';
import { SprintCopilotDrawer } from '../components/SprintCopilotDrawer';
import { SprintComparisonModal } from '../components/SprintComparisonModal';
import { ExplainWhyModal } from '../components/ExplainWhyModal';

export const Sprints = ({ onSelectSprint }) => {
  const [sprints, setSprints] = useState([]);
  const [activeSprintId, setActiveSprintId] = useState(null);
  const [sprintDetails, setSprintDetails] = useState(null);
  const [sprintIssues, setSprintIssues] = useState([]);
  const [teamCapacity, setTeamCapacity] = useState([]);
  const [retrospective, setRetrospective] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sprint Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSprint, setDeletingSprint] = useState(false);

  // Bug Filtering State
  const [issueFilterSearch, setIssueFilterSearch] = useState('');
  const [issueFilterSeverity, setIssueFilterSeverity] = useState('ALL');

  // Phase 5: AI Sprint Rebalancer State
  const [rebalanceProposal, setRebalanceProposal] = useState(null);
  const [loadingRebalance, setLoadingRebalance] = useState(false);
  const [applyingRebalance, setApplyingRebalance] = useState(false);
  const [explainModal, setExplainModal] = useState({ isOpen: false, targetId: null, type: 'sprint_rebalance' });

  // Modals & Drawers
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Sprint Form State
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStartDate, setNewSprintStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newSprintEndDate, setNewSprintEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));

  // Objective Form State
  const [newObjTitle, setNewObjTitle] = useState('');

  // Calendar Intelligence States (§3.1 - §3.7)
  const [calendarRiskHeatmap, setCalendarRiskHeatmap] = useState(null);
  const [calendarConflicts, setCalendarConflicts] = useState(null);
  const [calendarQueryInput, setCalendarQueryInput] = useState('');
  const [calendarAiAnswer, setCalendarAiAnswer] = useState(null);
  const [selectedDayRisk, setSelectedDayRisk] = useState(null);


  const fetchSprints = async () => {
    setLoading(true);
    try {
      const [data, riskData, conflictData] = await Promise.all([
        api.getSprints(),
        api.getCalendarRiskSignals().catch(() => null),
        api.getWorkloadScheduleConflicts().catch(() => null)
      ]);

      // Deduplicate sprints list by ID and normalized name
      const uniqueSprints = (data || []).filter((s, idx, self) => 
        idx === self.findIndex((t) => t.id === s.id || (t.name && s.name && t.name.trim().toLowerCase() === s.name.trim().toLowerCase()))
      );

      setSprints(uniqueSprints);
      if (riskData) setCalendarRiskHeatmap(riskData.calendar_risk_heatmap);
      if (conflictData) setCalendarConflicts(conflictData);

      if (uniqueSprints.length > 0) {
        const firstId = activeSprintId && uniqueSprints.some(s => s.id === activeSprintId) 
          ? activeSprintId 
          : uniqueSprints[0].id;
        setActiveSprintId(firstId);
        await loadSprintData(firstId);
      }
    } catch (err) {
      console.error("Failed to load sprints:", err);
    } finally {
      setLoading(false);
    }
  };


  const loadSprintData = async (sprintId) => {
    try {
      const [details, issuesList, capacityData, rebProposal] = await Promise.all([
        api.getSprintDetails(sprintId),
        api.getIssues({ sprint_id: sprintId }),
        api.getSprintCapacity(sprintId),
        api.getSprintRebalanceProposal(sprintId).catch(() => null)
      ]);
      setSprintDetails(details);
      setSprintIssues(issuesList);
      setTeamCapacity(capacityData.developers_capacity || []);
      setRebalanceProposal(rebProposal);
    } catch (err) {
      console.error(`Failed to load sprint ${sprintId} details:`, err);
    }
  };

  useEffect(() => {
    fetchSprints();
  }, []);

  const handleSelectSprintTab = (sprintId) => {
    setActiveSprintId(sprintId);
    loadSprintData(sprintId);
  };

  const handleDeleteSprint = async () => {
    if (!activeSprintId) return;
    setDeletingSprint(true);
    try {
      await api.deleteSprint(activeSprintId);
      setIsDeleteModalOpen(false);
      const updatedSprints = sprints.filter(s => s.id !== activeSprintId);
      setSprints(updatedSprints);
      if (updatedSprints.length > 0) {
        setActiveSprintId(updatedSprints[0].id);
        await loadSprintData(updatedSprints[0].id);
      } else {
        setActiveSprintId(null);
        setSprintDetails(null);
        setSprintIssues([]);
      }
    } catch (err) {
      alert("Failed to delete sprint: " + (err.message || err));
    } finally {
      setDeletingSprint(false);
    }
  };

  const handleRemoveIssueFromSprint = async (issueId) => {
    try {
      await api.updateIssue(issueId, { sprint_id: null });
      setSprintIssues(prev => prev.filter(i => i.id !== issueId));
      loadSprintData(activeSprintId);
    } catch (err) {
      alert("Failed to remove issue from sprint: " + (err.message || err));
    }
  };

  const handleAskCalendarAI = async (e) => {
    e.preventDefault();
    if (!calendarQueryInput.trim()) return;
    try {
      const res = await api.askCalendarAI(calendarQueryInput);
      setCalendarAiAnswer(res);
    } catch (err) {
      console.error(err);
    }
  };


  const handleApplyRebalancePlan = async () => {
    if (!activeSprintId || !rebalanceProposal) return;
    setApplyingRebalance(true);
    try {
      const res = await api.applySprintRebalance(activeSprintId, [1, 2]);
      alert(res.message);
      loadSprintData(activeSprintId);
    } catch (err) {
      alert("Failed to apply rebalance plan: " + err.message);
    } finally {
      setApplyingRebalance(false);
    }
  };

  const handleCreateSprintSubmit = async (e) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    try {
      await api.createSprint({
        name: newSprintName,
        goal: newSprintGoal,
        start_date: new Date(newSprintStartDate).toISOString(),
        end_date: new Date(newSprintEndDate).toISOString()
      });
      setIsCreateModalOpen(false);
      setNewSprintName('');
      setNewSprintGoal('');
      fetchSprints();
    } catch (err) {
      alert("Failed to create sprint: " + err.message);
    }
  };

  const handleAddObjective = async (e) => {
    e.preventDefault();
    if (!newObjTitle.trim() || !activeSprintId) return;

    try {
      await api.createSprintObjective(activeSprintId, { title: newObjTitle });
      setNewObjTitle('');
      loadSprintData(activeSprintId);
    } catch (err) {
      alert("Failed to add objective: " + err.message);
    }
  };

  const handleGenerateRetro = async () => {
    if (!activeSprintId) return;
    try {
      const retro = await api.generateSprintRetrospective(activeSprintId);
      setRetrospective(retro);
    } catch (err) {
      alert("Failed to generate sprint retrospective: " + err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Initializing AI Sprint Intelligence Center...</div>;
  }

  const activeSprint = sprints.find(s => s.id === activeSprintId) || sprints[0] || {};
  const health = sprintDetails?.health || {};
  const risk = sprintDetails?.risk || {};
  const qa = sprintDetails?.qa_readiness || {};
  const rel = sprintDetails?.release_readiness || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-low" style={{ background: '#10b981', color: '#fff', fontWeight: 800 }}>
              AGILE AI CENTER V3.5
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>AI-Powered Sprint Intelligence Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Explainable sprint forecasting, health scoring, burndown analytics, risk predictions, and AI copilot assistant.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsCompareOpen(true)}>
            <Layers size={16} /> Compare Sprints
          </button>
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> + New Sprint
          </button>
        </div>
      </div>

      {/* §3.1 - §3.7: Engineering Risk Calendar & Workload Conflict Detector */}
      <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(249, 115, 22, 0.3)', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f97316', fontWeight: 900, fontSize: '1.15rem' }}>
              <Clock size={22} />
              📅 Engineering Risk Calendar (§3.1 - §3.7)
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Predictive SLA deadlines, daily engineering risk signals, and workload conflict warnings.
            </span>
          </div>

          {/* Ask Calendar AI Input */}
          <form onSubmit={handleAskCalendarAI} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ask Calendar AI (e.g. 'Which deadlines are dangerous this week?')"
              value={calendarQueryInput}
              onChange={(e) => setCalendarQueryInput(e.target.value)}
              style={{ width: '320px', fontSize: '0.82rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
              Ask AI
            </button>
          </form>
        </div>

        {/* Ask Calendar AI Answer Box */}
        {calendarAiAnswer && (
          <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <strong style={{ color: '#f97316' }}>🤖 Calendar AI Answer:</strong>
            <p style={{ marginTop: '0.2rem', color: 'var(--text-main)' }}>{calendarAiAnswer.answer}</p>
          </div>
        )}

        {/* Schedule Conflicts Banner */}
        {calendarConflicts && calendarConflicts.conflicts_count > 0 && (
          <div style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={20} color="#ef4444" />
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#ef4444' }}>⚡ AI Workload Schedule Conflict Detected</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {calendarConflicts.conflicts[0].conflict_summary}
                </p>
              </div>
            </div>
            <span className="badge badge-critical" style={{ fontSize: '0.72rem' }}>
              Recommended: {calendarConflicts.conflicts[0].recommended_action}
            </span>
          </div>
        )}

        {/* Calendar Heatmap Grid */}
        {calendarRiskHeatmap && (
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              DAILY ENGINEERING RISK SIGNALS (HEATMAP)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {Object.values(calendarRiskHeatmap).slice(0, 14).map((d) => {
                const colors = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };
                const c = colors[d.risk_level] || '#10b981';
                return (
                  <div
                    key={d.date}
                    onClick={() => setSelectedDayRisk(d)}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '8px',
                      background: `${c}15`,
                      border: `1px solid ${c}40`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>{d.date.slice(5)}</span>
                    <strong style={{ fontSize: '0.85rem', color: c, display: 'block', margin: '2px 0' }}>{d.risk_level}</strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Score: {d.risk_score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Day Risk Detail Modal / Explanation Box */}
        {selectedDayRisk && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: selectedDayRisk.risk_level === 'CRITICAL' ? '#ef4444' : (selectedDayRisk.risk_level === 'HIGH' || selectedDayRisk.risk_level === 'MEDIUM' ? '#f97316' : '#10b981') }}>
                {selectedDayRisk.risk_level === 'LOW' 
                  ? `Daily Engineering Telemetry for ${selectedDayRisk.date} (Level: LOW — Score ${selectedDayRisk.risk_score}/100)`
                  : `Why is ${selectedDayRisk.date} flagged at ${selectedDayRisk.risk_level} Risk? (Score ${selectedDayRisk.risk_score}/100)`
                }
              </strong>
              <button className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => setSelectedDayRisk(null)}>
                ✕ Close
              </button>
            </div>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              {selectedDayRisk.contributing_factors.map((fact, idx) => (
                <li key={idx}>{fact}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sprint Selection Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
        {sprints.map((s) => {
          const isSel = s.id === activeSprintId;
          return (
            <button
              key={s.id}
              onClick={() => handleSelectSprintTab(s.id)}
              className="glass-panel"
              style={{
                padding: '0.75rem 1.25rem',
                border: isSel ? '2px solid #10b981' : '1px solid var(--border-color)',
                background: isSel ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: isSel ? '#10b981' : 'var(--text-main)',
                fontWeight: isSel ? 800 : 500,
                cursor: 'pointer',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                borderRadius: '10px'
              }}
            >
              <Kanban size={16} />
              {s.name}
              <span className={`badge badge-${s.status.toLowerCase()}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{s.status}</span>
            </button>
          );
        })}
      </div>

      {activeSprint && (() => {
        const filteredSprintIssues = (sprintIssues || []).filter(iss => {
          const matchesSearch = !issueFilterSearch || 
            (iss.title && iss.title.toLowerCase().includes(issueFilterSearch.toLowerCase())) ||
            (iss.issue_key && iss.issue_key.toLowerCase().includes(issueFilterSearch.toLowerCase()));
          const matchesSeverity = issueFilterSeverity === 'ALL' || 
            (iss.severity && iss.severity.toUpperCase() === issueFilterSeverity.toUpperCase());
          return matchesSearch && matchesSeverity;
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Active Sprint Executive Header & Quick Actions */}
            <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Kanban size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{activeSprint.name}</h2>
                    <span className={`badge badge-${(activeSprint.status || 'PLANNED').toLowerCase()}`} style={{ fontSize: '0.78rem', padding: '0.2rem 0.65rem' }}>
                      {activeSprint.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {activeSprint.goal || 'No goal specified for this sprint.'}
                  </p>
                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    <span>📅 Dates: <strong style={{ color: 'var(--text-primary)' }}>{activeSprint.start_date ? new Date(activeSprint.start_date).toLocaleDateString() : 'N/A'} - {activeSprint.end_date ? new Date(activeSprint.end_date).toLocaleDateString() : 'N/A'}</strong></span>
                    <span>🐞 Bugs & Tasks: <strong style={{ color: '#10b981' }}>{sprintIssues.length} assigned</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  className="btn-danger" 
                  onClick={() => setIsDeleteModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  <Trash2 size={16} /> Delete Sprint
                </button>
              </div>
            </div>

            {/* Header Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
              
              <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>PROGRESS</span>
                <strong style={{ fontSize: '1.6rem', color: '#10b981', fontWeight: 900 }}>
                  {sprintDetails?.planned_story_points > 0 ? Math.round(((sprintDetails?.completed_story_points || 0) / sprintDetails.planned_story_points) * 100) : 0}%
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                  {sprintDetails?.completed_story_points ?? 0} / {sprintDetails?.planned_story_points ?? 0} pts
                </span>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>VELOCITY</span>
                <strong style={{ fontSize: '1.6rem', color: '#3b82f6', fontWeight: 900 }}>
                  {sprintDetails?.velocity ?? 0}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Points / Day</span>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>HEALTH SCORE</span>
                <strong style={{ fontSize: '1.6rem', color: (health?.health_score ?? 100) >= 70 ? '#10b981' : '#ef4444', fontWeight: 900 }}>
                  {health?.health_score ?? 100}/100 {health?.status_indicator ? health.status_indicator.split(' ')[0] : '🟢'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Weighted Matrix</span>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>SPRINT RISK</span>
                <strong style={{ fontSize: '1.6rem', color: risk?.risk_level === 'LOW' ? '#10b981' : risk?.risk_level === 'MEDIUM' ? '#f59e0b' : '#ef4444', fontWeight: 900 }}>
                  {risk?.delay_risk_pct ?? 0}% ({risk?.risk_level || 'LOW'})
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Delay Probability</span>
              </div>
            </div>

            {/* Bugs & Tasks Assigned to Active Sprint Table */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Bug size={20} color="#10b981" />
                    Bugs & Tasks in {activeSprint.name} ({filteredSprintIssues.length})
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Operational defects, feature tasks, and SLA commitments assigned to this sprint execution window.
                  </p>
                </div>

                {/* Issue Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search sprint bugs..."
                      value={issueFilterSearch}
                      onChange={(e) => setIssueFilterSearch(e.target.value)}
                      style={{ paddingLeft: '2rem', width: '220px', fontSize: '0.82rem' }}
                    />
                  </div>

                  <select
                    className="form-select"
                    value={issueFilterSeverity}
                    onChange={(e) => setIssueFilterSeverity(e.target.value)}
                    style={{ fontSize: '0.82rem', width: '130px' }}
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              {filteredSprintIssues.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem 0.65rem', fontWeight: 700 }}>KEY & TITLE</th>
                        <th style={{ padding: '0.75rem 0.65rem', fontWeight: 700 }}>SEVERITY</th>
                        <th style={{ padding: '0.75rem 0.65rem', fontWeight: 700 }}>STATUS</th>
                        <th style={{ padding: '0.75rem 0.65rem', fontWeight: 700 }}>ASSIGNEE</th>
                        <th style={{ padding: '0.75rem 0.65rem', fontWeight: 700 }}>ESTIMATE</th>
                        <th style={{ padding: '0.75rem 0.65rem', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSprintIssues.map((iss) => {
                        const sevColor = iss.severity === 'CRITICAL' ? '#ef4444' : (iss.severity === 'HIGH' ? '#f97316' : (iss.severity === 'MEDIUM' ? '#f59e0b' : '#10b981'));
                        const statusColor = iss.status === 'CLOSED' || iss.status === 'RESOLVED' ? '#10b981' : (iss.status === 'IN_PROGRESS' ? '#f97316' : '#3b82f6');
                        const issueKey = iss.issue_key || `BUG-${iss.id}`;
                        const points = iss.story_points || Math.max(1, Math.round((iss.est_resolution_hours || 6) / 2));

                        return (
                          <tr key={iss.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.85rem 0.65rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981' }}>{issueKey}</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{iss.title}</span>
                              </div>
                              {iss.description && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem', maxWidth: '500px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {iss.description}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 0.65rem' }}>
                              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: `${sevColor}20`, color: sevColor, fontWeight: 800 }}>
                                {iss.severity}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 0.65rem' }}>
                              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: `${statusColor}20`, color: statusColor, fontWeight: 800 }}>
                                {iss.status}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 0.65rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {iss.assignee_name || (iss.assigned_user ? iss.assigned_user.name : 'Unassigned')}
                            </td>
                            <td style={{ padding: '0.85rem 0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {points} pts ({iss.est_resolution_hours || 6}h)
                            </td>
                            <td style={{ padding: '0.85rem 0.65rem', textAlign: 'right' }}>
                              <button
                                onClick={() => handleRemoveIssueFromSprint(iss.id)}
                                style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-card, rgba(15, 25, 42, 0.4))', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                  <Bug size={36} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                  <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 800 }}>No Bugs or Tasks assigned to this Sprint</h4>
                  <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Assign existing backlog defects to {activeSprint.name} to track velocity and sprint completion.
                  </p>
                </div>
              )}
            </div>

            {/* Phase 5: AI Sprint Rebalancer Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
            
            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>PROGRESS</span>
              <strong style={{ fontSize: '1.6rem', color: '#10b981', fontWeight: 900 }}>
                {sprintDetails?.planned_story_points > 0 ? Math.round(((sprintDetails?.completed_story_points || 0) / sprintDetails.planned_story_points) * 100) : 0}%
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                {sprintDetails?.completed_story_points ?? 0} / {sprintDetails?.planned_story_points ?? 0} pts
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>VELOCITY</span>
              <strong style={{ fontSize: '1.6rem', color: '#3b82f6', fontWeight: 900 }}>
                {sprintDetails?.velocity ?? 0}
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Points / Day</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>HEALTH SCORE</span>
              <strong style={{ fontSize: '1.6rem', color: (health?.health_score ?? 100) >= 70 ? '#10b981' : '#ef4444', fontWeight: 900 }}>
                {health?.health_score ?? 100}/100 {health?.status_indicator ? health.status_indicator.split(' ')[0] : '🟢'}
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Weighted Matrix</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>SPRINT RISK</span>
              <strong style={{ fontSize: '1.6rem', color: risk?.risk_level === 'LOW' ? '#10b981' : risk?.risk_level === 'MEDIUM' ? '#f59e0b' : '#ef4444', fontWeight: 900 }}>
                {risk?.delay_risk_pct ?? 0}% ({risk?.risk_level || 'LOW'})
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Delay Probability</span>
            </div>
          </div>

          {/* Phase 5: AI Sprint Rebalancer Panel */}
          {rebalanceProposal && (
            <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(249, 115, 22, 0.4)', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.06) 0%, rgba(59, 130, 246, 0.06) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f97316', fontWeight: 900, fontSize: '1.15rem' }}>
                    <Zap size={22} />
                    ⚡ Phase 5: AI Sprint Rebalancer Proposal
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Automated workload balancing & risk mitigation proposal for {activeSprint.name}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    onClick={() => setExplainModal({ isOpen: true, targetId: activeSprintId, type: 'sprint_rebalance' })}
                  >
                    <HelpCircle size={14} color="#10b981" /> Explain Why
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                    onClick={handleApplyRebalancePlan}
                    disabled={applyingRebalance}
                  >
                    {applyingRebalance ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                    {applyingRebalance ? 'Applying...' : '[Apply Plan]'}
                  </button>
                </div>
              </div>

              {/* Completion Projection Banner */}
              <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>PROJECTED SPRINT COMPLETION PROBABILITY</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>{rebalanceProposal.summary}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>
                    {rebalanceProposal.current_completion_probability}% → {rebalanceProposal.projected_completion_probability}%
                  </span>
                </div>
              </div>

              {/* Suggested Actions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {rebalanceProposal.suggested_actions.map((act) => (
                  <div key={act.id} style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-high" style={{ fontSize: '0.68rem' }}>ACTION #{act.id}</span>
                      <span>{act.description}</span>
                    </div>
                    <span className="badge badge-low" style={{ background: '#10b981', color: '#fff', fontSize: '0.7rem' }}>CONFIRMED REQUIRED</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Sprint Objectives & Team Capacity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
            
            {/* Left: Sprint Objectives */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={18} color="#10b981" /> Sprint Objectives & Milestones
                </h3>
              </div>

              {sprintDetails?.objectives && sprintDetails.objectives.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  {sprintDetails.objectives.map((obj) => {
                    const isDone = obj.status === 'COMPLETED' || obj.is_completed || obj.progress_percentage === 100;
                    return (
                      <div key={obj.id} style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{obj.title}</span>
                        <span className={`badge badge-${isDone ? 'resolved' : 'open'}`}>
                          {isDone ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>No sprint objectives defined yet.</p>
              )}

              <form onSubmit={handleAddObjective} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="New Sprint Objective..."
                  value={newObjTitle}
                  onChange={(e) => setNewObjTitle(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn btn-secondary" style={{ fontSize: '0.8rem' }} disabled={!newObjTitle.trim()}>
                  + Add Objective
                </button>
              </form>
            </div>

            {/* Right: Team Capacity */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="#3b82f6" /> Developer Team Capacity
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {teamCapacity.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading capacity metrics...</p>
                ) : (
                  teamCapacity.map((dev) => {
                    const util = dev.utilization_pct ?? dev.capacity_utilization_pct ?? 0;
                    const assigned = dev.estimated_hours ?? dev.assigned_points ?? 0;
                    const capacity = dev.capacity_hours ?? dev.capacity_points ?? 40;
                    return (
                      <div key={dev.user_id || dev.name} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                          <strong style={{ fontWeight: 700 }}>{dev.name} ({dev.role || 'Developer'})</strong>
                          <span style={{ color: util > 90 ? '#ef4444' : '#10b981', fontWeight: 800 }}>
                            {assigned}h / {capacity}h ({util}%)
                          </span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, util)}%`, height: '100%', background: util > 90 ? '#ef4444' : '#10b981' }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Sprint Retrospective Widget */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a855f7', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bot size={18} /> AI Sprint Retrospective
              </h3>

              <button className="btn btn-secondary" style={{ fontSize: '0.8rem', color: '#a855f7' }} onClick={handleGenerateRetro}>
                <Sparkles size={14} /> Generate Retrospective
              </button>
            </div>

            {retrospective ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>What Went Well:</strong>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {retrospective.what_went_well?.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#ef4444' }}>Areas for Improvement:</strong>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {retrospective.what_could_be_improved?.map((i, idx) => <li key={idx}>{i}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click 'Generate Retrospective' to synthesize sprint retrospective insights.</p>
            )}
          </div>

        </div>
      );
    })()}

      {/* Global Explain Why Modal */}
      <ExplainWhyModal
        isOpen={explainModal.isOpen}
        onClose={() => setExplainModal({ ...explainModal, isOpen: false })}
        targetId={explainModal.targetId}
        recommendationType={explainModal.type}
      />

      {/* Modals & Drawers */}
      {isPlannerOpen && <AISprintPlannerModal isOpen={isPlannerOpen} onClose={() => setIsPlannerOpen(false)} sprintId={activeSprintId} onPlanApplied={() => loadSprintData(activeSprintId)} />}
      {isCopilotOpen && <SprintCopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} sprintId={activeSprintId} />}
      {isCompareOpen && <SprintComparisonModal isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} sprints={sprints} />}

      {/* Delete Sprint Confirmation Modal */}
      {isDeleteModalOpen && activeSprint && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '450px', width: '100%', background: 'var(--bg-card, #121824)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                <AlertTriangle size={22} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Delete Sprint</h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setIsDeleteModalOpen(false)}>✕</button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>'{activeSprint.name}'</strong>?
            </p>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              ⚠️ Any bugs or tasks currently assigned to this sprint will automatically be unassigned and returned to the product backlog. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={handleDeleteSprint}
                disabled={deletingSprint}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ef4444', color: '#fff', padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: 800 }}
              >
                {deletingSprint ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                {deletingSprint ? 'Deleting...' : 'Delete Sprint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Sprint Modal Overlay */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '550px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Kanban size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create New Sprint</h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateSprintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Sprint Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sprint 24 — Authentication Refactor"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Sprint Goal</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Resolve high-risk refresh token defect tickets and achieve 95% QA pass rate"
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newSprintStartDate}
                    onChange={(e) => setNewSprintStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newSprintEndDate}
                    onChange={(e) => setNewSprintEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Sprint</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

