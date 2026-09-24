import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { ArrowLeft, MessageSquare, Send, User, Trash2, CheckCircle2, Paperclip, FileText, Sparkles, Code2, Loader2, Copy, Check, Terminal, History, AlertCircle, ExternalLink, Clock, Flame, CheckSquare, Square, RefreshCw, Play, Pause, ThumbsUp, UserCheck, Trophy, GitPullRequest, Search, ShieldAlert, Layers, Network, Wand2, FlaskConical, GitFork, Dna, GitCommit, Plus, BarChart3, Calendar, Tag, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { AIAssignmentCard } from '../components/AIAssignmentCard';
import { CandidateComparisonModal } from '../components/CandidateComparisonModal';
import { DeveloperProfileModal } from '../components/DeveloperProfileModal';
import { AssignmentFeedbackModal } from '../components/AssignmentFeedbackModal';
import { AIAssignmentAssistantModal } from '../components/AIAssignmentAssistantModal';
import { ResolutionKnowledgeGraphModal } from '../components/ResolutionKnowledgeGraph';
import { InvestigationWorkspaceModal } from '../components/InvestigationWorkspaceModal';
import { BugFamilyTreeModal } from '../components/BugFamilyTreeModal';
import { DefectLifecycleReplayModal } from '../components/DefectLifecycleReplayModal';
import { DefectOriginAnalysisModal } from '../components/DefectOriginAnalysisModal';


const ALLOWED_TRANSITIONS = {
  Reported: ['Open', 'Assigned', 'Closed'],
  Open: ['Assigned', 'In Progress', 'Closed'],
  Assigned: ['In Progress', 'Open', 'In Review'],
  'In Progress': ['In Review', 'Open', 'Assigned'],
  'In Review': ['Resolved', 'In Progress'],
  Resolved: ['Closed', 'In Progress', 'Open'],
  Closed: ['Open'],
};

export const IssueDetail = ({ issueId, onBack }) => {
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [users, setUsers] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Milestone 3 States
  const [resolutionAssistance, setResolutionAssistance] = useState(null);
  const [loadingResolution, setLoadingResolution] = useState(false);
  const [intelligenceScore, setIntelligenceScore] = useState(null);
  const [similarDefects, setSimilarDefects] = useState([]);
  const [prInputUrl, setPrInputUrl] = useState('');
  const [prReviewData, setPrReviewData] = useState(null);
  const [loadingPRReview, setLoadingPRReview] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [testScenarios, setTestScenarios] = useState(null);
  const [loadingScenarios, setLoadingScenarios] = useState(false);

  // Time Tracking State
  const [issueTimeEntries, setIssueTimeEntries] = useState([]);
  const [issueActiveTimer, setIssueActiveTimer] = useState(null);
  const [isLogTimeModalOpen, setIsLogTimeModalOpen] = useState(false);
  const [isStopTimerModalOpen, setIsStopTimerModalOpen] = useState(false);

  // Time Log Form State
  const [logHours, setLogHours] = useState('1');
  const [logMinutes, setLogMinutes] = useState('0');
  const [logWorkType, setLogWorkType] = useState('Debugging');
  const [logWorkNotes, setLogWorkNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [logBillable, setLogBillable] = useState(true);
  const [submittingTimeLog, setSubmittingTimeLog] = useState(false);
  const [aiGeneratingSummary, setAiGeneratingSummary] = useState(false);

  // Stop Timer Form State
  const [stopWorkType, setStopWorkType] = useState('Debugging');
  const [stopWorkNotes, setStopWorkNotes] = useState('');
  const [submittingStopTimer, setSubmittingStopTimer] = useState(false);

  // Timer Tick Ref
  const timerIntervalRef = useRef(null);

  // Reopen Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // AI Assignment & Comparison Modals
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareCandidates, setCompareCandidates] = useState([]);
  const [compareIntelligence, setCompareIntelligence] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedDevId, setSelectedDevId] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);

  // AI Code Fix Suggestion state
  const [codeFix, setCodeFix] = useState(null);
  const [generatingFix, setGeneratingFix] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [postingAiComment, setPostingAiComment] = useState(false);

  // Verification Checklist State
  const [checklist, setChecklist] = useState([
    { text: 'Verify defect reproduction on staging build', done: false },
    { text: 'Verify unit test pass rate and regression safety', done: false },
    { text: 'Verify UI responsiveness and console log clean output', done: false }
  ]);

  // Milestone 4 States
  const [isInvestigationOpen, setIsInvestigationOpen] = useState(false);
  const [isFamilyTreeOpen, setIsFamilyTreeOpen] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [predictiveSLA, setPredictiveSLA] = useState(null);
  const [recurrenceRisk, setRecurrenceRisk] = useState(null);
  const [qualityScore, setQualityScore] = useState(null);
  const [piiWarning, setPiiWarning] = useState(null);

  const WORK_TYPES = [
    'Development', 'Debugging', 'Testing', 'Code Review', 
    'Investigation', 'Documentation', 'Meeting', 'Deployment', 'Other'
  ];

  const fetchDetails = async () => {
    try {
      const [issData, commData, attData, usersData, intelData, simData, riskData, qScoreData, slaData] = await Promise.all([
        api.getIssue(issueId),
        api.getComments(issueId),
        api.getAttachments(issueId),
        api.getUsers(),
        api.getDefectIntelligenceScore(issueId).catch(() => null),
        api.getSimilarDefects(issueId).catch(() => []),
        api.getRecurrenceRisk(issueId).catch(() => null),
        api.getDefectQualityScore(issueId).catch(() => null),
        api.getPredictiveSLARisk(issueId).catch(() => null),
      ]);
      setIssue(issData);
      setComments(commData);
      setAttachments(attData);
      setUsers(usersData);
      setIntelligenceScore(intelData);
      setSimilarDefects(simData);
      setRecurrenceRisk(riskData);
      setQualityScore(qScoreData);
      setPredictiveSLA(slaData);

      if (issData.pr_url) {
        setPrInputUrl(issData.pr_url);
      }

      if (issData.verification_checklist) {
        try {
          setChecklist(JSON.parse(issData.verification_checklist));
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load issue details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueTimeData = async () => {
    try {
      const [entries, timerRes] = await Promise.all([
        api.getTimeEntries({ issue_id: issueId }).catch(() => []),
        api.getActiveTimer().catch(() => null)
      ]);
      setIssueTimeEntries(entries || []);
      setIssueActiveTimer(timerRes);
    } catch (err) {
      console.error("Failed loading time tracking data:", err);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchIssueTimeData();
  }, [issueId]);

  useEffect(() => {
    if (issueActiveTimer && issueActiveTimer.status === 'RUNNING') {
      timerIntervalRef.current = setInterval(() => {
        setIssueActiveTimer(prev => {
          if (!prev) return null;
          return {
            ...prev,
            elapsed_seconds: prev.elapsed_seconds + 1
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [issueActiveTimer?.status]);

  const formatSecondsToHM = (seconds) => {
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

  const handleStartTimer = async () => {
    try {
      await api.startTimer({ issue_id: parseInt(issueId), work_type: 'Debugging', work_notes: 'Working on defect fix' });
      await fetchIssueTimeData();
    } catch (err) {
      setError(err.message || 'Failed to start timer');
    }
  };

  const handlePauseTimer = async () => {
    try {
      await api.pauseTimer();
      await fetchIssueTimeData();
    } catch (err) {
      setError(err.message || 'Failed to pause timer');
    }
  };

  const handleResumeTimer = async () => {
    try {
      await api.resumeTimer();
      await fetchIssueTimeData();
    } catch (err) {
      setError(err.message || 'Failed to resume timer');
    }
  };

  const handleOpenStopModal = () => {
    if (issueActiveTimer) {
      setStopWorkType(issueActiveTimer.work_type || 'Debugging');
      setStopWorkNotes(issueActiveTimer.work_notes || '');
    }
    setIsStopTimerModalOpen(true);
  };

  const handleConfirmStopTimer = async (e) => {
    e.preventDefault();
    setSubmittingStopTimer(true);
    try {
      await api.stopTimer({ work_type: stopWorkType, work_notes: stopWorkNotes });
      setIsStopTimerModalOpen(false);
      await fetchIssueTimeData();
    } catch (err) {
      setError(err.message || 'Failed to stop timer');
    } finally {
      setSubmittingStopTimer(false);
    }
  };

  const handleSubmitTimeLog = async (e) => {
    e.preventDefault();
    setSubmittingTimeLog(true);
    try {
      await api.createTimeEntry({
        issue_id: parseInt(issueId),
        developer_id: user?.id,
        hours: parseFloat(logHours) || 0,
        minutes: parseFloat(logMinutes) || 0,
        work_type: logWorkType,
        work_notes: logWorkNotes,
        logged_date: logDate,
        billable: logBillable,
        project_id: issue?.project_id,
        sprint_id: issue?.sprint_id
      });
      setIsLogTimeModalOpen(false);
      setLogWorkNotes('');
      await fetchIssueTimeData();
    } catch (err) {
      setError(err.message || 'Failed to log time');
    } finally {
      setSubmittingTimeLog(false);
    }
  };

  const handleAIPolishNote = async () => {
    if (!logWorkNotes.trim()) return;
    setAiGeneratingSummary(true);
    try {
      const res = await api.generateAIWorkSummary(logWorkNotes, issue?.title);
      if (res?.summary) {
        setLogWorkNotes(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiGeneratingSummary(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this time entry?")) return;
    try {
      await api.deleteTimeEntry(entryId);
      await fetchIssueTimeData();
    } catch (err) {
      setError(err.message || 'Failed deleting entry');
    }
  };

  const toggleChecklistItem = async (index) => {
    const updated = checklist.map((item, i) => i === index ? { ...item, done: !item.done } : item);
    setChecklist(updated);
    try {
      await api.updateIssue(issueId, { verification_checklist: JSON.stringify(updated) });
    } catch (err) {
      console.error("Failed to update checklist:", err);
    }
  };

  const handleGenerateResolutionAssistance = async () => {
    setLoadingResolution(true);
    try {
      const data = await api.getAIResolutionAssistance(issueId);
      setResolutionAssistance(data);
    } catch (err) {
      setError("Failed to generate resolution assistance: " + err.message);
    } finally {
      setLoadingResolution(false);
    }
  };

  const handleGenerateScenarios = async () => {
    setLoadingScenarios(true);
    try {
      const res = await api.generateAITestScenarios(issueId);
      setTestScenarios(res);
    } catch (err) {
      setError("Test scenario generation failed: " + err.message);
    } finally {
      setLoadingScenarios(false);
    }
  };

  const handleLinkPRAndReview = async (e) => {
    e.preventDefault();
    if (!prInputUrl.trim()) return;
    setLoadingPRReview(true);
    try {
      await api.linkGitHubPR(issueId, prInputUrl);
      const revData = await api.runAIPRReview(issueId, prInputUrl);
      setPrReviewData(revData);
      fetchDetails();
    } catch (err) {
      setError("GitHub PR linking failed: " + err.message);
    } finally {
      setLoadingPRReview(false);
    }
  };

  const handleStatusChange = async (targetStatus) => {
    if (issue.status === 'Resolved' && targetStatus === 'Open') {
      setIsReopenModalOpen(true);
      return;
    }

    setTransitioning(true);
    setError('');
    try {
      const updated = await api.updateIssue(issueId, { status: targetStatus });
      setIssue(updated);
    } catch (err) {
      setError(err.message || 'Status transition failed.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleConfirmReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;

    setTransitioning(true);
    setError('');
    try {
      const updated = await api.updateIssue(issueId, {
        status: 'Open',
        reopen_reason: reopenReason
      });
      setIssue(updated);
      setIsReopenModalOpen(false);
      setReopenReason('');
      fetchDetails();
    } catch (err) {
      setError(err.message || 'Reopen transition failed.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleAssigneeChange = async (userId) => {
    setError('');
    try {
      await api.assignDeveloperWithAudit(issueId, userId ? parseInt(userId) : 0, "Manual Dropdown Selection");
      fetchDetails();
    } catch (err) {
      setError(err.message || 'Assignee update failed.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const piiCheck = await api.checkSensitiveData(newComment).catch(() => null);
      if (piiCheck?.has_findings) {
        const warningMsg = `⚠️ SECURITY GUARD WARNING:\nPotential sensitive data / secrets detected:\n- ${piiCheck.findings.map(f => f.pattern).join('\n- ')}\n\nDo you want to proceed with posting?`;
        if (!window.confirm(warningMsg)) {
          return;
        }
      }

      await api.addComment(issueId, newComment, false);
      setNewComment('');
      const updatedComments = await api.getComments(issueId);
      setComments(updatedComments);
    } catch (err) {
      setError(err.message || 'Failed to post comment.');
    }
  };

  const handleDeleteIssue = async () => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      await api.deleteIssue(issueId);
      onBack();
    } catch (err) {
      setError(err.message || 'Failed to delete issue.');
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading issue details...</div>;
  if (!issue) return <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>Issue not found.</div>;

  const nextStatuses = ALLOWED_TRANSITIONS[issue.status] || [];
  const formatTimerStr = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Issues
        </button>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" style={{ color: '#06b6d4' }} onClick={() => setIsReplayOpen(true)}>
            <History size={16} /> Lifecycle Time-Machine Replay
          </button>

          <button className="btn btn-secondary" style={{ color: '#f59e0b' }} onClick={() => setIsOriginOpen(true)}>
            <GitCommit size={16} /> Defect Origin Analysis
          </button>

          <button className="btn btn-secondary" style={{ color: '#06b6d4' }} onClick={() => setIsFamilyTreeOpen(true)}>
            <GitFork size={16} /> Bug Family Tree
          </button>

          <button className="btn btn-secondary" style={{ color: '#a855f7' }} onClick={() => setIsInvestigationOpen(true)}>
            <FlaskConical size={16} /> AI Investigation Workspace
          </button>

          <button className="btn btn-secondary" style={{ color: '#a855f7' }} onClick={() => setIsGraphOpen(true)}>
            <Network size={16} /> Knowledge Graph
          </button>

          <button className="btn btn-primary" onClick={() => setIsAssistantModalOpen(true)}>
            <Sparkles size={16} /> AI Assignment Assistant
          </button>


          {['Resolved', 'Closed'].includes(issue.status) && (
            <button className="btn btn-peach" onClick={() => setIsFeedbackModalOpen(true)}>
              <ThumbsUp size={15} /> Evaluate Assignment AI
            </button>
          )}

          <button className="btn btn-danger" onClick={handleDeleteIssue}>
            <Trash2 size={16} />
            Delete Issue
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Main Content Grid (Defect 360 View) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.2fr', gap: '1.5rem' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span className={`badge badge-${issue.severity.toLowerCase()}`}>{issue.severity} Severity</span>
              <span className={`badge badge-${issue.status.toLowerCase().replace(' ', '-')}`}>{issue.status}</span>
              
              {intelligenceScore && (
                <span className="badge badge-low" style={{ background: intelligenceScore.intelligence_score > 60 ? '#ef4444' : '#10b981', color: '#fff', fontWeight: 800 }} title={intelligenceScore.why_explanation}>
                  🛡️ Risk Score: {intelligenceScore.intelligence_score}/100 ({intelligenceScore.risk_level})
                </span>
              )}

              {issue.is_regression && (
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#ef4444', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <RefreshCw size={12} /> REGRESSION ⚠️ (Reopened {issue.reopen_count}x)
                </span>
              )}

              {issue.pr_url && (
                <a href={issue.pr_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px', color: '#3b82f6' }}>
                  <GitPullRequest size={12} /> Linked PR
                </a>
              )}
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem' }}>{issue.title}</h1>

            {issue.labels && issue.labels.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
                {issue.labels.map(l => (
                  <span key={l.id} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: `${l.color}20`, color: l.color, border: `1px solid ${l.color}40`, fontWeight: 600 }}>
                    {l.name}
                  </span>
                ))}
              </div>
            )}

            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {issue.description}
            </div>
          </div>

          {/* Phase 6: AI Resolution Assistant Widget */}
          <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(59, 130, 246, 0.06) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 900, fontSize: '1.15rem' }}>
                  <Sparkles size={20} />
                  🤖 BUGFLOW AI RESOLUTION ASSISTANT
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Historical knowledge retrieval, root cause hypotheses & debugging steps</span>
              </div>

              <button className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }} onClick={handleGenerateResolutionAssistance} disabled={loadingResolution}>
                {loadingResolution ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                {loadingResolution ? 'Analyzing...' : 'Generate Resolution Guidance'}
              </button>
            </div>

            {resolutionAssistance && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <strong style={{ fontSize: '0.88rem', color: '#10b981' }}>Summary:</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>{resolutionAssistance.summary}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#f97316' }}>Investigation Areas:</strong>
                    <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {resolutionAssistance.investigation_areas.map((area, idx) => <li key={idx}>{area}</li>)}
                    </ul>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#3b82f6' }}>Possible Root Cause:</strong>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{resolutionAssistance.root_cause_hypothesis}</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>Suggested Resolution:</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.35rem' }}>{resolutionAssistance.suggested_resolution}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <span>Confidence: <strong style={{ color: '#10b981' }}>{resolutionAssistance.confidence_score}%</strong></span>
                  <span>{resolutionAssistance.disclaimer}</span>
                </div>
              </div>
            )}
          </div>

          {/* P2-14: AI Regression Test Generator Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(168, 85, 247, 0.04)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: 800, fontSize: '1.05rem' }}>
                <Wand2 size={18} />
                AI QA Regression Test Scenario Generator
              </div>
              <button className="btn btn-secondary" style={{ fontSize: '0.78rem', color: '#a855f7' }} onClick={handleGenerateScenarios} disabled={loadingScenarios}>
                {loadingScenarios ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                Generate QA Test Scenarios
              </button>
            </div>

            {testScenarios && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {testScenarios.scenarios.map(sc => (
                  <div key={sc.id} style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#a855f7' }}>Test #{sc.id}: {sc.name}</strong> [{sc.type}]
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sc.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phase 7: Semantic Similar Defects & Historical Knowledge Panel */}
          {similarDefects.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6' }}>
                <Layers size={18} />
                ⚠️ Semantic Similar Defects & Historical Knowledge ({similarDefects.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {similarDefects.map((sim) => (
                  <div key={sim.issue_id} style={{ padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>#{sim.issue_id} — {sim.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Status: {sim.status} • Severity: {sim.severity}</span>
                    </div>
                    <span className="badge badge-low" style={{ background: '#3b82f6', color: '#fff', fontWeight: 800 }}>
                      {sim.similarity_score}% Similarity
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase 11: GitHub PR Linking & AI Code Review Widget */}
          <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 900, fontSize: '1.1rem', marginBottom: '1rem' }}>
              <GitPullRequest size={20} />
              GitHub PR Linking & AI Code Review
            </div>

            <form onSubmit={handleLinkPRAndReview} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="https://github.com/org/repo/pull/84"
                value={prInputUrl}
                onChange={(e) => setPrInputUrl(e.target.value)}
                style={{ flex: 1, fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem' }} disabled={loadingPRReview || !prInputUrl.trim()}>
                {loadingPRReview ? <Loader2 className="animate-spin" size={14} /> : <GitPullRequest size={14} />}
                {loadingPRReview ? 'Reviewing PR...' : 'Link PR & Run AI Review'}
              </button>
            </form>

            {prReviewData && (
              <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#3b82f6' }}>🤖 AI PR Code Review Results</strong>
                  <span className={`badge badge-${prReviewData.regression_risk.toLowerCase()}`}>Regression Risk: {prReviewData.regression_risk}</span>
                </div>

                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#ef4444' }}>Potential Issues:</strong>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {prReviewData.potential_issues.map((iss, idx) => <li key={idx}>{iss}</li>)}
                  </ul>
                </div>

                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#10b981' }}>Suggested Improvement:</strong>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>{prReviewData.suggested_improvement}</p>
                </div>
              </div>
            )}
          </div>

          {/* Professional Engineering Time Tracking & Work Logs Widget */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 900, fontSize: '1.1rem' }}>
                <Clock size={20} />
                TIME TRACKING & WORK LOGS
              </div>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() => setIsLogTimeModalOpen(true)}
              >
                <Plus size={14} /> Log Time
              </button>
            </div>

            {/* Time Metrics & Progress Bar */}
            {(() => {
              const totalLoggedSecs = issueTimeEntries.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) +
                (issueActiveTimer && issueActiveTimer.issue_id === parseInt(issueId) ? (issueActiveTimer.elapsed_seconds || 0) : 0);
              const totalLoggedHours = totalLoggedSecs / 3600;
              const estimatedHours = issue?.est_resolution_hours || 4.0;
              const progressPct = Math.min(100, Math.round((totalLoggedHours / estimatedHours) * 100));
              const remainingHours = Math.max(0, estimatedHours - totalLoggedHours);
              const isOverEstimate = totalLoggedHours > estimatedHours;

              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>LOGGED TIME</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>{formatSecondsToHM(totalLoggedSecs)}</span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>ESTIMATED</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>{estimatedHours}h</span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>REMAINING</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: isOverEstimate ? '#ef4444' : '#10b981' }}>
                        {isOverEstimate ? `+${(totalLoggedHours - estimatedHours).toFixed(1)}h over` : `${remainingHours.toFixed(1)}h`}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                      <span>Budget Spent ({progressPct}%)</span>
                      <span>{formatSecondsToHM(totalLoggedSecs)} / {estimatedHours}h</span>
                    </div>
                    <div style={{ height: '8px', width: '100%', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${Math.min(progressPct, 100)}%`, 
                        background: isOverEstimate ? '#ef4444' : progressPct > 85 ? '#f59e0b' : '#3b82f6', 
                        borderRadius: '4px',
                        transition: 'width 0.4s ease' 
                      }} />
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Active Live Timer Banner */}
            <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              {issueActiveTimer && issueActiveTimer.issue_id === parseInt(issueId) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: issueActiveTimer.status === 'RUNNING' ? '#10b981' : '#f59e0b', display: 'inline-block' }} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                        Active Timer ({issueActiveTimer.status})
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#3b82f6', fontFamily: 'monospace' }}>
                        {formatSecondsToHM(issueActiveTimer.elapsed_seconds)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {issueActiveTimer.status === 'RUNNING' ? (
                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={handlePauseTimer}>
                        <Pause size={14} /> Pause
                      </button>
                    ) : (
                      <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={handleResumeTimer}>
                        <Play size={14} /> Resume
                      </button>
                    )}
                    <button className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={handleOpenStopModal}>
                      <Square size={14} /> Stop & Log
                    </button>
                  </div>
                </div>
              ) : issueActiveTimer ? (
                <div style={{ fontSize: '0.82rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} /> Active timer running on Issue #{issueActiveTimer.issue_id}.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No live timer running for this issue.</span>
                  <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={handleStartTimer}>
                    <Play size={14} /> ▶ Start Live Timer
                  </button>
                </div>
              )}
            </div>

            {/* Work Logs Feed */}
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Logged Work History ({issueTimeEntries.length})
              </h4>

              {issueTimeEntries.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No work logs recorded yet for this defect.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {issueTimeEntries.map(entry => {
                    const wtStyle = getWorkTypeColor(entry.work_type);
                    return (
                      <div key={entry.id} style={{ padding: '0.75rem 0.9rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: wtStyle.bg, color: wtStyle.text, border: `1px solid ${wtStyle.border}`, fontWeight: 700 }}>
                              {entry.work_type}
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {entry.developer_name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              • {entry.logged_date}
                            </span>
                          </div>
                          {entry.work_notes && (
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>
                              {entry.work_notes}
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                            {entry.formatted_duration || formatSecondsToHM(entry.duration_seconds)}
                          </span>
                          <button 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                            onClick={() => handleDeleteEntry(entry.id)}
                            title="Delete work log"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* QA Interactive Verification Checklist */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={18} /> QA Verification Checklist
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    background: item.done ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleChecklistItem(idx)}
                >
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {item.done ? <CheckSquare size={18} color="#10b981" /> : <Square size={18} color="var(--text-dim)" />}
                  </button>
                  <span style={{ fontSize: '0.88rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: item.done ? 500 : 600 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity History Audit Log Component */}
          <ActivityTimeline issueId={issueId} />

          {/* Comments Section */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="#f97316" />
              Activity & Collaboration Thread ({comments.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {comments.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No comments yet. Start the discussion below.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={{ padding: '1rem', background: c.is_ai_generated ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.02)', borderRadius: '10px', border: c.is_ai_generated ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{c.user?.name || 'User'}</span>
                        {c.is_ai_generated && (
                          <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: '#10b981', color: '#fff', fontWeight: 800 }}>
                            🤖 AI ASSISTANT
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Write a comment... (e.g. @Sarah for notification)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!newComment.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>

        {/* Right Sidebar: AI Assignment Card, Workflow Status Controls & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Explainable AI Assignment Card Component */}
          <AIAssignmentCard
            issueId={issueId}
            currentAssigneeId={issue.assigned_to}
            onAssigned={fetchDetails}
            onOpenCompare={(candidates, intelligence) => {
              setCompareCandidates(candidates);
              setCompareIntelligence(intelligence);
              setIsCompareOpen(true);
            }}
            onOpenFeedback={() => setIsFeedbackModalOpen(true)}
          />

          {/* Workflow Transitions Box */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Workflow Status Actions
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {nextStatuses.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No state transitions available from '{issue.status}'.</p>
              ) : (
                nextStatuses.map((st) => (
                  <button
                    key={st}
                    className={`btn ${st === 'Open' && issue.status === 'Resolved' ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ justifyContent: 'space-between', width: '100%', fontSize: '0.85rem' }}
                    onClick={() => handleStatusChange(st)}
                    disabled={transitioning}
                  >
                    <span>Transition to <strong>{st}</strong></span>
                    <CheckCircle2 size={14} color="#10b981" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ASSIGNED TO</span>
                {issue.assigned_to && (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}
                    onClick={() => {
                      setSelectedDevId(issue.assigned_to);
                      setIsProfileModalOpen(true);
                    }}
                  >
                    Manage Profile
                  </button>
                )}
              </div>
              <select
                className="form-select"
                style={{ fontSize: '0.85rem' }}
                value={issue.assigned_to || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>DUE DATE</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: issue.is_overdue ? '#ef4444' : 'var(--text-main)' }}>
                {issue.due_date ? new Date(issue.due_date).toLocaleDateString() : 'No due date'}
                {issue.is_overdue && ' (OVERDUE)'}
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>REPORTER</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{issue.reporter?.name}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Resolution Knowledge Graph Modal */}
      <ResolutionKnowledgeGraphModal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        issueId={issueId}
      />

      {/* AI Assignment Assistant Modal */}
      <AIAssignmentAssistantModal
        isOpen={isAssistantModalOpen}
        onClose={() => setIsAssistantModalOpen(false)}
        issueId={issueId}
        currentAssigneeId={issue.assigned_to}
        onAssigned={fetchDetails}
      />

      {/* Candidate Comparison Modal */}
      <CandidateComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        candidates={compareCandidates}
        intelligence={compareIntelligence}
      />

      {/* Developer Profile Modal */}
      <DeveloperProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={selectedDevId}
      />

      {/* Assignment Feedback Modal */}
      <AssignmentFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        issueId={issueId}
      />

      {/* Mandatory Reopen Reason Modal */}
      {isReopenModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ef4444' }}>
              Reopen Defect & Log Regression
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Please state why QA is rejecting this fix and reopening the issue back to Open.
            </p>

            <form onSubmit={handleConfirmReopen}>
              <div className="form-group">
                <label>Reopen Reason / QA Failure Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Fix failed on Safari 17 mobile build..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsReopenModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={!reopenReason.trim() || transitioning}>
                  {transitioning ? 'Reopening...' : 'Confirm Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Investigation Workspace Modal */}
      <InvestigationWorkspaceModal
        isOpen={isInvestigationOpen}
        onClose={() => setIsInvestigationOpen(false)}
        issueId={issueId}
      />

      {/* Bug Family Tree Modal */}
      <BugFamilyTreeModal
        isOpen={isFamilyTreeOpen}
        onClose={() => setIsFamilyTreeOpen(false)}
        issueId={issueId}
      />

      {/* Defect Lifecycle Time-Machine Replay Modal */}
      <DefectLifecycleReplayModal
        isOpen={isReplayOpen}
        onClose={() => setIsReplayOpen(false)}
        issueId={issueId}
      />

      {/* Defect Root Origin Analysis Modal */}
      <DefectOriginAnalysisModal
        isOpen={isOriginOpen}
        onClose={() => setIsOriginOpen(false)}
        issueId={issueId}
      />

      {/* Manual Log Time Modal */}
      {isLogTimeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6' }}>
                <Clock size={20} /> Log Time on Defect
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsLogTimeModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitTimeLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Issue</label>
                <input type="text" className="form-input" value={`#${issue.id} - ${issue.title}`} disabled style={{ background: 'rgba(0,0,0,0.04)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Hours</label>
                  <input type="number" step="0.5" min="0" className="form-input" value={logHours} onChange={e => setLogHours(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Minutes</label>
                  <input type="number" step="5" min="0" max="59" className="form-input" value={logMinutes} onChange={e => setLogMinutes(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Work Type</label>
                  <select className="form-select" value={logWorkType} onChange={e => setLogWorkType(e.target.value)}>
                    {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={logDate} onChange={e => setLogDate(e.target.value)} required />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Work Notes / Summary</label>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#10b981' }} onClick={handleAIPolishNote} disabled={aiGeneratingSummary || !logWorkNotes.trim()}>
                    {aiGeneratingSummary ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                    AI Polish Notes
                  </button>
                </div>
                <textarea className="form-textarea" rows={3} placeholder="Describe what you worked on..." value={logWorkNotes} onChange={e => setLogWorkNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="modalBillableToggle" checked={logBillable} onChange={e => setLogBillable(e.target.checked)} />
                <label htmlFor="modalBillableToggle" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Billable Engineering Hours</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsLogTimeModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingTimeLog}>
                  {submittingTimeLog ? 'Logging...' : 'Save Work Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stop Active Timer Modal */}
      {isStopTimerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Square size={18} /> Stop Timer & Save Work Log
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Enter final work notes before saving this active timer session into your timesheet.
            </p>

            <form onSubmit={handleConfirmStopTimer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Work Type</label>
                <select className="form-select" value={stopWorkType} onChange={e => setStopWorkType(e.target.value)}>
                  {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Work Notes</label>
                <textarea className="form-textarea" rows={3} placeholder="Summary of work completed during timer session..." value={stopWorkNotes} onChange={e => setStopWorkNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsStopTimerModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={submittingStopTimer}>
                  {submittingStopTimer ? 'Saving...' : 'Stop & Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

