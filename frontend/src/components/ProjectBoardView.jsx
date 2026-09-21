import React, { useState, useEffect } from 'react';
import { Kanban, Plus, User, AlertCircle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

export default function ProjectBoardView({ projectId, onSelectIssue }) {
  const [board, setBoard] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) fetchBoardData();
  }, [projectId]);

  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const [boardsRes, issuesRes] = await Promise.all([
        api.get(`/api/v1/boards/project/${projectId}`),
        api.getIssues({ project_id: projectId })
      ]);
      if (boardsRes && boardsRes.length > 0) setBoard(boardsRes[0]);
      setIssues(issuesRes || []);
    } catch (err) {
      console.error("Failed to load project board:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = board?.columns_json ? JSON.parse(board.columns_json) : [
    { id: 'todo', name: 'TODO', color: '#64748b' },
    { id: 'in_progress', name: 'IN PROGRESS', color: '#3b82f6' },
    { id: 'code_review', name: 'CODE REVIEW', color: '#8b5cf6' },
    { id: 'testing', name: 'TESTING', color: '#f59e0b' },
    { id: 'done', name: 'DONE', color: '#10b981' }
  ];

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading Project Board...</div>;
  }

  const mapStatusToColumn = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'CLOSED' || s === 'RESOLVED') return 'done';
    if (s === 'IN_REVIEW') return 'code_review';
    if (s === 'IN_PROGRESS' || s === 'ASSIGNED') return 'in_progress';
    return 'todo';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Kanban size={20} color="#10b981" /> {board?.name || 'Project Kanban Board'}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configurable workflow board ({issues.length} active work items)</span>
        </div>
      </div>

      {/* Board Columns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, minmax(220px, 1fr))`, gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
        {columns.map((col) => {
          const colIssues = issues.filter(i => mapStatusToColumn(i.status) === col.id);
          return (
            <div key={col.id} className="glass-panel" style={{ borderRadius: '12px', padding: '0.85rem', background: 'rgba(0,0,0,0.15)', borderTop: `3px solid ${col.color}`, display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '450px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{col.name}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.5rem', borderRadius: '10px', color: 'var(--text-muted)' }}>
                  {colIssues.length}
                </span>
              </div>

              {/* Cards Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                {colIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => onSelectIssue && onSelectIssue(issue.id)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      background: 'var(--bg-card, #121824)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, border-color 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span style={{ fontWeight: 800, color: '#10b981' }}>#{issue.id}</span>
                      <span style={{ 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '4px', 
                        fontWeight: 700,
                        background: issue.severity === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: issue.severity === 'Critical' ? '#ef4444' : 'var(--text-muted)'
                      }}>
                        {issue.severity}
                      </span>
                    </div>

                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{issue.title}</h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-dim)', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-color)' }}>
                      <span>Assignee: {issue.assignee?.name || 'Unassigned'}</span>
                      <span style={{ fontWeight: 700, color: '#3b82f6' }}>{issue.story_points || 3} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
