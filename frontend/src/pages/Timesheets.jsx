import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, Play, Pause, Square, FileText, User, Filter, Plus, Search, 
  Trash2, Edit3, Sparkles, CheckCircle2, AlertCircle, BarChart3, 
  Calendar, FolderKanban, Layers, Zap, ShieldCheck, RefreshCw, X, Tag
} from 'lucide-react';

export const Timesheets = () => {
  const { user } = useAuth();

  // Core State
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'analytics'

  // Metadata dropdown options
  const [issues, setIssues] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [squads, setSquads] = useState([]);
  const [sprints, setSprints] = useState([]);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [devFilter, setDevFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [squadFilter, setSquadFilter] = useState('');
  const [sprintFilter, setSprintFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modals State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);

  // Form State (New Log & Edit)
  const [formIssueId, setFormIssueId] = useState('');
  const [formDevId, setFormDevId] = useState('');
  const [formHours, setFormHours] = useState('1');
  const [formMinutes, setFormMinutes] = useState('0');
  const [formWorkType, setFormWorkType] = useState('Development');
  const [formNote, setFormNote] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formProjectId, setFormProjectId] = useState('');
  const [formSquadId, setFormSquadId] = useState('');
  const [formSprintId, setFormSprintId] = useState('');
  const [formBillable, setFormBillable] = useState(true);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [formError, setFormError] = useState('');

  // Timer Tick Ref
  const timerIntervalRef = useRef(null);

  // Work Types list
  const WORK_TYPES = [
    'Development', 'Debugging', 'Testing', 'Code Review', 
    'Investigation', 'Documentation', 'Meeting', 'Deployment', 'Other'
  ];

  useEffect(() => {
    fetchMetadata();
    fetchTimeData();
  }, []);

  // Filter re-fetch effect
  useEffect(() => {
    fetchLogs();
  }, [devFilter, projectFilter, squadFilter, sprintFilter, workTypeFilter, startDateFilter, endDateFilter, searchTerm]);

  // Live Timer Ticking effect
  useEffect(() => {
    if (activeTimer && activeTimer.status === 'RUNNING') {
      timerIntervalRef.current = setInterval(() => {
        setActiveTimer(prev => {
          if (!prev) return null;
          return {
            ...prev,
            elapsed_seconds: prev.elapsed_seconds + 1,
            elapsed_formatted: formatDuration(prev.elapsed_seconds + 1)
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeTimer?.status]);

  const fetchMetadata = async () => {
    try {
      const [issData, devData, projData, sqData, spData] = await Promise.all([
        api.get('/api/v1/issues').catch(() => []),
        api.getPeople().catch(() => []),
        api.get('/api/v1/projects').catch(() => []),
        api.get('/api/v1/teams').catch(() => []),
        api.get('/api/v1/sprints').catch(() => [])
      ]);

      setIssues(Array.isArray(issData) ? issData : (issData?.issues || []));
      setDevelopers(Array.isArray(devData) ? devData : []);
      setProjects(Array.isArray(projData) ? projData : []);
      setSquads(Array.isArray(sqData) ? sqData : []);
      setSprints(Array.isArray(spData) ? spData : []);
    } catch (err) {
      console.error("Failed fetching timesheet metadata:", err);
    }
  };

  const fetchTimeData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchLogs(), fetchSummary(), fetchAnalytics()]);
    } catch (err) {
      console.error("Failed fetching time data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const params = {};
      if (devFilter) params.developer_id = devFilter;
      if (projectFilter) params.project_id = projectFilter;
      if (squadFilter) params.team_id = squadFilter;
      if (sprintFilter) params.sprint_id = sprintFilter;
      if (workTypeFilter) params.work_type = workTypeFilter;
      if (startDateFilter) params.start_date = startDateFilter;
      if (endDateFilter) params.end_date = endDateFilter;
      if (searchTerm) params.search = searchTerm;

      const data = await api.getTimeEntries(params);
      setEntries(data || []);
    } catch (err) {
      console.error("Failed fetching time entries:", err);
    }
  };

  const fetchSummary = async () => {
    try {
      const sum = await api.getTimeSummary();
      setSummary(sum);
      if (sum?.active_timer) {
        setActiveTimer(sum.active_timer);
      }
    } catch (err) {
      console.error("Failed fetching time summary:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const ana = await api.getTimeAnalytics();
      setAnalytics(ana);
    } catch (err) {
      console.error("Failed fetching time analytics:", err);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
  };

  const getWorkTypeColor = (type) => {
    switch (type) {
      case 'Development': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'Debugging': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'Testing': return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' };
      case 'Code Review': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Investigation': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'Documentation': return { bg: 'rgba(14, 165, 233, 0.15)', text: '#0ea5e9', border: 'rgba(14, 165, 233, 0.3)' };
      case 'Meeting': return { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.3)' };
      case 'Deployment': return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      default: return { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af', border: 'rgba(107, 114, 128, 0.3)' };
    }
  };

  // Timer Handlers
  const handleStartTimer = async (issId, wType = 'Debugging', wNotes = '') => {
    try {
      await api.startTimer({ issue_id: parseInt(issId), work_type: wType, work_notes: wNotes });
      fetchSummary();
    } catch (err) {
      alert("Failed starting timer: " + (err.message || err));
    }
  };

  const handlePauseTimer = async () => {
    try {
      await api.pauseTimer();
      fetchSummary();
    } catch (err) {
      alert("Failed pausing timer: " + (err.message || err));
    }
  };

  const handleResumeTimer = async () => {
    try {
      await api.resumeTimer();
      fetchSummary();
    } catch (err) {
      alert("Failed resuming timer: " + (err.message || err));
    }
  };

  const handleStopTimer = async () => {
    try {
      await api.stopTimer({ note: activeTimer?.work_notes || "Timer work session", work_type: activeTimer?.work_type || "Debugging" });
      setActiveTimer(null);
      fetchTimeData();
    } catch (err) {
      alert("Failed stopping timer: " + (err.message || err));
    }
  };

  // Form Pre-fill Helper on Issue Select
  const handleIssueSelect = (id) => {
    setFormIssueId(id);
    const selIssue = issues.find(i => i.id === parseInt(id));
    if (selIssue) {
      if (selIssue.project_id) setFormProjectId(selIssue.project_id.toString());
      if (selIssue.team_id) setFormSquadId(selIssue.team_id.toString());
      if (selIssue.sprint_id) setFormSprintId(selIssue.sprint_id.toString());
    }
  };

  // Open Log Modal
  const openNewLogModal = () => {
    setFormIssueId(issues.length > 0 ? issues[0].id.toString() : '');
    setFormDevId(user?.id ? user.id.toString() : (developers.length > 0 ? developers[0].id.toString() : ''));
    setFormHours('1');
    setFormMinutes('0');
    setFormWorkType('Development');
    setFormNote('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormProjectId('');
    setFormSquadId('');
    setFormSprintId('');
    setFormBillable(true);
    setFormError('');
    setIsLogModalOpen(true);
  };

  // Open Edit Modal
  const openEditLogModal = (entry) => {
    setEditingEntry(entry);
    setFormIssueId(entry.issue_id ? entry.issue_id.toString() : '');
    setFormDevId(entry.user_id ? entry.user_id.toString() : '');
    const h = Math.floor((entry.duration_seconds || 0) / 3600);
    const m = Math.floor(((entry.duration_seconds || 0) % 3600) / 60);
    setFormHours(h.toString());
    setFormMinutes(m.toString());
    setFormWorkType(entry.work_type || 'Development');
    setFormNote(entry.note || '');
    setFormDate(entry.logged_date ? entry.logged_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setFormProjectId(entry.project_id ? entry.project_id.toString() : '');
    setFormSquadId(entry.squad_id ? entry.squad_id.toString() : '');
    setFormSprintId(entry.sprint_id ? entry.sprint_id.toString() : '');
    setFormBillable(entry.billable !== false);
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Save Log (Create or Update)
  const handleSaveLogSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formIssueId) return setFormError('Please select an issue.');
    const h = parseFloat(formHours) || 0;
    const m = parseInt(formMinutes) || 0;
    const totalSec = Math.round(h * 3600 + m * 60);
    if (totalSec <= 0) return setFormError('Logged duration must be greater than 0 minutes.');
    if (!formWorkType) return setFormError('Please select a work type.');
    if (!formNote.trim()) return setFormError('Please describe the work performed.');

    setSubmittingForm(true);
    try {
      const payload = {
        issue_id: parseInt(formIssueId),
        user_id: formDevId ? parseInt(formDevId) : undefined,
        duration_seconds: totalSec,
        work_type: formWorkType,
        note: formNote.trim(),
        logged_date: formDate ? new Date(formDate).toISOString() : undefined,
        project_id: formProjectId ? parseInt(formProjectId) : undefined,
        squad_id: formSquadId ? parseInt(formSquadId) : undefined,
        sprint_id: formSprintId ? parseInt(formSprintId) : undefined,
        billable: formBillable
      };

      if (editingEntry) {
        await api.updateTimeEntry(editingEntry.id, payload);
        setIsEditModalOpen(false);
      } else {
        await api.createTimeEntry(payload);
        setIsLogModalOpen(false);
      }
      fetchTimeData();
    } catch (err) {
      setFormError(err.message || "Failed saving work log.");
    } finally {
      setSubmittingForm(false);
    }
  };

  // Delete Log
  const handleDeleteLogConfirm = async () => {
    if (!deletingEntry) return;
    try {
      await api.deleteTimeEntry(deletingEntry.id);
      setDeletingEntry(null);
      fetchTimeData();
    } catch (err) {
      alert("Failed deleting work log: " + (err.message || err));
    }
  };

  // AI Work Summary Generation
  const handleGenerateAISummary = async () => {
    if (!formNote.trim()) return alert("Please enter raw notes first to generate AI summary.");
    setAiGenerating(true);
    try {
      const selIss = issues.find(i => i.id === parseInt(formIssueId));
      const res = await api.generateAIWorkSummary(formNote, selIss?.title);
      if (res?.summary) {
        setFormNote(res.summary);
      }
    } catch (err) {
      console.error("AI summary error:", err);
    } finally {
      setAiGenerating(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDevFilter('');
    setProjectFilter('');
    setSquadFilter('');
    setSprintFilter('');
    setWorkTypeFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  if (loading) {
    return (
      <div style={{ padding: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '42px', height: '42px', border: '3px solid var(--border-color)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading Engineering Timesheets & Work Logs...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1600px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* PAGE HEADER & TOP ACTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Engineering Timesheets & Work Logs</h1>
            <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              JIRA / LINEAR PARITY
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.35rem 0 0 0' }}>
            Track actual engineering work duration, debugging sessions, code reviews, and defect work logs across squads and projects.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => fetchTimeData()} 
            title="Refresh Data"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.85rem' }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={openNewLogModal}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)', border: 'none', borderRadius: '9px', fontWeight: 700 }}
          >
            <Plus size={18} /> Log Work Time
          </button>
        </div>
      </div>

      {/* ACTIVE TIMER BANNER */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.6rem', borderRadius: '16px', background: activeTimer ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)' : 'var(--bg-card, #121824)', border: activeTimer ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: activeTimer ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : 'rgba(255, 255, 255, 0.05)', color: activeTimer ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: activeTimer ? '0 6px 16px rgba(168, 85, 247, 0.3)' : 'none' }}>
            <Clock size={26} className={activeTimer?.status === 'RUNNING' ? 'spin-slow' : ''} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: activeTimer ? '#a855f7' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {activeTimer ? `ACTIVE TIMER (${activeTimer.status})` : 'ENGINEERING TIME TRACKER'}
              </span>
              {activeTimer && (
                <span style={{ ...getWorkTypeColor(activeTimer.work_type), padding: '0.15rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid' }}>
                  {activeTimer.work_type}
                </span>
              )}
            </div>

            {activeTimer ? (
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                #{activeTimer.issue_id} {activeTimer.issue_title}
              </div>
            ) : (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                No active timer running. Start a live timer from any issue page or log time manually.
              </div>
            )}
          </div>
        </div>

        {activeTimer ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '1.8rem', fontWeight: 900, color: '#a855f7', letterSpacing: '1px', background: 'rgba(0, 0, 0, 0.25)', padding: '0.3rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
              {activeTimer.elapsed_formatted || formatDuration(activeTimer.elapsed_seconds)}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {activeTimer.status === 'RUNNING' ? (
                <button className="btn btn-secondary" onClick={handlePauseTimer} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 700 }}>
                  <Pause size={16} /> Pause
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={handleResumeTimer} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>
                  <Play size={16} /> Resume
                </button>
              )}

              <button className="btn btn-secondary" onClick={handleStopTimer} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 700 }}>
                <Square size={16} /> Stop & Save
              </button>
            </div>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={openNewLogModal} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
            <Clock size={16} /> Start New Work Session
          </button>
        )}
      </div>

      {/* TOP KPI SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL LOGGED TIME</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#3b82f6', marginTop: '0.35rem' }}>
              {summary?.total_logged_formatted || '0m'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Across {summary?.total_entries_count || entries.length} engineering work logs</div>
          </div>
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <FileText size={26} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LOGGED TODAY</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981', marginTop: '0.35rem' }}>
              {summary?.today_logged_formatted || '0m'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Current daily engineering output</div>
          </div>
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Calendar size={26} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>THIS WEEK</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#a855f7', marginTop: '0.35rem' }}>
              {summary?.this_week_logged_formatted || '0m'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Active sprint time accumulation</div>
          </div>
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <Zap size={26} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACTIVE TIMER</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: activeTimer ? '#f59e0b' : 'var(--text-muted)', marginTop: '0.35rem' }}>
              {activeTimer ? (activeTimer.elapsed_formatted || formatDuration(activeTimer.elapsed_seconds)) : 'Inactive'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {activeTimer ? `${activeTimer.work_type} session` : 'No live timer running'}
            </div>
          </div>
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: activeTimer ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: activeTimer ? '#f59e0b' : 'var(--text-muted)' }}>
            <Clock size={26} />
          </div>
        </div>
      </div>

      {/* VIEW NAVIGATION TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('logs')}
            style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none', background: activeTab === 'logs' ? '#3b82f6' : 'transparent', color: activeTab === 'logs' ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <FileText size={16} /> Work Log Feed ({entries.length})
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none', background: activeTab === 'analytics' ? '#3b82f6' : 'transparent', color: activeTab === 'analytics' ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <BarChart3 size={16} /> Time Analytics
          </button>
        </div>
      </div>

      {activeTab === 'logs' && (
        <>
          {/* SEARCH & FILTERS BAR */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              
              {/* Search Box */}
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search notes, issues, work types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: '8px', background: 'var(--bg-secondary, #0b1120)' }}
                />
              </div>

              {/* Developer Filter */}
              <select className="form-select" value={devFilter} onChange={(e) => setDevFilter(e.target.value)} style={{ width: '170px', borderRadius: '8px' }}>
                <option value="">All Developers</option>
                {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              {/* Project Filter */}
              <select className="form-select" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} style={{ width: '170px', borderRadius: '8px' }}>
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              {/* Squad Filter */}
              <select className="form-select" value={squadFilter} onChange={(e) => setSquadFilter(e.target.value)} style={{ width: '150px', borderRadius: '8px' }}>
                <option value="">All Squads</option>
                {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              {/* Work Type Filter */}
              <select className="form-select" value={workTypeFilter} onChange={(e) => setWorkTypeFilter(e.target.value)} style={{ width: '150px', borderRadius: '8px' }}>
                <option value="">All Work Types</option>
                {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              {(searchTerm || devFilter || projectFilter || squadFilter || sprintFilter || workTypeFilter || startDateFilter || endDateFilter) && (
                <button className="btn btn-secondary" onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <X size={15} /> Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* WORK LOGS TABLE */}
          <div className="glass-panel" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            {entries.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                <Clock size={42} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>No work logs found</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px' }}>
                  {(searchTerm || devFilter || projectFilter || workTypeFilter) ? 'No engineering work logs match your current filter parameters.' : 'Start a live timer on any issue page or log time manually to populate work activity.'}
                </p>
                <button className="btn btn-primary" onClick={openNewLogModal} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Plus size={16} /> Log First Work Entry
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '0.95rem 1.25rem' }}>Issue / Defect</th>
                      <th style={{ padding: '0.95rem 1rem' }}>Developer</th>
                      <th style={{ padding: '0.95rem 1rem' }}>Duration</th>
                      <th style={{ padding: '0.95rem 1rem' }}>Work Type</th>
                      <th style={{ padding: '0.95rem 1rem' }}>Project & Squad</th>
                      <th style={{ padding: '0.95rem 1.25rem' }}>Work Notes</th>
                      <th style={{ padding: '0.95rem 1rem' }}>Date Logged</th>
                      <th style={{ padding: '0.95rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(e => {
                      const typeBadge = getWorkTypeColor(e.work_type);
                      return (
                        <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }} className="hover-row">
                          
                          {/* Issue Column */}
                          <td style={{ padding: '0.95rem 1.25rem', fontWeight: 700, maxWidth: '280px' }}>
                            <div style={{ color: '#3b82f6', fontSize: '0.78rem', fontWeight: 800 }}>#{e.issue_id}</div>
                            <div style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={e.issue_title}>
                              {e.issue_title}
                            </div>
                          </td>

                          {/* Developer Column */}
                          <td style={{ padding: '0.95rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                                {e.user_name ? e.user_name.slice(0, 2).toUpperCase() : 'DEV'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{e.user_name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.user_role}</div>
                              </div>
                            </div>
                          </td>

                          {/* Duration Column */}
                          <td style={{ padding: '0.95rem 1rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                              {e.duration_formatted}
                            </span>
                          </td>

                          {/* Work Type Column */}
                          <td style={{ padding: '0.95rem 1rem' }}>
                            <span style={{ ...typeBadge, padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid', display: 'inline-block' }}>
                              {e.work_type}
                            </span>
                          </td>

                          {/* Project & Squad Column */}
                          <td style={{ padding: '0.95rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{e.project_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.squad_name}</div>
                          </td>

                          {/* Notes Column */}
                          <td style={{ padding: '0.95rem 1.25rem', color: 'var(--text-muted)', maxWidth: '320px' }}>
                            <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }} title={e.note}>
                              {e.note}
                            </div>
                          </td>

                          {/* Date Column */}
                          <td style={{ padding: '0.95rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(e.logged_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>

                          {/* Actions Column */}
                          <td style={{ padding: '0.95rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => openEditLogModal(e)} 
                                title="Edit Work Log"
                                style={{ padding: '0.35rem 0.55rem' }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => setDeletingEntry(e)} 
                                title="Delete Work Log"
                                style={{ padding: '0.35rem 0.55rem', color: '#ef4444' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TIME ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            
            {/* 1. Time by Work Type */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="#3b82f6" /> Time Allocation by Work Type
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {(analytics?.by_work_type || []).map(item => {
                  const badge = getWorkTypeColor(item.work_type);
                  return (
                    <div key={item.work_type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: badge.text }}>{item.work_type}</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{item.formatted} ({item.percentage}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.percentage}%`, height: '100%', background: badge.text, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Time by Developer */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} color="#10b981" /> Developer Worklog Distribution
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {(analytics?.by_developer || []).map(dev => {
                  const maxSec = Math.max(1, ...(analytics?.by_developer || []).map(d => d.seconds));
                  const pct = Math.round((dev.seconds / maxSec) * 100);
                  return (
                    <div key={dev.developer_name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{dev.developer_name}</span>
                        <span style={{ fontWeight: 800, color: '#10b981' }}>{dev.formatted}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Estimated vs Actual Logged Time */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="#a855f7" /> Defect Estimate vs Actual Logged Time
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(analytics?.by_issue || []).map(iss => {
                const estSec = iss.estimated_hours * 3600;
                const ratio = Math.min(100, Math.round((iss.logged_seconds / (estSec || 1)) * 100));
                const overBudget = iss.logged_seconds > estSec;

                return (
                  <div key={iss.issue_id} style={{ padding: '0.85rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        #{iss.issue_id} {iss.issue_title}
                      </div>
                      <div style={{ fontSize: '0.8rem', display: 'flex', gap: '0.85rem' }}>
                        <span>Logged: <strong style={{ color: overBudget ? '#ef4444' : '#3b82f6' }}>{iss.logged_formatted}</strong></span>
                        <span>Estimate: <strong>{iss.estimated_formatted}</strong></span>
                      </div>
                    </div>

                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${ratio}%`, height: '100%', background: overBudget ? '#ef4444' : '#3b82f6', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: MANUAL WORK LOGGING FORM / EDIT FORM */}
      {(isLogModalOpen || isEditModalOpen) && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-card" style={{ maxWidth: '560px', width: '100%', padding: '1.75rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  {editingEntry ? 'Edit Work Log' : 'Log Work Time'}
                </h3>
              </div>
              <button onClick={() => { setIsLogModalOpen(false); setIsEditModalOpen(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleSaveLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              {/* Issue Selection */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Select Defect / Issue *</label>
                <select 
                  className="form-select" 
                  value={formIssueId} 
                  onChange={(e) => handleIssueSelect(e.target.value)} 
                  required 
                  style={{ width: '100%', borderRadius: '8px', marginTop: '0.35rem' }}
                >
                  <option value="">-- Choose Issue --</option>
                  {issues.map(i => (
                    <option key={i.id} value={i.id}>#{i.id} - {i.title}</option>
                  ))}
                </select>
              </div>

              {/* Developer & Work Type row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Developer *</label>
                  <select 
                    className="form-select" 
                    value={formDevId} 
                    onChange={(e) => setFormDevId(e.target.value)} 
                    required 
                    style={{ width: '100%', borderRadius: '8px', marginTop: '0.35rem' }}
                  >
                    {developers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Work Type *</label>
                  <select 
                    className="form-select" 
                    value={formWorkType} 
                    onChange={(e) => setFormWorkType(e.target.value)} 
                    required 
                    style={{ width: '100%', borderRadius: '8px', marginTop: '0.35rem' }}
                  >
                    {WORK_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration & Date row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Duration (Hours & Mins) *</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <input 
                      type="number" 
                      step="0.5" 
                      min="0" 
                      className="form-input" 
                      placeholder="Hours" 
                      value={formHours} 
                      onChange={(e) => setFormHours(e.target.value)} 
                      style={{ width: '50%', borderRadius: '8px' }}
                    />
                    <input 
                      type="number" 
                      step="5" 
                      min="0" 
                      max="59" 
                      className="form-input" 
                      placeholder="Mins" 
                      value={formMinutes} 
                      onChange={(e) => setFormMinutes(e.target.value)} 
                      style={{ width: '50%', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Logged Date *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formDate} 
                    onChange={(e) => setFormDate(e.target.value)} 
                    required 
                    style={{ width: '100%', borderRadius: '8px', marginTop: '0.35rem' }}
                  />
                </div>
              </div>

              {/* Work Notes & AI Summary */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>Work Notes *</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateAISummary}
                    disabled={aiGenerating || !formNote.trim()}
                    style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Sparkles size={14} /> {aiGenerating ? 'Summarizing...' : '✨ AI Polish Notes'}
                  </button>
                </div>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  placeholder="Describe technical actions taken, root cause debugged, or test verification performed..." 
                  value={formNote} 
                  onChange={(e) => setFormNote(e.target.value)} 
                  required 
                  style={{ width: '100%', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>

              {/* Optional Project & Squad Link */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project (Optional)</label>
                  <select className="form-select" value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)} style={{ width: '100%', borderRadius: '8px', marginTop: '0.25rem' }}>
                    <option value="">Auto-derive from Issue</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Squad (Optional)</label>
                  <select className="form-select" value={formSquadId} onChange={(e) => setFormSquadId(e.target.value)} style={{ width: '100%', borderRadius: '8px', marginTop: '0.25rem' }}>
                    <option value="">Auto-derive from Issue</option>
                    {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Form Action Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsLogModalOpen(false); setIsEditModalOpen(false); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingForm} style={{ background: '#3b82f6', border: 'none' }}>
                  {submittingForm ? 'Saving Log...' : (editingEntry ? 'Update Work Log' : 'Save Work Log')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION */}
      {deletingEntry && (
        <div className="modal-overlay" style={{ zIndex: 1250 }}>
          <div className="modal-card" style={{ maxWidth: '440px', width: '100%', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Delete Work Log?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>
              Are you sure you want to delete this <strong>{deletingEntry.duration_formatted}</strong> work log logged on <strong>#{deletingEntry.issue_id} {deletingEntry.issue_title}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingEntry(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDeleteLogConfirm} style={{ background: '#ef4444', border: 'none' }}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
