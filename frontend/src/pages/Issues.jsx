import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bug, Search, Plus, Sparkles, FolderKanban, AlertTriangle, Paperclip, Check, Loader2, Wand2, Globe2, Link2, Mic, MicOff, Kanban, List } from 'lucide-react';


const KANBAN_COLUMNS = ['Reported', 'Open', 'In Progress', 'In Review', 'Resolved', 'Closed'];

export const Issues = ({ projects, selectedProjectId, onSelectIssue }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [projectIdFilter, setProjectIdFilter] = useState(selectedProjectId || '');

  // View Mode: 'list' | 'kanban'
  const [viewMode, setViewMode] = useState('kanban');

  // Report Issue Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetProject, setTargetProject] = useState(projects[0]?.id || '');
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [priority, setPriority] = useState('Medium');
  const [selectedFile, setSelectedFile] = useState(null);
  const [createError, setCreateError] = useState('');

  // Voice Recognition State
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  // AI Feature States inside Modal
  const [aiPrediction, setAiPrediction] = useState(null); // { severity, confidence, reasoning }
  const [predicting, setPredicting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { has_duplicate, duplicates }
  const [generatingDetail, setGeneratingDetail] = useState(false);
  const [attachedToExisting, setAttachedToExisting] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const data = await api.getIssues({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        project_id: projectIdFilter ? parseInt(projectIdFilter) : undefined
      });
      setIssues(data);
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [search, statusFilter, severityFilter, projectIdFilter]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const u = await api.getUsers();
        setUsers(u);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  // Voice Bug Reporting 🎙 (Web Speech API)
  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech Recognition API is not supported in this browser. Try Google Chrome or Microsoft Edge.");
      setVoiceSupported(false);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setTitle(transcript);
          setDescription(`Voice Bug Report Transcript: "${transcript}"`);
        }
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  // Debounced AI Predict Severity & Duplicate Detection as user types
  useEffect(() => {
    if (!isModalOpen || (!title.trim() && !description.trim())) {
      setAiPrediction(null);
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      // 1. Predict Severity
      try {
        setPredicting(true);
        const pred = await api.predictAISeverity(title, description);
        setAiPrediction(pred);
        setSeverity(pred.severity);
      } catch (err) {
        console.error("Severity prediction failed:", err);
      } finally {
        setPredicting(false);
      }

      // 2. Check Duplicates
      try {
        const dup = await api.checkDuplicates(title, description, targetProject ? parseInt(targetProject) : null);
        if (dup.has_duplicate) {
          setDuplicateWarning(dup.duplicates[0]);
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.error("Duplicate check failed:", err);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description, targetProject, isModalOpen]);

  const handleAIGenerateDetail = async () => {
    const promptText = title || description;
    if (!promptText.trim()) return;

    setGeneratingDetail(true);
    try {
      const projName = projects.find(p => p.id === parseInt(targetProject))?.name;
      const res = await api.generateAIBugReport(promptText, projName);
      if (!title || title === promptText) setTitle(res.title);
      
      const expandedDesc = `${res.description}\n\n**Expected Behavior:**\n${res.expected_behavior}\n\n**Actual Behavior:**\n${res.actual_behavior}\n\n**Steps to Reproduce:**\n${res.steps_to_reproduce}\n\n**Environment:**\n${res.environment}`;
      setDescription(expandedDesc);
    } catch (err) {
      alert("AI Assistant failed: " + err.message);
    } finally {
      setGeneratingDetail(false);
    }
  };

  const handleAttachToExistingIssue = async (existingIssueId) => {
    try {
      await api.addComment(existingIssueId, `[Duplicate Report Linked]: "${title} - ${description}"`);
      setAttachedToExisting(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setAttachedToExisting(false);
        setTitle('');
        setDescription('');
        onSelectIssue(existingIssueId);
      }, 1200);
    } catch (err) {
      alert("Failed to attach to existing issue: " + err.message);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setCreateError('');
    try {
      const created = await api.createIssue({
        title,
        description,
        severity,
        priority,
        project_id: parseInt(targetProject),
        assigned_to: assignedTo ? parseInt(assignedTo) : null
      });

      if (selectedFile && created?.id) {
        try {
          await api.uploadAttachment(created.id, selectedFile);
        } catch (uploadErr) {
          console.error("File attachment upload failed:", uploadErr);
        }
      }

      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setIsModalOpen(false);
      fetchIssues();
    } catch (err) {
      setCreateError(err.message || 'Failed to report issue.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Issues & Defect Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Interactive Kanban board and AI-assisted defect triage.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* List vs Kanban Toggle */}
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
          </div>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Report Issue
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <div style={{ minWidth: '160px' }}>
          <select className="form-select" value={projectIdFilter} onChange={(e) => setProjectIdFilter(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '140px' }}>
          <select className="form-select" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Issues View (Kanban Board vs List View) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading defects...</div>
      ) : issues.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Bug size={48} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
          <h3>No Issues Found</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem 0' }}>Try adjusting your search criteria or report a new defect.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* Interactive Kanban Board View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(220px, 1fr))', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {KANBAN_COLUMNS.map((colStatus) => {
            const colIssues = issues.filter(i => i.status === colStatus);
            return (
              <div key={colStatus} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: '500px', background: 'rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span className={`badge badge-${colStatus.toLowerCase().replace(' ', '-')}`}>{colStatus}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{colIssues.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {colIssues.map((iss) => (
                    <div
                      key={iss.id}
                      style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}
                      onClick={() => onSelectIssue(iss.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span className={`badge badge-${iss.severity.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{iss.severity}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>#{iss.id}</span>
                      </div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>{iss.title}</h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{iss.project?.name}</span>
                        <span>{iss.assignee?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Standard List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {issues.map((iss) => (
            <div
              key={iss.id}
              className="glass-panel"
              style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}
              onClick={() => onSelectIssue(iss.id)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className={`badge badge-${iss.severity.toLowerCase()}`}>{iss.severity}</span>
                  <span className={`badge badge-${iss.status.toLowerCase().replace(' ', '-')}`}>{iss.status}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FolderKanban size={12} />
                    {iss.project?.name}
                  </span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{iss.title}</h4>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {iss.assignee ? iss.assignee.name : 'Unassigned'}
                  </span>
                  <span>Reported by {iss.reporter?.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Issue Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Report New Software Issue</h3>
                
                {/* Voice Bug Reporting 🎙 Button */}
                <button
                  type="button"
                  className={`btn ${isListening ? 'btn-danger' : 'btn-peach'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={toggleVoiceRecording}
                  title="Voice Bug Reporting 🎙 (Speak to report bug)"
                >
                  {isListening ? <MicOff size={14} className="animate-pulse" /> : <Mic size={14} />}
                  {isListening ? '🎙 Listening... Speak Now' : '🎙 Voice Bug Report'}
                </button>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            {createError && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {createError}
              </div>
            )}

            {/* Enhanced AI Duplicate Bug Detection Card */}
            {duplicateWarning && (
              <div style={{ background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.4)', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f97316', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={20} />
                  A similar issue already exists!
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.04)', padding: '0.6rem 0.85rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>EXISTING ISSUE:</span>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      #{duplicateWarning.issue_id} {duplicateWarning.title}
                    </div>
                  </div>
                  <span className="badge badge-high" style={{ fontSize: '0.75rem' }}>
                    Similarity: {duplicateWarning.similarity}%
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  <strong>Recommendation:</strong> Do you want to attach your report to this existing issue instead?
                </div>

                <button
                  type="button"
                  className="btn btn-peach"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.55rem', fontSize: '0.85rem' }}
                  onClick={() => handleAttachToExistingIssue(duplicateWarning.issue_id)}
                  disabled={attachedToExisting}
                >
                  {attachedToExisting ? <Check size={16} /> : <Link2 size={16} />}
                  {attachedToExisting ? 'Attached to Issue #' + duplicateWarning.issue_id : 'Attach My Report to Issue #' + duplicateWarning.issue_id}
                </button>
              </div>
            )}

            <form onSubmit={handleCreateIssue}>
              <div className="form-group">
                <label>Target Project</label>
                <select className="form-select" value={targetProject} onChange={(e) => setTargetProject(e.target.value)} required>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Issue Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Login button crashes app / speak via microphone 🎙"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Globe2 size={14} color="#10b981" />
                    Multi-Language Description (Kannada, Hindi, English, etc.)
                  </label>
                  <button
                    type="button"
                    className="btn btn-peach"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={handleAIGenerateDetail}
                    disabled={generatingDetail || (!title.trim() && !description.trim())}
                  >
                    {generatingDetail ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                    {generatingDetail ? 'AI Translating...' : '🌐 AI Auto-Translate & Expand'}
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe bug or click 🎙 Voice Bug Report..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* AI Severity Prediction Card */}
              {aiPrediction && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Sparkles size={14} />
                      AI Severity Predictor
                    </span>
                    <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                      Confidence: {aiPrediction.confidence}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Predicted Severity: <span className={`badge badge-${aiPrediction.severity.toLowerCase()}`}>{aiPrediction.severity}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Reason:</strong> {aiPrediction.reasoning}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Severity</label>
                  <select className="form-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Assign To (Optional)</label>
                  <select className="form-select" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label>Attach File (Screenshot, Video, Crash/Console Log, PDF)</label>
                <input
                  type="file"
                  className="form-input"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  accept="image/*,video/*,.log,.txt,.pdf"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
