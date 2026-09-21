import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Plus, 
  AlertCircle, 
  TrendingUp, 
  Sparkles, 
  Wrench, 
  Search, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  X, 
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export function TechnicalDebtPage() {
  const [debtItems, setDebtItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Inputs
  const [module, setModule] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedEffort, setEstimatedEffort] = useState(16.0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [debtRes, projRes] = await Promise.all([
        api.get('/api/v1/knowledge-base/technical-debt'),
        api.get('/projects')
      ]);

      const items = Array.isArray(debtRes) ? debtRes : [];
      const projs = Array.isArray(projRes) ? projRes : [];

      setDebtItems(items);
      setProjects(projs);
      if (projs.length > 0 && !projectId) {
        setProjectId(projs[0].id);
      }
    } catch (err) {
      console.error("Failed to load technical debt data:", err);
      setDebtItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogDebt = async (e) => {
    e.preventDefault();
    if (!module || !description) return;
    setSubmitting(true);

    try {
      await api.post('/api/v1/knowledge-base/technical-debt', {
        project_id: projectId ? parseInt(projectId) : 1,
        module,
        description,
        estimated_effort_hours: parseFloat(estimatedEffort) || 16.0
      });

      // Reset form & reload
      setModule('');
      setDescription('');
      setEstimatedEffort(16.0);
      setIsLogModalOpen(false);
      fetchInitialData();
    } catch (err) {
      alert("Failed to log technical debt item: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (debtId, newStatus, e) => {
    e.stopPropagation();
    try {
      await api.put(`/api/v1/knowledge-base/technical-debt/${debtId}/status`, {
        status: newStatus
      });
      fetchInitialData();
    } catch (err) {
      alert("Failed to update status: " + (err.message || err));
    }
  };

  const handleDeleteDebt = async (debtId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this technical debt item?")) return;

    try {
      await api.delete(`/api/v1/knowledge-base/technical-debt/${debtId}`);
      fetchInitialData();
    } catch (err) {
      alert("Failed to delete debt item: " + (err.message || err));
    }
  };

  const filteredDebt = debtItems.filter((item) => {
    const matchesSearch = 
      !searchTerm ||
      item.module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  // Calculate top KPI statistics
  const totalHotspots = debtItems.length;
  const totalEffortHours = debtItems.reduce((acc, i) => acc + (i.estimated_effort_hours || 0), 0);
  const highImpactCount = debtItems.filter((i) => (i.impact_score || 0) > 60).length;
  const resolvedCount = debtItems.filter((i) => i.status === 'RESOLVED').length;

  if (loading) {
    return (
      <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Scanning Architectural Technical Debt Hotspots...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <Activity size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Technical Debt Radar</h1>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Identify architectural hot spots, refactoring effort estimates, and code quality friction scores.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsLogModalOpen(true)}
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', border: 'none' }}
        >
          <Plus size={16} /> Log Debt Item
        </button>
      </div>

      {/* KPI Stats Header Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <Activity size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', fontWeight: 600 }}>Total Debt Hotspots</span>
            <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalHotspots} Modules</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', fontWeight: 600 }}>Estimated Refactoring</span>
            <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b' }}>{totalEffortHours} Hours</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', fontWeight: 600 }}>High Impact (&gt;60%)</span>
            <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: highImpactCount > 0 ? '#ef4444' : '#10b981' }}>{highImpactCount} Critical</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', fontWeight: 600 }}>Resolved Refactoring</span>
            <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>{resolvedCount} Resolved</strong>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search hotspots by module or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.4rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, marginRight: '0.25rem' }}>Status Filter:</span>
          {['ALL', 'IDENTIFIED', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.35rem 0.7rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: statusFilter === st ? '#ef4444' : 'var(--border-color)',
                background: statusFilter === st ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: statusFilter === st ? '#ef4444' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {st === 'ALL' ? 'All Items' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Debt Grid */}
      {filteredDebt.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', borderRadius: '14px', color: 'var(--text-muted)' }}>
          <Wrench size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No technical debt items found</h3>
          <p style={{ fontSize: '0.88rem', margin: 0, color: 'var(--text-dim)' }}>Try adjusting search filters or log a new technical debt hotspot.</p>
          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
            className="btn-secondary"
            style={{ marginTop: '1rem', padding: '0.45rem 0.9rem', fontSize: '0.82rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
          {filteredDebt.map((item) => {
            const isHighImpact = item.impact_score > 60;
            const isResolved = item.status === 'RESOLVED';

            return (
              <div 
                key={item.id} 
                className="glass-panel" 
                style={{ 
                  padding: '1.4rem', 
                  borderRadius: '14px', 
                  border: isHighImpact && !isResolved ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-color)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justify: 'space-between', 
                  gap: '1rem',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block' }}>MODULE / ARCHITECTURE</span>
                      <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: '0.15rem 0 0 0', color: 'var(--text-primary)' }}>
                        {item.module}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '12px', 
                        background: isHighImpact ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                        color: isHighImpact ? '#ef4444' : '#f59e0b', 
                        fontWeight: 800 
                      }}>
                        Impact {item.impact_score}%
                      </span>
                      <button
                        onClick={(e) => handleDeleteDebt(item.id, e)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.2rem' }}
                        title="Delete Debt Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0.85rem 0 0 0', lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ paddingTop: '0.85rem', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Est. Refactoring: <strong style={{ color: 'var(--text-primary)' }}>{item.estimated_effort_hours}h</strong></span>
                    <span style={{ 
                      color: isResolved ? '#10b981' : (item.status === 'IN_PROGRESS' ? '#3b82f6' : '#f59e0b'), 
                      fontWeight: 700, 
                      fontSize: '0.75rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      background: isResolved ? 'rgba(16, 185, 129, 0.12)' : (item.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)')
                    }}>
                      {item.status}
                    </span>
                  </div>

                  {/* Quick Action Status Updater */}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {item.status !== 'IN_PROGRESS' && item.status !== 'RESOLVED' && (
                      <button
                        onClick={(e) => handleStatusChange(item.id, 'IN_PROGRESS', e)}
                        style={{ flex: 1, padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Start Refactoring
                      </button>
                    )}

                    {item.status !== 'RESOLVED' && (
                      <button
                        onClick={(e) => handleStatusChange(item.id, 'RESOLVED', e)}
                        style={{ flex: 1, padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Debt Item Modal */}
      {isLogModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '600px',
            borderRadius: '16px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card, #121824)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Activity size={20} color="#ef4444" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Log Technical Debt Hotspot</h2>
              </div>
              <button 
                onClick={() => setIsLogModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogDebt} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Target Module / Subsystem Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Authentication Middleware or DB Connection Pooler" 
                  value={module} 
                  onChange={(e) => setModule(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label>Associated Project</label>
                  <select 
                    className="form-select" 
                    value={projectId} 
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Est. Refactoring Effort (Hours)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={estimatedEffort} 
                    onChange={(e) => setEstimatedEffort(e.target.value)} 
                    min="1" 
                    step="1" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Architectural Friction & Impact Summary</label>
                <textarea 
                  className="form-textarea" 
                  rows={4} 
                  placeholder="Describe why this legacy code or architecture causes friction, delays, or bug clusters..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsLogModalOpen(false)} 
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submitting}
                  style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', cursor: 'pointer', background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', border: 'none' }}
                >
                  {submitting ? 'Logging...' : 'Log Debt Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
