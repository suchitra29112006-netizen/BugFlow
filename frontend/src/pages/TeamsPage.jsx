import React, { useState, useEffect } from 'react';
import { Users, Plus, Sparkles, Activity, ShieldCheck, Zap, AlertTriangle, ChevronRight, X } from 'lucide-react';
import { api } from '../services/api';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewTeamOpen, setIsNewTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [deptId, setDeptId] = useState('');

  // AI Workload Insights
  const [aiInsight, setAiInsight] = useState(null);

  useEffect(() => {
    fetchTeamsAndDepts();
  }, []);

  const fetchTeamsAndDepts = async () => {
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([
        api.getTeams().catch(() => []),
        api.get('/api/v1/departments').catch(() => [])
      ]);
      setTeams(tRes || []);
      setDepartments(dRes || []);
    } catch (err) {
      console.error("Failed to load teams:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.createTeam({
        name: teamName,
        description: teamDesc,
        department_id: deptId ? parseInt(deptId) : (departments[0]?.id || 1)
      });
      setTeamName('');
      setTeamDesc('');
      setIsNewTeamOpen(false);
      fetchTeamsAndDepts();
    } catch (err) {
      alert("Failed to create team: " + (err.message || err));
    }
  };

  if (loading) {
    return <div style={{ padding: '2.5rem', color: 'var(--text-muted)' }}>Loading Teams & Squads Capacity Hub...</div>;
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Users size={26} color="#10b981" /> Engineering Teams & Squads
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Cross-functional squads, velocity benchmarks, and AI team capacity monitoring.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => setIsNewTeamOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> + New Squad
        </button>
      </div>

      {/* AI Team Workload Intelligence Banner */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <strong style={{ color: '#10b981', fontSize: '0.95rem', display: 'block' }}>AI Team Capacity Insight</strong>
            <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>Backend Squad capacity is at 82%. 2 members are approaching overload thresholds.</span>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={() => alert("AI Task Rebalancing initiated!")} style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}>
          Rebalance Tasks →
        </button>
      </div>

      {/* Squad Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {teams.map((t) => (
          <div key={t.id} className="glass-panel" style={{ padding: '1.4rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{t.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Lead: {t.lead?.name || 'Unassigned'} • {t.members?.length || 3} Members</span>
              </div>
              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                ACTIVE
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{t.description || 'Engineering squad'}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
              <span>Members: <strong>{t.members?.length || 3}</strong></span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>Velocity: 42 pts (+10.5%)</span>
            </div>
          </div>
        ))}
      </div>

      {/* New Squad Modal */}
      {isNewTeamOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Users size={20} color="#10b981" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Create Squad</h2>
              </div>
              <button onClick={() => setIsNewTeamOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Squad Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Core API Squad" value={teamName} onChange={e => setTeamName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select className="form-select" value={deptId} onChange={e => setDeptId(e.target.value)}>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Squad mandate and scope..." value={teamDesc} onChange={e => setTeamDesc(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsNewTeamOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Squad</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
