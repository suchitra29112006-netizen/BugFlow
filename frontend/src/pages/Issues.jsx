import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bug, Search, Plus, Sparkles, FolderKanban, AlertTriangle, Check, Loader2, Wand2, Globe2, Link2, Mic, MicOff, Kanban, List, Tag, Calendar, AlertCircle, Layers, CheckSquare, Square, Zap, HelpCircle, Trash2 } from 'lucide-react';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { DragDropUpload } from '../components/DragDropUpload';
import { ExplainWhyModal } from '../components/ExplainWhyModal';
import { AIBugGeneratorModal } from '../components/AIBugGeneratorModal';
import { ReportIssueModal } from '../components/ReportIssueModal';


const KANBAN_COLUMNS = ['Reported', 'Open', 'In Progress', 'In Review', 'Resolved', 'Closed'];

export const Issues = ({ projects, selectedProjectId, selectedSprintId, onSelectIssue }) => {
  const [issues, setIssues] = useState([]);
  const [labels, setLabels] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [smartTriageQueue, setSmartTriageQueue] = useState([]);
  const [loadingTriage, setLoadingTriage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const handleDeleteIssue = async (id, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete issue "${title}" (#${id})?`)) return;
    try {
      await api.deleteIssue(id);
      fetchIssues();
    } catch (err) {
      alert(err.message || 'Failed to delete issue.');
    }
  };
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [projectIdFilter, setProjectIdFilter] = useState(selectedProjectId || '');
  const [sprintIdFilter, setSprintIdFilter] = useState(selectedSprintId || '');
  const [labelIdFilter, setLabelIdFilter] = useState('');

  // View Mode: 'kanban' | 'list' | 'triage'
  const [viewMode, setViewMode] = useState('kanban');

  // Explain Why Modal state
  const [explainModal, setExplainModal] = useState({ isOpen: false, targetId: null, type: 'triage' });

  // Bulk Actions State
  const [selectedIssueIds, setSelectedIssueIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkSprint, setBulkSprint] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Report Issue Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [title, setTitle] = useState('');

  const [description, setDescription] = useState('');
  const [targetProject, setTargetProject] = useState(projects[0]?.id || '');
  const [targetSprint, setTargetSprint] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [priority, setPriority] = useState('Medium');
  const [selectedLabelIds, setSelectedLabelIds] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [createError, setCreateError] = useState('');

  // Voice Recognition State
  const [isListening, setIsListening] = useState(false);

  // AI Feature States inside Modal
  const [aiPrediction, setAiPrediction] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const [generatingDetail, setGeneratingDetail] = useState(false);
  const [autoTagging, setAutoTagging] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const data = await api.getIssues({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        project_id: projectIdFilter ? parseInt(projectIdFilter) : undefined,
        sprint_id: sprintIdFilter ? parseInt(sprintIdFilter) : undefined,
        label_id: labelIdFilter ? parseInt(labelIdFilter) : undefined,
      });
      setIssues(data);
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmartTriage = async () => {
    setLoadingTriage(true);
    try {
      const data = await api.getSmartTriageQueue(projectIdFilter ? parseInt(projectIdFilter) : undefined);
      setSmartTriageQueue(data.triage_queue || []);
    } catch (err) {
      console.error("Failed to fetch smart triage:", err);
    } finally {
      setLoadingTriage(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'triage') {
      fetchSmartTriage();
    } else {
      fetchIssues();
    }
  }, [search, statusFilter, severityFilter, projectIdFilter, sprintIdFilter, labelIdFilter, viewMode]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [u, l, s] = await Promise.all([
          api.getUsers(),
          api.getLabels(),
          api.getSprints()
        ]);
        setUsers(u);
        setLabels(l);
        setSprints(s);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Speech Recognition API is not supported.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setIsListening(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handlePredictSeverity = async () => {
    if (!title.trim()) return;
    try {
      const res = await api.predictAISeverity(title, description);
      setAiPrediction(res);
      if (res.predicted_severity) setSeverity(res.predicted_severity);
      if (res.predicted_priority) setPriority(res.predicted_priority);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setCreateError('');
    try {
      const projId = parseInt(targetProject || projects[0]?.id || 1);
      const created = await api.createIssue({
        title,
        description,
        severity,
        priority,
        project_id: projId,
        sprint_id: targetSprint ? parseInt(targetSprint) : null,

        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        pr_url: prUrl.trim() || null,
        assigned_to: assignedTo ? parseInt(assignedTo) : null,
        label_ids: selectedLabelIds
      });

      if (selectedFile && created?.id) {
        try {
          await api.uploadAttachment(created.id, selectedFile);
        } catch (uploadErr) {
          console.error(uploadErr);
        }
      }

      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setSelectedLabelIds([]);
      setDueDate('');
      setPrUrl('');
      setIsModalOpen(false);
      fetchIssues();
    } catch (err) {
      setCreateError(err.message || 'Failed to report issue.');
    }
  };

  const toggleSelectIssue = (id, e) => {
    e.stopPropagation();
    setSelectedIssueIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = async () => {
    if (selectedIssueIds.length === 0) return;
    setBulkUpdating(true);
    try {
      await api.bulkUpdateIssues({
        issue_ids: selectedIssueIds,
        status: bulkStatus || undefined,
        sprint_id: bulkSprint ? parseInt(bulkSprint) : undefined
      });
      setSelectedIssueIds([]);
      setBulkStatus('');
      setBulkSprint('');
      fetchIssues();
    } catch (err) {
      alert("Bulk update failed: " + err.message);
    } finally {
      setBulkUpdating(false);
    }
  };

  const toggleLabelSelection = (labelId) => {
    setSelectedLabelIds(prev => 
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Issues & Defect Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Interactive Kanban board, Smart Triage Queue, and AI assistance.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              className="btn"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: viewMode === 'kanban' ? 'var(--accent-primary)' : 'transparent', color: viewMode === 'kanban' ? '#fff' : 'var(--text-muted)' }}
              onClick={() => setViewMode('kanban')}
            >
              <Kanban size={14} /> Kanban
            </button>
            <button
              className="btn"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-muted)' }}
              onClick={() => setViewMode('list')}
            >
              <List size={14} /> List
            </button>
            <button
              className="btn"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: viewMode === 'triage' ? 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' : 'transparent', color: viewMode === 'triage' ? '#fff' : 'var(--text-muted)', fontWeight: 700 }}
              onClick={() => setViewMode('triage')}
            >
              <Zap size={14} /> Smart Triage Queue
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ color: '#a855f7' }} onClick={() => setIsAiGeneratorOpen(true)}>
              <Sparkles size={16} /> AI Bug Generator
            </button>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              Report Issue
            </button>
          </div>

        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIssueIds.length > 0 && (
        <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>
            <Layers size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            {selectedIssueIds.length} Issues Selected for Bulk Action
          </span>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select className="form-select" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
              <option value="">Set Status...</option>
              {KANBAN_COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select className="form-select" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }} value={bulkSprint} onChange={(e) => setBulkSprint(e.target.value)}>
              <option value="">Set Sprint...</option>
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }} onClick={handleBulkUpdate} disabled={bulkUpdating}>
              {bulkUpdating ? 'Updating...' : 'Apply Bulk Update'}
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
            placeholder="Search title, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <select className="form-select" style={{ width: '160px', fontSize: '0.85rem' }} value={projectIdFilter} onChange={(e) => setProjectIdFilter(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select className="form-select" style={{ width: '150px', fontSize: '0.85rem' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {KANBAN_COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="form-select" style={{ width: '150px', fontSize: '0.85rem' }} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select className="form-select" style={{ width: '150px', fontSize: '0.85rem' }} value={labelIdFilter} onChange={(e) => setLabelIdFilter(e.target.value)}>
          <option value="">All Labels</option>
          {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* View Mode: Smart Triage Queue */}
      {viewMode === 'triage' ? (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f97316', fontWeight: 900, fontSize: '1.15rem' }}>
                <Zap size={22} />
                Phase 2: Smart Triage Queue (Impact Score 0–100)
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Sorted by deterministic Impact Score combining Severity, Priority, SLA remaining, Age, Reopens, and Similar Defects.
              </span>
            </div>
          </div>

          {loadingTriage ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Calculating Smart Triage Impact Scores...</div>
          ) : smartTriageQueue.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No open defects in Smart Triage queue.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {smartTriageQueue.map((item, idx) => (
                <div
                  key={item.issue.id}
                  className="glass-panel"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    background: idx === 0 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%)' : 'rgba(0,0,0,0.02)',
                    border: idx === 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                  onClick={() => onSelectIssue(item.issue.id)}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: idx === 0 ? '#ef4444' : '#f97316', width: '40px', textAlign: 'center' }}>
                      #{idx + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>DEF-{item.issue.id}: {item.issue.title}</span>
                        <span className={`badge badge-${item.issue.severity.toLowerCase()}`}>{item.issue.severity}</span>
                        <span className={`badge badge-${item.issue.status.toLowerCase().replace(' ', '-')}`}>{item.issue.status}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {item.rank_reasons.map((r, rIdx) => (
                          <span key={rIdx} style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', fontWeight: 600 }}>
                            • {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span className="badge badge-low" style={{ background: item.impact_score > 75 ? '#ef4444' : (item.impact_score > 50 ? '#f97316' : '#10b981'), color: '#fff', fontSize: '0.88rem', fontWeight: 900 }}>
                      ⚡ Impact Score: {item.impact_score}/100 ({item.risk_level})
                    </span>

                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExplainModal({ isOpen: true, targetId: item.issue.id, type: 'triage' });
                      }}
                    >
                      <HelpCircle size={12} color="#10b981" /> {idx === 0 ? 'Why is this ranked #1?' : 'Explain Why'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'kanban' ? (
        /* View Mode: Kanban Board */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(220px, 1fr))', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {KANBAN_COLUMNS.map(col => {
            const colIssues = issues.filter(i => i.status === col);
            return (
              <div key={col} className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', minHeight: '550px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{col}</span>
                  <span className="badge badge-assigned" style={{ fontSize: '0.7rem' }}>{colIssues.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {colIssues.map(iss => (
                    <div
                      key={iss.id}
                      className="glass-panel"
                      style={{ padding: '0.85rem', cursor: 'pointer', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                      onClick={() => onSelectIssue(iss.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <span className={`badge badge-${iss.severity.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{iss.severity}</span>
                        <input type="checkbox" checked={selectedIssueIds.includes(iss.id)} onChange={(e) => toggleSelectIssue(iss.id, e)} />
                      </div>

                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.35, marginBottom: '0.4rem' }}>#{iss.id} {iss.title}</h4>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <span>{iss.assignee?.name || 'Unassigned'}</span>
                        {iss.is_regression && <span style={{ color: '#ef4444', fontWeight: 800 }}>⚠️ Reopened</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View Mode: List View */
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {issues.map(iss => (
              <div
                key={iss.id}
                style={{ padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => onSelectIssue(iss.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <input type="checkbox" checked={selectedIssueIds.includes(iss.id)} onChange={(e) => toggleSelectIssue(iss.id, e)} />
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>#{iss.id} {iss.title}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Project: {iss.project?.name} • Reporter: {iss.reporter?.name}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <span className={`badge badge-${iss.severity.toLowerCase()}`}>{iss.severity}</span>
                  <span className={`badge badge-${iss.status.toLowerCase().replace(' ', '-')}`}>{iss.status}</span>
                  <button
                    onClick={(e) => handleDeleteIssue(iss.id, iss.title, e)}
                    title="Delete Issue"
                    style={{ border: 'none', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '0.35rem 0.5rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Explain Why Modal */}
      <ExplainWhyModal
        isOpen={explainModal.isOpen}
        onClose={() => setExplainModal({ ...explainModal, isOpen: false })}
        targetId={explainModal.targetId}
        recommendationType={explainModal.type}
      />

      {/* AI Bug Generator Modal */}
      <AIBugGeneratorModal
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        projects={projects}
        onIssueCreated={fetchIssues}
      />

      {/* Standard Report Issue Modal */}
      <ReportIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projects={projects}
        sprints={sprints}
        users={users}
        onIssueCreated={fetchIssues}
      />

    </div>
  );

};
