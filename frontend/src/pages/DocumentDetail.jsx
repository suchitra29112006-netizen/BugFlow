import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  FileText, ArrowLeft, Edit3, Save, CheckCircle2, AlertCircle, Clock,
  History, Link2, MessageSquare, ShieldCheck, Sparkles, User, UserCheck,
  Tag, Plus, Trash2, RotateCcw, ExternalLink, Play, Bot, FileCode
} from 'lucide-react';

export const DocumentDetail = ({ documentId: propDocId, onBack }) => {
  const matchId = typeof window !== 'undefined' ? window.location.pathname.match(/\/documents\/(\d+)/)?.[1] : null;
  const id = propDocId || matchId;

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/documents');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'relations' | 'versions' | 'review' | 'comments' | 'ai'
  
  // Editor mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  // Relation modal state
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [targetType, setTargetType] = useState('issue');
  const [targetId, setTargetId] = useState('');
  const [targetTitle, setTargetTitle] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');

  // Review workflow state
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');

  // AI action state
  const [aiOutput, setAiOutput] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchDocDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getDocumentDetail(id);
      setDoc(data);
      setEditTitle(data.title || '');
      setEditDescription(data.description || '');
      setEditContent(data.content || '');
      setEditVersion(data.version || 'v1.0');
    } catch (err) {
      console.error("Failed to load document detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocDetail();
  }, [id]);

  const handleSaveContent = async () => {
    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        content: editContent,
        version: editVersion,
        change_summary: changeSummary || "Updated document content"
      };
      await api.updateDocument(id, payload);
      setIsEditing(false);
      setChangeSummary('');
      fetchDocDetail();
    } catch (err) {
      alert("Failed to save changes: " + err.message);
    }
  };

  const handleAddRelation = async (e) => {
    e.preventDefault();
    if (!targetId) return;
    try {
      await api.addDocumentRelation(id, {
        target_type: targetType,
        target_id: parseInt(targetId),
        target_title: targetTitle || `${targetType.toUpperCase()} #${targetId}`,
        relation_type: 'RELATE'
      });
      setIsRelModalOpen(false);
      setTargetId('');
      setTargetTitle('');
      fetchDocDetail();
    } catch (err) {
      alert("Failed to add relation: " + err.message);
    }
  };

  const handleRemoveRelation = async (relationId) => {
    try {
      await api.deleteDocumentRelation(id, relationId);
      fetchDocDetail();
    } catch (err) {
      alert("Failed to remove relation: " + err.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.addDocumentComment(id, { content: commentText });
      setCommentText('');
      fetchDocDetail();
    } catch (err) {
      alert("Failed to add comment: " + err.message);
    }
  };

  const handleSubmitReview = async () => {
    try {
      await api.reviewDocument(id, {
        review_status: reviewStatus,
        review_comments: reviewNotes
      });
      setReviewNotes('');
      fetchDocDetail();
    } catch (err) {
      alert("Failed to submit review: " + err.message);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm("Restore this version as current specification content?")) return;
    try {
      await api.restoreDocumentVersion(id, versionId);
      fetchDocDetail();
    } catch (err) {
      alert("Failed to restore version: " + err.message);
    }
  };

  const handleRunAIAction = async (actionKey) => {
    setAiLoading(true);
    setAiOutput(null);
    try {
      const res = await api.executeAIDocumentAction(actionKey, id);
      setAiOutput(res.output);
    } catch (err) {
      alert("AI Action error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading specification workspace...</div>;
  if (!doc) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Document not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Back Button & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={handleBackNavigation} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Knowledge Hub
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isEditing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveContent} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Save size={16} /> Save Changes
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Edit3 size={16} /> Edit Document
            </button>
          )}
        </div>
      </div>

      {/* Header Metadata Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-low">{doc.category}</span>
              <span className="badge badge-high" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>{doc.document_type}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                {doc.version}
              </span>
            </div>

            {isEditing ? (
              <input 
                type="text" 
                className="form-input" 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ fontSize: '1.5rem', fontWeight: 800, width: '100%', marginBottom: '0.5rem' }}
              />
            ) : (
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{doc.title}</h1>
            )}

            {isEditing ? (
              <input 
                type="text" 
                className="form-input" 
                placeholder="Description / short summary..."
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)}
                style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}
              />
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                {doc.description || "No specification overview provided."}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status:</span>
              <span className="badge badge-low" style={{ background: doc.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: doc.status === 'PUBLISHED' ? '#10b981' : '#f59e0b' }}>
                {doc.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Review:</span>
              <span className="badge badge-high" style={{ background: doc.review_status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: doc.review_status === 'APPROVED' ? '#10b981' : '#ef4444' }}>
                {doc.review_status}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Author:</span>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>{doc.author_name}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Assigned Owner:</span>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>{doc.owner_name || 'Unassigned'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Target Project:</span>
            <div style={{ fontWeight: 700, color: '#60a5fa', marginTop: '0.15rem' }}>{doc.project_name || 'Global / Org Spec'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Last Updated:</span>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.15rem' }}>
              {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Section Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {[
          { key: 'content', label: 'Specification Content', icon: FileText },
          { key: 'relations', label: `Linked Work (${doc.relations ? doc.relations.length : 0})`, icon: Link2 },
          { key: 'versions', label: `Version History (${doc.versions ? doc.versions.length : 1})`, icon: History },
          { key: 'review', label: 'Review & Approval', icon: UserCheck },
          { key: 'comments', label: `Discussion (${doc.comments ? doc.comments.length : 0})`, icon: MessageSquare },
          { key: 'ai', label: 'AI Diagnostics', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.85rem',
                border: 'none',
                background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
                color: active ? '#60a5fa' : 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Content Reader / Editor */}
      {activeTab === 'content' && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Version Snapshot Label</label>
                  <input type="text" className="form-input" value={editVersion} onChange={(e) => setEditVersion(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Change Summary Notes</label>
                  <input type="text" className="form-input" placeholder="What changed in this revision?" value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Markdown Specification Body</label>
                <textarea 
                  className="form-textarea" 
                  rows={16} 
                  value={editContent} 
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.6 }} 
                />
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-line', color: 'var(--text-main)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {doc.content || "No document body content present. Click 'Edit Document' to add Markdown content."}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Linked Work & Relations */}
      {activeTab === 'relations' && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Linked Entities & Cross-References</h3>
            <button className="btn btn-primary" onClick={() => setIsRelModalOpen(true)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={14} /> + Link Entity
            </button>
          </div>

          {doc.relations && doc.relations.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {doc.relations.map(rel => (
                <div key={rel.id} style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>{rel.target_type.toUpperCase()}</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.35rem' }}>{rel.target_title}</div>
                  </div>
                  <button onClick={() => handleRemoveRelation(rel.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }} title="Remove link">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No linked projects, sprints, or defects attached to this document yet.</p>
          )}
        </div>
      )}

      {/* Tab 3: Version History */}
      {activeTab === 'versions' && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Version History Timeline</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {doc.versions && doc.versions.map((ver, idx) => (
              <div key={ver.id} style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: '#60a5fa', fontSize: '0.95rem' }}>{ver.version}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{ver.title}</span>
                    {idx === 0 && <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>CURRENT</span>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {ver.change_summary} • Edited by {ver.created_by} on {ver.created_at ? new Date(ver.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>

                {idx !== 0 && (
                  <button className="btn btn-secondary" onClick={() => handleRestoreVersion(ver.id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <RotateCcw size={13} /> Restore
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Review & Approval */}
      {activeTab === 'review' && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Review & Approval Workflow</h3>

          <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={20} color={doc.review_status === 'APPROVED' ? '#10b981' : 'var(--text-muted)'} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Current State: {doc.review_status}</span>
            </div>
            {doc.last_reviewed_at && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                • Reviewed on {new Date(doc.last_reviewed_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '600px' }}>
            <div className="form-group">
              <label>Update Review Decision</label>
              <select className="form-select" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
                <option value="APPROVED">APPROVED (Publish Specification)</option>
                <option value="CHANGES_REQUESTED">CHANGES REQUESTED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="PENDING">PENDING REVIEW</option>
              </select>
            </div>

            <div className="form-group">
              <label>Review Notes / Feedback</label>
              <textarea className="form-textarea" rows={3} placeholder="Add comments regarding compliance, API consistency, or QA readiness..." value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
            </div>

            <button className="btn btn-primary" onClick={handleSubmitReview} style={{ alignSelf: 'flex-start' }}>
              Submit Review Decision
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Comments & Discussion */}
      {activeTab === 'comments' && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Specification Discussion & Audit Trail</h3>

          <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <textarea className="form-textarea" rows={3} placeholder="Add a comment or technical note..." value={commentText} onChange={(e) => setCommentText(e.target.value)} required />
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
              Add Comment
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
            {doc.comments && doc.comments.map(c => (
              <div key={c.id} style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.user_name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: AI Diagnostics */}
      {activeTab === 'ai' && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="#a855f7" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Specification Assistant & Security Audit</h3>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => handleRunAIAction('summarize')} disabled={aiLoading}>
              📝 Summarize Document
            </button>
            <button className="btn btn-secondary" onClick={() => handleRunAIAction('draft_test_plan')} disabled={aiLoading}>
              🧪 Draft Test Plan from Spec
            </button>
            <button className="btn btn-secondary" onClick={() => handleRunAIAction('security_audit')} disabled={aiLoading}>
              🛡️ Security & RBAC Audit
            </button>
          </div>

          {aiLoading && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Running AI Assistant diagnostics...</div>}

          {aiOutput && (
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)', whiteSpace: 'pre-line', fontSize: '0.88rem', lineHeight: 1.6 }}>
              {aiOutput}
            </div>
          )}
        </div>
      )}

      {/* Add Relation Modal */}
      {isRelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Link Entity to Document</h3>
            <form onSubmit={handleAddRelation}>
              <div className="form-group">
                <label>Entity Type</label>
                <select className="form-select" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                  <option value="issue">Defect / Bug (DEF-xxx)</option>
                  <option value="project">Project</option>
                  <option value="sprint">Sprint</option>
                  <option value="goal">Goal / OKR</option>
                  <option value="release">Release</option>
                  <option value="incident">Incident</option>
                </select>
              </div>

              <div className="form-group">
                <label>Entity ID *</label>
                <input type="number" className="form-input" placeholder="e.g. 1" value={targetId} onChange={(e) => setTargetId(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Entity Title / Label (Optional)</label>
                <input type="text" className="form-input" placeholder="e.g. DEF-104 Login crash" value={targetTitle} onChange={(e) => setTargetTitle(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsRelModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
