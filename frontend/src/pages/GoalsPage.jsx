import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle2, AlertTriangle, TrendingUp, Sparkles, FolderKanban, X } from 'lucide-react';
import { api } from '../services/api';

export function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Goal Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetMetric, setTargetMetric] = useState('Reduce defects by 30%');
  const [deadlineDays, setDeadlineDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await api.get('/api/v1/goals');
      setGoals(res);
    } catch (err) {
      console.error("Failed to load goals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/api/v1/goals', {
        title: title.trim(),
        description: description.trim(),
        target_metric: targetMetric.trim(),
        deadline_days: parseInt(deadlineDays, 10) || 30
      });
      setTitle('');
      setDescription('');
      setIsModalOpen(false);
      fetchGoals();
    } catch (err) {
      alert("Failed to create goal: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading Goals & OKRs...</div>;
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Goals & OKRs</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Connect high-level engineering objectives to projects, sprints, tasks, and defect metrics.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> New Engineering Goal
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {goals.map((g) => (
          <div key={g.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: g.status === 'AT_RISK' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: g.status === 'AT_RISK' ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{g.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>{g.description}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', borderRadius: '20px', background: g.status === 'AT_RISK' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: g.status === 'AT_RISK' ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                  {g.status.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{g.current_progress}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ height: '8px', width: '100%', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${g.current_progress}%`, background: g.status === 'AT_RISK' ? '#f59e0b' : 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--text-dim)', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
              <div>Target Metric: <strong style={{ color: 'var(--text-primary)' }}>{g.target_metric}</strong></div>
              <div>Owner: <strong style={{ color: 'var(--text-primary)' }}>{g.owner_name}</strong></div>
              <div>Linked Projects: <strong style={{ color: '#3b82f6' }}>{g.linked_projects.join(', ') || 'BugFlow Core'}</strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* New Engineering Goal Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1.5rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={22} />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>New Engineering Goal</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Goal Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Sub-2 Hour Incident Resolution SLA" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Target Metric</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. < 2h Resolution SLA" 
                  value={targetMetric} 
                  onChange={e => setTargetMetric(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Description & Objectives</label>
                <textarea 
                  className="form-textarea" 
                  rows={3} 
                  placeholder="Describe target outcomes, quality metrics, and milestone goals..." 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Target Deadline (Days)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={deadlineDays} 
                  onChange={e => setDeadlineDays(e.target.value)} 
                  min={7} 
                  max={365} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating Goal...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
