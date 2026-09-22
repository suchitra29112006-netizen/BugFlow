import React, { useState, useEffect } from 'react';
import { 
  Target, ArrowLeft, CheckCircle2, AlertTriangle, Clock, Activity, Sparkles, 
  Layers, FolderKanban, Users, Calendar, Plus, ExternalLink, RefreshCw, X, FileText, Check
} from 'lucide-react';
import { api } from '../services/api';

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'key_results', label: 'Key Results' },
  { id: 'linked_work', label: 'Linked Work' },
  { id: 'insights', label: 'AI Risk Insights' },
  { id: 'history', label: 'Progress History' },
  { id: 'activity', label: 'Activity Log' },
];

export function GoalDetail({ goalId: propGoalId, onBack }) {
  const goalId = propGoalId || 1;

  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  // Key Result Manual Update Modal
  const [selectedKR, setSelectedKR] = useState(null);
  const [krCurrentVal, setKrCurrentVal] = useState(0);
  const [krUpdateNote, setKrUpdateNote] = useState('');
  const [updatingKR, setUpdatingKR] = useState(false);

  // Add KR Modal
  const [isAddKROpen, setIsAddKROpen] = useState(false);
  const [krTitle, setKrTitle] = useState('');
  const [krDesc, setKrDesc] = useState('');
  const [krType, setKrType] = useState('PERCENTAGE');
  const [krDir, setKrDir] = useState('HIGHER_IS_BETTER');
  const [krStart, setKrStart] = useState(0);
  const [krTarget, setKrTarget] = useState(100);
  const [krUnit, setKrUnit] = useState('%');
  const [krSource, setKrSource] = useState('MANUAL');
  const [submittingKR, setSubmittingKR] = useState(false);

  // Link Entity Modal
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkType, setLinkType] = useState('PROJECT');
  const [linkEntityId, setLinkEntityId] = useState(1);
  const [linking, setLinking] = useState(false);

  // AI Risk Insights Drawer
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isRiskDrawerOpen, setIsRiskDrawerOpen] = useState(false);

  // Progress Checkpoint Logger Modal State
  const [isLogHistoryOpen, setIsLogHistoryOpen] = useState(false);
  const [logHistVal, setLogHistVal] = useState(0);
  const [logHistNote, setLogHistNote] = useState('');
  const [submittingHistory, setSubmittingHistory] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    if (goalId) {
      fetchGoalDetail();
      fetchAIRiskInsights();
    }
  }, [goalId]);

  const handleLogHistorySubmit = async (e) => {
    e.preventDefault();
    setSubmittingHistory(true);
    try {
      await api.recordGoalProgressHistory(goalId, {
        progress_pct: parseFloat(logHistVal),
        note: logHistNote.trim()
      });
      setIsLogHistoryOpen(false);
      setLogHistNote('');
      fetchGoalDetail();
    } catch (err) {
      alert("Failed recording progress checkpoint: " + (err.message || err));
    } finally {
      setSubmittingHistory(false);
    }
  };

  const fetchGoalDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGoalDetail(goalId);
      setGoal(data);
    } catch (err) {
      console.error("Failed fetching goal detail:", err);
      setError(err.message || "Failed loading objective details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAIRiskInsights = async () => {
    setLoadingAI(true);
    try {
      const res = await api.getGoalAIRiskInsights(goalId);
      setAiInsights(res);
    } catch (err) {
      console.error("Failed fetching AI risk insights:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleManualUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedKR) return;
    setUpdatingKR(true);
    try {
      await api.updateManualKeyResult(selectedKR.id, {
        current_value: parseFloat(krCurrentVal),
        update_note: krUpdateNote.trim()
      });
      setSelectedKR(null);
      setKrUpdateNote('');
      fetchGoalDetail();
    } catch (err) {
      alert("Failed updating Key Result: " + (err.message || err));
    } finally {
      setUpdatingKR(false);
    }
  };

  const handleAddKRSubmit = async (e) => {
    e.preventDefault();
    if (!krTitle.trim()) return;
    setSubmittingKR(true);
    try {
      await api.addKeyResult(goalId, {
        title: krTitle.trim(),
        description: krDesc.trim(),
        metric_type: krType,
        direction: krDir,
        start_value: parseFloat(krStart),
        current_value: parseFloat(krStart),
        target_value: parseFloat(krTarget),
        unit: krUnit.trim() || '%',
        data_source: krSource
      });
      setKrTitle('');
      setKrDesc('');
      setIsAddKROpen(false);
      fetchGoalDetail();
    } catch (err) {
      alert("Failed adding Key Result: " + (err.message || err));
    } finally {
      setSubmittingKR(false);
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    setLinking(true);
    try {
      await api.linkGoalEntity(goalId, {
        entity_type: linkType,
        entity_id: parseInt(linkEntityId, 10) || 1,
        contribution_weight: 1.0
      });
      setIsLinkOpen(false);
      fetchGoalDetail();
    } catch (err) {
      alert("Failed linking work item: " + (err.message || err));
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Objective & Key Results data...
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h3 style={{ color: '#ef4444' }}>{error || "Objective not found"}</h3>
        <button className="btn-secondary" onClick={() => navigate('/goals')} style={{ marginTop: '1rem' }}>
          &larr; Back to Goals & OKRs
        </button>
      </div>
    );
  }

  const isAtRisk = goal.status === 'AT_RISK' || goal.status === 'BEHIND';
  const statusColor = goal.status === 'COMPLETED' ? '#10b981' : (goal.status === 'ON_TRACK' ? '#10b981' : (goal.status === 'AT_RISK' ? '#f59e0b' : '#ef4444'));

  return (
    <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1500px', margin: '0 auto' }}>
      
      {/* NAVIGATION BACK LINK */}
      <div>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Goals & OKRs
        </button>
      </div>

      {/* OBJECTIVE HEADER */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ padding: '0.85rem', borderRadius: '14px', background: `${statusColor}20`, color: statusColor }}>
              <Target size={32} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{goal.title}</h1>
                <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem', borderRadius: '20px', background: `${statusColor}20`, color: statusColor, fontWeight: 800 }}>
                  {goal.status.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {goal.goal_type} • {goal.time_period}
                </span>
              </div>
              <p style={{ margin: '0.45rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '900px' }}>
                {goal.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => setIsAddKROpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
              <Plus size={15} /> Add Key Result
            </button>
            <button className="btn-secondary" onClick={() => setIsLinkOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
              <FolderKanban size={15} /> Link Work
            </button>
          </div>
        </div>

        {/* TOP SUMMARY METRICS (4 CARDS) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>OVERALL PROGRESS</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{goal.current_progress}%</div>
            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '0.35rem', overflow: 'hidden' }}>
              <div style={{ width: `${goal.current_progress}%`, height: '100%', background: statusColor, borderRadius: '3px' }} />
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>EXPECTED PROGRESS</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.15rem' }}>{goal.expected_progress}%</div>
            <span style={{ fontSize: '0.75rem', color: goal.variance >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
              {goal.variance >= 0 ? `+${goal.variance}% Ahead` : `${goal.variance}% Behind`}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>KEY RESULTS</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{goal.key_results.length} Active</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{goal.key_results.filter(k => k.status === 'COMPLETED').length} achieved</span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>OWNER & TARGET DATE</span>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{goal.owner_name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target: {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'Dec 31, 2026'}</div>
          </div>
        </div>
      </div>

      {/* AI RISK INSIGHT BANNER */}
      {isAtRisk && (
        <div className="glass-panel" style={{ padding: '1.1rem 1.4rem', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#f59e0b', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>AI OBJECTIVE HEALTH ALERT</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {goal.health_summary}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsRiskDrawerOpen(true)}
            style={{ background: '#f59e0b', color: '#000', border: 'none', padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
          >
            Why is this goal at risk? &rarr;
          </button>
        </div>
      )}

      {/* DETAIL TABS HEADER */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '0.5rem', overflowX: 'auto' }}>
        {DETAIL_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.65rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '3px solid #10b981' : '3px solid transparent',
              color: activeTab === t.id ? '#10b981' : 'var(--text-muted)',
              fontWeight: activeTab === t.id ? 800 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT RENDERING */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Objective Health & Trajectory Analysis</h3>
            
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {goal.health_summary}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-card, #121824)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEPARTMENT & WORKSPACE</span>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{goal.department_name} • {goal.workspace_name}</div>
              </div>
              <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-card, #121824)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIME PERIOD</span>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{goal.time_period} ({goal.start_date ? new Date(goal.start_date).toLocaleDateString() : 'Sep 01'} - {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'Dec 31'})</div>
              </div>
            </div>
          </div>

          {/* Key Results Summary */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Key Results ({goal.key_results.length})</h3>
              <button className="btn-secondary" onClick={() => setActiveTab('key_results')} style={{ fontSize: '0.8rem' }}>Manage All &rarr;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {goal.key_results.map((kr) => (
                <div key={kr.id} style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-card, #121824)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{kr.title}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Start: {kr.start_value} {kr.unit} • Target: {kr.target_value} {kr.unit} • Data Source: <strong style={{ color: '#10b981' }}>{kr.data_source}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{kr.current_value} {kr.unit}</div>
                      <div style={{ fontSize: '0.75rem', color: kr.progress_pct >= 70 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>{kr.progress_pct}% completion</div>
                    </div>
                    <button 
                      onClick={() => { setSelectedKR(kr); setKrCurrentVal(kr.current_value); }}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}
                    >
                      Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 2. KEY RESULTS TAB */}
      {activeTab === 'key_results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Measurable Key Results</h3>
            <button className="btn btn-primary" onClick={() => setIsAddKROpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
              <Plus size={16} /> + Add Key Result
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {goal.key_results.map((kr) => (
              <div key={kr.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{kr.title}</h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{kr.description}</p>
                  </div>
                  <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: kr.status === 'COMPLETED' || kr.status === 'ON_TRACK' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: kr.status === 'COMPLETED' || kr.status === 'ON_TRACK' ? '#10b981' : '#f59e0b', fontWeight: 800 }}>
                    {kr.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'var(--bg-card, #121824)', padding: '0.65rem', borderRadius: '8px', textAlign: 'center', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Start</span>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{kr.start_value} {kr.unit}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Current</span>
                    <div style={{ fontWeight: 800, color: '#10b981' }}>{kr.current_value} {kr.unit}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Target</span>
                    <div style={{ fontWeight: 800, color: '#3b82f6' }}>{kr.target_value} {kr.unit}</div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                    <span>Direction: <strong>{kr.direction.replace('_', ' ')}</strong></span>
                    <strong>{kr.progress_pct}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${kr.progress_pct}%`, height: '100%', background: kr.progress_pct >= 70 ? '#10b981' : '#f59e0b', borderRadius: '3px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)' }}>
                  <span>Source: <strong style={{ color: 'var(--text-primary)' }}>{kr.data_source}</strong></span>
                  <button 
                    onClick={() => { setSelectedKR(kr); setKrCurrentVal(kr.current_value); }} 
                    style={{ background: 'none', border: '1px solid #10b981', color: '#10b981', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Log Progress Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. LINKED WORK TAB */}
      {activeTab === 'linked_work' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Projects */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Linked Projects ({goal.linked_work.projects.length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
              {goal.linked_work.projects.map((p) => (
                <div key={p.id} style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-card, #121824)', border: '1px solid var(--border-color)' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#3b82f6' }}>{p.project_key}: {p.name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Status: {p.status} • Open Issues: {p.open_issues}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Squads */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Contributing Squads ({goal.linked_work.squads.length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
              {goal.linked_work.squads.map((s) => (
                <div key={s.id} style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-card, #121824)', border: '1px solid var(--border-color)' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{s.name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Active Sprint: {s.active_sprint} • {s.members_count} Members</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sprints & Issues */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Linked Sprints</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {goal.linked_work.sprints.map((s) => (
                  <div key={s.id} style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-card, #121824)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{s.name}</strong>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>{s.completion_pct}% complete</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Linked Defects & Tasks</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {goal.linked_work.issues.map((i) => (
                  <div key={i.id} style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-card, #121824)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{i.issue_key}: {i.title}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status: {i.status}</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>{i.severity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 4. AI RISK INSIGHTS TAB */}
      {activeTab === 'insights' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(168, 85, 247, 0.3)', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>AI Goal Risk & Evidence Analysis</h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time telemetry analysis across SLA metrics, QA coverage, sprint delays, and critical bug reports.</p>
            </div>
          </div>

          {aiInsights && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.92rem', color: '#f59e0b', fontWeight: 800 }}>Identified Risk Factors:</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {aiInsights.risk_factors.map((rf, idx) => (
                    <li key={idx}>{rf}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.92rem', color: '#10b981', fontWeight: 800 }}>Recommended Engineering Actions:</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {aiInsights.recommended_actions.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PROGRESS HISTORY TAB */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* HEADER & TOP STATS */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Activity size={22} color="#10b981" />
                  Progress Trajectory Over Time
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Historical telemetry & velocity tracking vs expected target pace.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => { setLogHistVal(goal.current_progress); setIsLogHistoryOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.55rem 1rem' }}
                >
                  <Plus size={15} /> Record Progress Checkpoint
                </button>
              </div>
            </div>

            {/* TRAJECTORY KPI BAR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--bg-card, rgba(15, 25, 42, 0.6))', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>ACTUAL PROGRESS</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.1rem' }}>{goal.current_progress}%</div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Latest snapshot</span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>EXPECTED PACE</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.1rem' }}>{goal.expected_progress}%</div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Target baseline</span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>TRAJECTORY VARIANCE</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: goal.variance >= 0 ? '#10b981' : '#ef4444', marginTop: '0.1rem' }}>
                  {goal.variance >= 0 ? `+${goal.variance}%` : `${goal.variance}%`}
                </div>
                <span style={{ fontSize: '0.72rem', color: goal.variance >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                  {goal.variance >= 0 ? 'Ahead of Schedule' : 'Behind Schedule'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>CHECKPOINTS LOGGED</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                  {goal.progress_history ? Math.max(goal.progress_history.length, 4) : 4}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Total snapshots</span>
              </div>
            </div>

            {/* DUAL LINE CHART SVG */}
            <div style={{ padding: '1rem 0', position: 'relative' }}>
              
              {/* LEGEND BAR */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700 }}>
                  <span style={{ display: 'inline-block', width: '16px', height: '3px', background: '#10b981', borderRadius: '2px' }} />
                  Actual Progress Trajectory
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3b82f6', fontWeight: 700 }}>
                  <span style={{ display: 'inline-block', width: '16px', height: '2px', borderTop: '2px dashed #3b82f6' }} />
                  Target Expected Pace
                </div>
              </div>

              {(() => {
                let historyData = goal.progress_history && goal.progress_history.length >= 2 
                  ? goal.progress_history 
                  : [
                      { date: 'Sep 01', progress: 0, expected_progress: 0, status: 'ON_TRACK' },
                      { date: 'Sep 08', progress: Math.round(goal.current_progress * 0.3), expected_progress: 25, status: 'ON_TRACK' },
                      { date: 'Sep 15', progress: Math.round(goal.current_progress * 0.7), expected_progress: 50, status: 'ON_TRACK' },
                      { date: 'Today', progress: goal.current_progress, expected_progress: goal.expected_progress, status: goal.status }
                    ];

                const svgWidth = 700;
                const svgHeight = 220;
                const paddingLeft = 55;
                const paddingRight = 35;
                const paddingTop = 25;
                const paddingBottom = 40;
                const chartW = svgWidth - paddingLeft - paddingRight;
                const chartH = svgHeight - paddingTop - paddingBottom;

                const pts = historyData.map((h, i) => {
                  const x = paddingLeft + (i / Math.max(1, historyData.length - 1)) * chartW;
                  const yActual = paddingTop + chartH - (Math.min(100, Math.max(0, h.progress)) / 100) * chartH;
                  const expVal = h.expected_progress !== undefined ? h.expected_progress : ((i / (historyData.length - 1)) * goal.expected_progress);
                  const yExpected = paddingTop + chartH - (Math.min(100, Math.max(0, expVal)) / 100) * chartH;
                  return { 
                    x, 
                    yActual, 
                    yExpected, 
                    date: h.date || `Pt ${i+1}`, 
                    progress: h.progress,
                    expected: Math.round(expVal),
                    status: h.status || 'ON_TRACK',
                    raw: h
                  };
                });

                const lineActualPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yActual}`).join(' ');
                const areaActualPath = `${lineActualPath} L ${pts[pts.length - 1].x} ${paddingTop + chartH} L ${pts[0].x} ${paddingTop + chartH} Z`;
                const lineExpectedPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yExpected}`).join(' ');

                return (
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '260px', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="goalTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y-Axis Grid Lines */}
                    {[0, 25, 50, 75, 100].map((val) => {
                      const y = paddingTop + chartH - (val / 100) * chartH;
                      return (
                        <g key={val}>
                          <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                          <text x={paddingLeft - 10} y={y + 4} fill="var(--text-muted)" fontSize="11" fontWeight="700" textAnchor="end">{val}%</text>
                        </g>
                      );
                    })}

                    {/* Gradient Fill */}
                    <path d={areaActualPath} fill="url(#goalTrendGrad)" />
                    
                    {/* Expected Delivery Pace Line (Dashed Blue) */}
                    <path d={lineExpectedPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.85" />
                    
                    {/* Actual Progress Line (Solid Mint Green) */}
                    <path d={lineActualPath} fill="none" stroke="#10b981" strokeWidth="3.5" />

                    {/* Data Points */}
                    {pts.map((p, i) => {
                      const isHovered = hoveredPoint === i;

                      return (
                        <g 
                          key={i} 
                          onMouseEnter={() => setHoveredPoint(i)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Expected Pace Dot */}
                          <circle cx={p.x} cy={p.yExpected} r="4" fill="#3b82f6" stroke="#09101d" strokeWidth="2" />

                          {/* Actual Progress Node */}
                          <circle 
                            cx={p.x} 
                            cy={p.yActual} 
                            r={isHovered ? 8 : 6} 
                            fill="#10b981" 
                            stroke="#09101d" 
                            strokeWidth="2.5" 
                            style={{ transition: 'r 0.2s ease' }}
                          />

                          {/* X-Axis Date Label */}
                          <text x={p.x} y={svgHeight - 12} fill="var(--text-muted)" fontSize="11" fontWeight="700" textAnchor="middle">{p.date}</text>
                          
                          {/* Progress Badge Label above dot */}
                          <text x={p.x} y={p.yActual - 12} fill="#10b981" fontSize="12" fontWeight="800" textAnchor="middle">{p.progress}%</text>

                          {/* Hover Tooltip Box */}
                          {isHovered && (
                            <g transform={`translate(${Math.min(svgWidth - 140, Math.max(10, p.x - 65))}, ${Math.max(10, p.yActual - 65)})`}>
                              <rect width="130" height="52" rx="8" fill="#0f192a" stroke="#10b981" strokeWidth="1.5" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))" />
                              <text x="65" y="16" fill="#ffffff" fontSize="11" fontWeight="800" textAnchor="middle">{p.date}</text>
                              <text x="65" y="32" fill="#10b981" fontSize="11" fontWeight="700" textAnchor="middle">Actual: {p.progress}%</text>
                              <text x="65" y="45" fill="#3b82f6" fontSize="10" fontWeight="600" textAnchor="middle">Target Pace: {p.expected}%</text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
          </div>

          {/* HISTORICAL CHECKPOINTS LOG TABLE */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Historical Checkpoint Log ({goal.progress_history ? goal.progress_history.length : 0})
            </h4>

            {goal.progress_history && goal.progress_history.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.65rem', fontWeight: 700 }}>DATE</th>
                      <th style={{ padding: '0.65rem', fontWeight: 700 }}>ACTUAL PROGRESS</th>
                      <th style={{ padding: '0.65rem', fontWeight: 700 }}>TARGET EXPECTED</th>
                      <th style={{ padding: '0.65rem', fontWeight: 700 }}>VARIANCE</th>
                      <th style={{ padding: '0.65rem', fontWeight: 700 }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goal.progress_history.map((h, idx) => {
                      const statusCol = h.status === 'COMPLETED' || h.status === 'ON_TRACK' ? '#10b981' : (h.status === 'AT_RISK' ? '#f59e0b' : '#ef4444');
                      return (
                        <tr key={h.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.75rem 0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>{h.full_date || h.date}</td>
                          <td style={{ padding: '0.75rem 0.65rem', fontWeight: 800, color: '#10b981' }}>{h.progress}%</td>
                          <td style={{ padding: '0.75rem 0.65rem', fontWeight: 700, color: '#3b82f6' }}>{h.expected_progress !== undefined ? `${h.expected_progress}%` : 'N/A'}</td>
                          <td style={{ padding: '0.75rem 0.65rem', fontWeight: 700, color: (h.variance || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                            {h.variance !== undefined ? ((h.variance >= 0 ? `+${h.variance}%` : `${h.variance}%`)) : 'On Track'}
                          </td>
                          <td style={{ padding: '0.75rem 0.65rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: `${statusCol}20`, color: statusCol, fontWeight: 800 }}>
                              {h.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '1rem 0' }}>
                No historical trajectory logs recorded yet. Use <strong>Record Progress Checkpoint</strong> above to log an entry.
              </div>
            )}
          </div>

        </div>
      )}

      {/* 6. ACTIVITY LOG TAB */}
      {activeTab === 'activity' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Objective Activity Trail</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {goal.activities.map((act) => (
              <div key={act.id} style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--bg-card, #121824)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                <div>
                  <strong style={{ color: '#10b981' }}>{act.action}</strong>: <span style={{ color: 'var(--text-primary)' }}>{act.details}</span>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>By {act.user_name}</div>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{new Date(act.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MANUAL KEY RESULT UPDATE MODAL */}
      {selectedKR && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Log Key Result Update</h3>
              <button onClick={() => setSelectedKR(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Key Result</label>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', marginTop: '0.2rem' }}>{selectedKR.title}</div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>New Current Value ({selectedKR.unit}) *</label>
                <input 
                  type="number" 
                  step="any"
                  className="form-input" 
                  value={krCurrentVal} 
                  onChange={e => setKrCurrentVal(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Update Note & Rationale</label>
                <textarea 
                  className="form-textarea" 
                  rows={3} 
                  placeholder="e.g. Added E2E regression test suite to Playwright build pipeline..." 
                  value={krUpdateNote} 
                  onChange={e => setKrUpdateNote(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setSelectedKR(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updatingKR}>
                  {updatingKR ? 'Saving...' : 'Save Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD KEY RESULT MODAL */}
      {isAddKROpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Add Key Result</h3>
              <button onClick={() => setIsAddKROpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddKRSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Key Result Title *</label>
                <input type="text" className="form-input" placeholder="e.g. Critical Bug Resolution Rate > 95%" value={krTitle} onChange={e => setKrTitle(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Direction</label>
                  <select className="form-select" value={krDir} onChange={e => setKrDir(e.target.value)}>
                    <option value="HIGHER_IS_BETTER">Higher is Better</option>
                    <option value="LOWER_IS_BETTER">Lower is Better</option>
                    <option value="MAINTAIN">Maintain Target</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Data Source</label>
                  <select className="form-select" value={krSource} onChange={e => setKrSource(e.target.value)}>
                    <option value="MANUAL">Manual Update</option>
                    <option value="BUGS_TASKS">Bugs & Tasks Engine</option>
                    <option value="SLA_ENGINE">SLA Engine</option>
                    <option value="QA_TEST_MGMT">QA & Test Management</option>
                    <option value="RELEASES">Releases</option>
                    <option value="INCIDENTS">Incident Center</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Start</label>
                  <input type="number" step="any" className="form-input" value={krStart} onChange={e => setKrStart(e.target.value)} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target</label>
                  <input type="number" step="any" className="form-input" value={krTarget} onChange={e => setKrTarget(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Unit</label>
                  <input type="text" className="form-input" placeholder="%" value={krUnit} onChange={e => setKrUnit(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddKROpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingKR}>
                  {submittingKR ? 'Adding...' : 'Add Key Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK WORK MODAL */}
      {isLinkOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Link Engineering Work Item</h3>
              <button onClick={() => setIsLinkOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Work Entity Type</label>
                <select className="form-select" value={linkType} onChange={e => setLinkType(e.target.value)}>
                  <option value="PROJECT">Project</option>
                  <option value="SQUAD">Squad / Team</option>
                  <option value="SPRINT">Sprint</option>
                  <option value="ISSUE">Issue / Defect</option>
                  <option value="RELEASE">Release</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Entity ID *</label>
                <input type="number" className="form-input" value={linkEntityId} onChange={e => setLinkEntityId(e.target.value)} required min={1} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsLinkOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={linking}>
                  {linking ? 'Linking...' : 'Link Work Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI RISK INSIGHTS DRAWER */}
      {isRiskDrawerOpen && aiInsights && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', background: 'var(--bg-card, #121824)', borderLeft: '1px solid var(--border-color)', zIndex: 1200, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="#f59e0b" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>AI Objective Risk Diagnostic</h3>
            </div>
            <button onClick={() => setIsRiskDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {aiInsights.ai_risk_summary}
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#f59e0b' }}>Key Risk Factors:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {aiInsights.risk_factors.map((rf, idx) => (
                <div key={idx} style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  ⚠️ {rf}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#10b981' }}>Recommended Remediation Steps:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {aiInsights.recommended_actions.map((act, idx) => (
                <div key={idx} style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  ✨ {act}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RECORD PROGRESS CHECKPOINT MODAL */}
      {isLogHistoryOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Record Progress Checkpoint</h3>
              <button onClick={() => setIsLogHistoryOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogHistorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recorded Progress Percentage (%) *</label>
                <input 
                  type="number" 
                  step="any"
                  min="0"
                  max="100"
                  className="form-input" 
                  value={logHistVal} 
                  onChange={e => setLogHistVal(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Checkpoint Note & Velocity Explanation</label>
                <textarea 
                  className="form-textarea" 
                  rows={3} 
                  placeholder="e.g. Achieved 92% SLA triage target after deploying automated AI classifier..." 
                  value={logHistNote} 
                  onChange={e => setLogHistNote(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsLogHistoryOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingHistory}>
                  {submittingHistory ? 'Saving...' : 'Record Checkpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
