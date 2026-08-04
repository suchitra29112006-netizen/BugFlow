import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ArrowLeft, MessageSquare, Send, User, Trash2, CheckCircle2, Paperclip, FileText, Sparkles, Code2, Loader2, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ALLOWED_TRANSITIONS = {
  Reported: ['Open', 'Assigned', 'Closed'],
  Open: ['Assigned', 'In Progress', 'Closed'],
  Assigned: ['In Progress', 'Open', 'In Review'],
  'In Progress': ['In Review', 'Open', 'Assigned'],
  'In Review': ['Resolved', 'In Progress'],
  Resolved: ['Closed', 'In Progress'],
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

  // AI Code Fix Suggestion state
  const [codeFix, setCodeFix] = useState(null);
  const [generatingFix, setGeneratingFix] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchDetails = async () => {
    try {
      const [issData, commData, attData, usersData] = await Promise.all([
        api.getIssue(issueId),
        api.getComments(issueId),
        api.getAttachments(issueId),
        api.getUsers()
      ]);
      setIssue(issData);
      setComments(commData);
      setAttachments(attData);
      setUsers(usersData);
    } catch (err) {
      setError(err.message || 'Failed to load issue details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [issueId]);

  const handleGenerateCodeFix = async () => {
    if (!issue) return;
    setGeneratingFix(true);
    try {
      const fixData = await api.suggestCodeFix(issue.title, issue.description);
      setCodeFix(fixData);
    } catch (err) {
      setError("AI Code Fix Analysis failed: " + err.message);
    } finally {
      setGeneratingFix(false);
    }
  };

  const handleCopyFix = () => {
    if (!codeFix?.fix_snippet) return;
    navigator.clipboard.writeText(codeFix.fix_snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleStatusChange = async (targetStatus) => {
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

  const handleAssigneeChange = async (userId) => {
    setError('');
    try {
      const updated = await api.updateIssue(issueId, { assigned_to: userId ? parseInt(userId) : 0 });
      setIssue(updated);
    } catch (err) {
      setError(err.message || 'Assignee update failed.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      await api.uploadAttachment(issueId, file);
      const att = await api.getAttachments(issueId);
      setAttachments(att);
    } catch (err) {
      setError("File upload failed: " + err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.addComment(issueId, newComment);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Issues
        </button>

        {(user?.role === 'Admin' || user?.id === issue.reporter_id) && (
          <button className="btn btn-danger" onClick={handleDeleteIssue}>
            <Trash2 size={16} />
            Delete Issue
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Title, Description, AI Fix Suggestion, Attachments, Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span className={`badge badge-${issue.severity.toLowerCase()}`}>{issue.severity} Severity</span>
              <span className={`badge badge-${issue.status.toLowerCase().replace(' ', '-')}`}>{issue.status}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project: {issue.project?.name}</span>
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.25rem' }}>{issue.title}</h1>

            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {issue.description}
            </div>
          </div>

          {/* AI Root Cause & Code Fix Suggestion Widget */}
          <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }}>
                <Sparkles size={20} />
                🤖 AI Root Cause & Code Fix Suggestion
              </div>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }} onClick={handleGenerateCodeFix} disabled={generatingFix}>
                {generatingFix ? <Loader2 className="animate-spin" size={14} /> : <Code2 size={14} />}
                {generatingFix ? 'Analyzing Root Cause...' : 'Generate Code Fix'}
              </button>
            </div>

            {codeFix ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.88rem' }}>
                  <strong style={{ color: '#f97316' }}>Predicted Root Cause:</strong>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{codeFix.root_cause}</p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>Suggested Fix Snippet:</strong>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={handleCopyFix}>
                      {copiedCode ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      {copiedCode ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <pre style={{ background: '#09101d', color: '#34d399', padding: '1rem', borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'monospace', overflowX: 'auto', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                    {codeFix.fix_snippet}
                  </pre>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <strong>Recommendation:</strong> {codeFix.recommendation}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Click 'Generate Code Fix' to analyze the bug description and generate possible root cause diagnoses and code fix snippets.
              </p>
            )}
          </div>

          {/* File Attachments Section */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                <Paperclip size={18} />
                Attachments ({attachments.length})
              </h3>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                {uploadingFile ? 'Uploading...' : '+ Upload Attachment'}
                <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploadingFile} />
              </label>
            </div>

            {attachments.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No screenshots, videos, or logs uploaded yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {attachments.map((att) => {
                  const isImg = /\.(png|jpe?g|gif|webp)$/i.test(att.file_name);
                  const isVid = /\.(mp4|webm|ogg)$/i.test(att.file_name);
                  return (
                    <div key={att.id} style={{ background: 'rgba(0,0,0,0.04)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {isImg ? (
                        <a href={att.file_path} target="_blank" rel="noreferrer">
                          <img src={att.file_path} alt={att.file_name} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px' }} />
                        </a>
                      ) : isVid ? (
                        <video src={att.file_path} controls style={{ width: '100%', height: '100px', borderRadius: '6px' }} />
                      ) : (
                        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.03)', borderRadius: '6px' }}>
                          <FileText size={28} color="#10b981" />
                        </div>
                      )}
                      <a href={att.file_path} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {att.file_name}
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
                  <div key={c.id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{c.user?.name || 'User'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Write a comment or update note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!newComment.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>

        {/* Right Sidebar: Status Workflow Controls & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
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
                    className="btn btn-secondary"
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>ASSIGNED TO</span>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>REPORTER</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{issue.reporter?.name}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>REPORTED ON</span>
              <span style={{ fontSize: '0.85rem' }}>{new Date(issue.created_at).toLocaleString()}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
