import React, { useState, useEffect } from 'react';
import { Layers, Plus, Users, Bug, ShieldCheck, Activity, X } from 'lucide-react';
import { api } from '../services/api';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewDeptOpen, setIsNewDeptOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/departments');
      setDepartments(res || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/departments', {
        name: deptName,
        description: deptDesc
      });
      setDeptName('');
      setDeptDesc('');
      setIsNewDeptOpen(false);
      fetchDepartments();
    } catch (err) {
      alert("Failed to create department: " + (err.message || err));
    }
  };

  if (loading) {
    return <div style={{ padding: '2.5rem', color: 'var(--text-muted)' }}>Loading Organization Departments...</div>;
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Layers size={26} color="#10b981" /> Engineering Departments
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Organizational divisions grouping engineering squads, test teams, and product functions.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => setIsNewDeptOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> + New Department
        </button>
      </div>

      {/* Department Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {departments.map((dept) => (
          <div key={dept.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{dept.name}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{dept.squads_count} Squads • {dept.members_count} Members</span>
              </div>
              <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: dept.health_status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: dept.health_status === 'HEALTHY' ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                {dept.health_status}
              </span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{dept.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>Open Defects</span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{dept.open_bugs} Open</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>Critical</span>
                <strong style={{ fontSize: '1.05rem', color: dept.critical_bugs > 0 ? '#ef4444' : '#10b981' }}>{dept.critical_bugs} Critical</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Department Modal */}
      {isNewDeptOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Layers size={20} color="#10b981" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Create Department</h2>
              </div>
              <button onClick={() => setIsNewDeptOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDept} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Department Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Security & Compliance" value={deptName} onChange={e => setDeptName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Department scope and responsibilities..." value={deptDesc} onChange={e => setDeptDesc(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsNewDeptOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
