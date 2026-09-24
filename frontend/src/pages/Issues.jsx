import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Bug, Search, Plus, Sparkles, FolderKanban, AlertTriangle, Check, Loader2, 
  Wand2, Globe2, Link2, Kanban, List, Tag, Calendar, AlertCircle, 
  Layers, CheckSquare, Square, Zap, HelpCircle, Trash2, Filter, RefreshCw 
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ExplainWhyModal } from '../components/ExplainWhyModal';
import { AIBugGeneratorModal } from '../components/AIBugGeneratorModal';
import { ReportIssueModal } from '../components/ReportIssueModal';


const KANBAN_COLUMNS = ['Reported', 'Open', 'In Progress', 'In Review', 'Resolved', 'Closed'];

export const Issues = ({ projects = [], selectedProjectId, selectedSprintId, onSelectIssue }) => {
  const [issues, setIssues] = useState([]);
  const [labels, setLabels] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [smartTriageQueue, setSmartTriageQueue] = useState([]);
  const [loadingTriage, setLoadingTriage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [projectIdFilter, setProjectIdFilter] = useState(selectedProjectId || '');
  const [sprintIdFilter, setSprintIdFilter] = useState(selectedSprintId || '');
  const [labelIdFilter, setLabelIdFilter] = useState('');

  // View Mode: 'list' | 'kanban' | 'triage'
  const [viewMode, setViewMode] = useState('list');

  // Explain Why Modal state
  const [explainModal, setExplainModal] = useState({ isOpen: false, targetId: null, type: 'triage' });

  // Bulk Actions State
  const [selectedIssueIds, setSelectedIssueIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkSprint, setBulkSprint] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);

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
      setIssues(data || []);
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
        const [l, s] = await Promise.all([
          api.getLabels().catch(() => []),
          api.getSprints().catch(() => [])
        ]);
        setLabels(l || []);
        setSprints(s || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

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

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIssueIds(issues.map(i => i.id));
    } else {
      setSelectedIssueIds([]);
    }
  };

  const toggleSelectIssue = (id, e) => {
    e.stopPropagation();
    setSelectedIssueIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = async () => {
    if (selectedIssueIds.length === 0) return;
    if (!bulkStatus && !bulkSprint) {
      alert("Please select a status or sprint to bulk update.");
      return;
    }

    setBulkUpdating(true);
    try {
      await Promise.all(selectedIssueIds.map(id => {
        const payload = {};
        if (bulkStatus) payload.status = bulkStatus;
        if (bulkSprint) payload.sprint_id = parseInt(bulkSprint);
        return api.updateIssue(id, payload);
      }));

      setSelectedIssueIds([]);
      setBulkStatus('');
      setBulkSprint('');
      fetchIssues();
    } catch (err) {
      alert(err.message || "Bulk update failed.");
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Page Header */}
      <PageHeader
        title="Bugs & Tasks Workspace"
        subtitle="Manage, filter, bulk update, and triage software defects across your engineering workspace."
        breadcrumbs={['Workspace', 'Bugs & Tasks']}
        actions={
          <>
            <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px' }}>
              <button
                className="btn"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-muted)' }}
                onClick={() => setViewMode('list')}
              >
                <List size={14} /> Dense List
              </button>
              <button
                className="btn"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', background: viewMode === 'kanban' ? 'var(--accent-primary)' : 'transparent', color: viewMode === 'kanban' ? '#fff' : 'var(--text-muted)' }}
                onClick={() => setViewMode('kanban')}
              >
                <Kanban size={14} /> Board
              </button>
              <button
                className="btn"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', background: viewMode === 'triage' ? '#f97316' : 'transparent', color: viewMode === 'triage' ? '#fff' : 'var(--text-muted)' }}
                onClick={() => setViewMode('triage')}
              >
                <Zap size={14} /> Smart Triage
              </button>
            </div>

            <button className="btn btn-secondary" style={{ color: '#a855f7', fontSize: '0.8rem' }} onClick={() => setIsAiGeneratorOpen(true)}>
              <Sparkles size={14} /> AI Bug Generator
            </button>
            <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => setIsModalOpen(true)}>
              <Plus size={14} /> Report Issue
            </button>
          </>
        }
      />

      {/* Bulk Action Bar */}
      {selectedIssueIds.length > 0 && (
        <div className="glass-panel" style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>
            <Layers size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            {selectedIssueIds.length} Issue(s) Selected for Bulk Action
          </span>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <select className="form-select" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', width: '140px' }} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
              <option value="">Set Status...</option>
              {KANBAN_COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select className="form-select" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', width: '140px' }} value={bulkSprint} onChange={(e) => setBulkSprint(e.target.value)}>
              <option value="">Set Sprint...</option>
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={handleBulkUpdate} disabled={bulkUpdating}>
              {bulkUpdating ? 'Updating...' : 'Apply Update'}
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', fontSize: '0.82rem' }}
            placeholder="Search issue title, description, key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <select className="form-select" style={{ width: '150px', fontSize: '0.82rem' }} value={projectIdFilter} onChange={(e) => setProjectIdFilter(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select className="form-select" style={{ width: '140px', fontSize: '0.82rem' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {KANBAN_COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="form-select" style={{ width: '140px', fontSize: '0.82rem' }} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select className="form-select" style={{ width: '140px', fontSize: '0.82rem' }} value={labelIdFilter} onChange={(e) => setLabelIdFilter(e.target.value)}>
          <option value="">All Labels</option>
          {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        {(search || statusFilter || severityFilter || projectIdFilter || labelIdFilter) && (
          <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }} onClick={() => { setSearch(''); setStatusFilter(''); setSeverityFilter(''); setProjectIdFilter(''); setLabelIdFilter(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* VIEW MODE 1: DENSE ENGINEERING LIST TABLE */}
      {viewMode === 'list' && (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem 0.8rem', width: '36px' }}>
                    <input type="checkbox" onChange={toggleSelectAll} checked={selectedIssueIds.length > 0 && selectedIssueIds.length === issues.length} />
                  </th>
                  <th style={{ padding: '0.65rem 0.8rem', width: '80px' }}>KEY</th>
                  <th style={{ padding: '0.65rem 0.8rem' }}>ISSUE SUMMARY</th>
                  <th style={{ padding: '0.65rem 0.8rem' }}>STATUS</th>
                  <th style={{ padding: '0.65rem 0.8rem' }}>SEVERITY</th>
                  <th style={{ padding: '0.65rem 0.8rem' }}>ASSIGNEE</th>
                  <th style={{ padding: '0.65rem 0.8rem' }}>PROJECT</th>
                  <th style={{ padding: '0.65rem 0.8rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading engineering issues...</td>
                  </tr>
                ) : issues.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No engineering issues found matching current filters.
                    </td>
                  </tr>
                ) : (
                  issues.map(iss => (
                    <tr
                      key={iss.id}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.15s' }}
                      className="table-row-hover"
                      onClick={() => onSelectIssue(iss.id)}
                    >
                      <td style={{ padding: '0.65rem 0.8rem' }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIssueIds.includes(iss.id)} onChange={e => toggleSelectIssue(iss.id, e)} />
                      </td>

                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#3b82f6', fontFamily: 'monospace' }}>
                        #{iss.id}
                      </td>

                      <td style={{ padding: '0.65rem 0.8rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{iss.title}</div>
                        {iss.labels && iss.labels.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                            {iss.labels.map(l => (
                              <span key={l.id} style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '3px', background: `${l.color}20`, color: l.color, fontWeight: 600 }}>
                                {l.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.65rem 0.8rem' }}>
                        <span className={`badge badge-${iss.status.toLowerCase().replace(' ', '-')}`}>{iss.status}</span>
                      </td>

                      <td style={{ padding: '0.65rem 0.8rem' }}>
                        <span className={`badge badge-${iss.severity.toLowerCase()}`}>{iss.severity}</span>
                      </td>

                      <td style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {iss.assignee?.name || iss.assigned_to_name || 'Unassigned'}
                      </td>

                      <td style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>
                        {iss.project?.name || 'General'}
                      </td>

                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem' }}
                          onClick={e => handleDeleteIssue(iss.id, iss.title, e)}
                          title="Delete issue"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(220px, 1fr))', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {KANBAN_COLUMNS.map(col => {
            const colIssues = issues.filter(i => i.status === col);
            return (
              <div key={col} className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{col}</span>
                  <span className="badge badge-assigned" style={{ fontSize: '0.68rem' }}>{colIssues.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                  {colIssues.map(iss => (
                    <div
                      key={iss.id}
                      className="glass-panel"
                      style={{ padding: '0.75rem', cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                      onClick={() => onSelectIssue(iss.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span className={`badge badge-${iss.severity.toLowerCase()}`} style={{ fontSize: '0.62rem' }}>{iss.severity}</span>
                        <input type="checkbox" checked={selectedIssueIds.includes(iss.id)} onChange={(e) => toggleSelectIssue(iss.id, e)} onClick={e => e.stopPropagation()} />
                      </div>

                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.35rem' }}>#{iss.id} {iss.title}</h4>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
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
      )}

      {/* VIEW MODE 3: SMART TRIAGE QUEUE */}
      {viewMode === 'triage' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f97316', fontWeight: 900, fontSize: '1.1rem' }}>
                <Zap size={20} />
                Smart Triage Priority Queue (Deterministic Impact Score 0–100)
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Ranks bugs based on severity, SLA risk, reopen count, and customer impact.
              </span>
            </div>
          </div>

          {loadingTriage ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Calculating Smart Triage Impact Scores...</div>
          ) : smartTriageQueue.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No open defects in Smart Triage queue.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {smartTriageQueue.map((item, idx) => (
                <div
                  key={item.issue.id}
                  className="glass-panel"
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    background: idx === 0 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(0,0,0,0.02)',
                    border: idx === 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                  onClick={() => onSelectIssue(item.issue.id)}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: idx === 0 ? '#ef4444' : '#f97316', width: '36px', textAlign: 'center' }}>
                      #{idx + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>DEF-{item.issue.id}: {item.issue.title}</span>
                        <span className={`badge badge-${item.issue.severity.toLowerCase()}`}>{item.issue.severity}</span>
                        <span className={`badge badge-${item.issue.status.toLowerCase().replace(' ', '-')}`}>{item.issue.status}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                        {item.rank_reasons.map((r, rIdx) => (
                          <span key={rIdx} style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.04)', color: 'var(--text-muted)', fontWeight: 600 }}>
                            • {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <span className="badge badge-low" style={{ background: item.impact_score > 75 ? '#ef4444' : (item.impact_score > 50 ? '#f97316' : '#10b981'), color: '#fff', fontSize: '0.82rem', fontWeight: 900 }}>
                      ⚡ Impact Score: {item.impact_score}/100 ({item.risk_level})
                    </span>

                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExplainModal({ isOpen: true, targetId: item.issue.id, type: 'triage' });
                      }}
                    >
                      <HelpCircle size={12} color="#10b981" /> {idx === 0 ? 'Why Ranked #1?' : 'Explain Why'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Global Modals */}
      <ExplainWhyModal
        isOpen={explainModal.isOpen}
        onClose={() => setExplainModal({ ...explainModal, isOpen: false })}
        targetId={explainModal.targetId}
        recommendationType={explainModal.type}
      />

      <AIBugGeneratorModal
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        projects={projects}
        onIssueCreated={fetchIssues}
      />

      <ReportIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projects={projects}
        sprints={sprints}
        users={[]}
        onIssueCreated={fetchIssues}
      />

    </div>
  );
};
