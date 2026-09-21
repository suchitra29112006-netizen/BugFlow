import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Target, Plus, CheckCircle2, Calendar, FolderKanban } from 'lucide-react';

export const Milestones = ({ projects }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [dueDate, setDueDate] = useState('');

  const fetchMilestones = async () => {
    try {
      const data = await api.getMilestones();
      setMilestones(data);
    } catch (err) {
      console.error("Failed to load milestones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await api.createMilestone({
        name,
        description,
        project_id: parseInt(projectId),
        due_date: dueDate ? new Date(dueDate).toISOString() : null
      });
      setName('');
      setDescription('');
      setIsModalOpen(false);
      fetchMilestones();
    } catch (err) {
      alert("Failed to create milestone: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading milestones...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Project Milestones & Release Targets</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Track target release completion percentages and milestone goals.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Milestone
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {milestones.map((m) => (
          <div key={m.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                  <Target size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {m.status}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{m.name}</h3>
              </div>
            </div>

            {m.description && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{m.description}</p>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>Release Progress ({m.completed_issues}/{m.total_issues} Resolved)</span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>{m.progress_percentage}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${m.progress_percentage}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <span>Target: {m.due_date ? new Date(m.due_date).toLocaleDateString() : 'No date set'}</span>
              <span>Created {new Date(m.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Create Release Milestone</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Milestone Name</label>
                <input type="text" className="form-input" placeholder="e.g. Authentication Release v1.0" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Goal and scope of this release..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Target Project</label>
                <select className="form-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Target Due Date</label>
                <input type="date" className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
