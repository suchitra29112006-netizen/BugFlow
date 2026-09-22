import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Users, 
  Bug, 
  ShieldCheck, 
  Activity, 
  X, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  Building2, 
  FolderKanban, 
  Clock, 
  Globe, 
  UserCheck, 
  AlertTriangle,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function DepartmentsPage({ onNavigate }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  
  // New Department Modal
  const [isNewDeptOpen, setIsNewDeptOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptType, setDeptType] = useState('Engineering');
  const [deptTimezone, setDeptTimezone] = useState('UTC (Coordinated Universal Time)');
  const [deptHours, setDeptHours] = useState('09:00 - 18:00 MON-FRI');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, [search, selectedCategory, sortBy]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.getDepartments({
        search,
        category: selectedCategory,
        sort_by: sortBy
      });
      setDepartments(res || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newDept = await api.createDepartment({
        name: deptName,
        code: deptCode || deptName.slice(0, 3).toUpperCase(),
        description: deptDesc,
        department_type: deptType,
        timezone: deptTimezone,
        working_hours: deptHours
      });
      
      setDeptName('');
      setDeptCode('');
      setDeptDesc('');
      setIsNewDeptOpen(false);
      
      if (onNavigate && newDept?.id) {
        onNavigate('department_detail', newDept.id);
      } else {
        fetchDepartments();
      }
    } catch (err) {
      alert("Failed to create department: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { id: 'All', label: 'All' },
    { id: 'Engineering', label: 'Engineering' },
    { id: 'QA', label: 'QA & Quality' },
    { id: 'Product', label: 'Product & Design' },
    { id: 'DevOps', label: 'DevOps & Security' },
    { id: 'Data', label: 'Data & AI' },
    { id: 'Other', label: 'Other' }
  ];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Layers size={28} color="#10b981" /> Engineering Departments
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Organizational divisions grouping engineering squads, test teams, product functions, and operational teams.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => setIsNewDeptOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem' }}
        >
          <Plus size={18} /> + New Department
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text"
              className="form-input"
              placeholder="Search departments by name, code, description, lead, squad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '38px', width: '100%', height: '42px', fontSize: '0.9rem' }}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={16} color="var(--text-dim)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort by:</span>
            <select 
              className="form-select" 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              style={{ height: '42px', fontSize: '0.88rem', fontWeight: 600 }}
            >
              <option value="name">Name</option>
              <option value="members">Members Count</option>
              <option value="squads">Squads Count</option>
              <option value="open_defects">Open Defects</option>
              <option value="critical_defects">Critical Defects</option>
              <option value="health">Health Rating</option>
              <option value="recently_created">Recently Created</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.35rem' }}>
            Categories:
          </span>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  border: isActive ? '1px solid #10b981' : '1px solid var(--border-color)',
                  background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#10b981' : 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: 'var(--text-muted)' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading Department Intelligence Matrix...</p>
        </div>
      ) : departments.length === 0 ? (
        /* Empty State */
        <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>No Departments Found</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.4rem', maxWidth: '460px' }}>
              No organizational departments match your current filter or query criteria. Create a department to group squads and track defect analytics.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsNewDeptOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <Plus size={18} /> Create First Department
          </button>
        </div>
      ) : (
        /* Department Cards Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.35rem' }}>
          {departments.map((dept) => {
            const isHealthy = dept.health_status === 'HEALTHY';
            const isCritical = dept.health_status === 'CRITICAL';

            return (
              <div
                key={dept.id}
                className="glass-panel"
                onClick={() => onNavigate && onNavigate('department_detail', dept.id)}
                style={{
                  padding: '1.6rem',
                  borderRadius: '16px',
                  border: isCritical ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-color)',
                  background: isCritical 
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(18, 24, 36, 0.95) 100%)' 
                    : 'var(--bg-card, #121824)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.1rem', flexShrink: 0, boxShadow: '0 6px 14px rgba(16, 185, 129, 0.25)' }}>
                      {dept.code || dept.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{dept.name}</h3>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)', fontWeight: 700 }}>
                          {dept.code}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <UserCheck size={14} color="#10b981" /> Lead: <strong style={{ color: 'var(--text-primary)' }}>{dept.lead_name || 'Priya Sharma'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Health Badge */}
                  <span style={{ 
                    fontSize: '0.72rem', 
                    padding: '0.25rem 0.65rem', 
                    borderRadius: '12px', 
                    background: isHealthy ? 'rgba(16, 185, 129, 0.15)' : isCritical ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)', 
                    color: isHealthy ? '#10b981' : isCritical ? '#ef4444' : '#f59e0b', 
                    fontWeight: 800, 
                    letterSpacing: '0.5px' 
                  }}>
                    {dept.health_status}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45, minHeight: '38px' }}>
                  {dept.description}
                </p>

                {/* Organizational Structure Pills */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                    <Layers size={14} color="#10b981" /> <strong>{dept.squads_count}</strong> Squads
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                    <Users size={14} color="#3b82f6" /> <strong>{dept.members_count}</strong> Members
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                    <FolderKanban size={14} color="#a855f7" /> <strong>{dept.active_projects_count}</strong> Projects
                  </span>
                </div>

                {/* Metrics Breakdown Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', background: 'rgba(0,0,0,0.25)', padding: '0.85rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Open Defects</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{dept.open_bugs}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Critical</span>
                    <strong style={{ fontSize: '1.1rem', color: dept.critical_bugs > 0 ? '#ef4444' : '#10b981' }}>{dept.critical_bugs}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>SLA Breaches</span>
                    <strong style={{ fontSize: '1.1rem', color: dept.sla_violations > 0 ? '#ef4444' : '#10b981' }}>{dept.sla_violations}</strong>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Zap size={14} color="#10b981" /> Active Sprints: {dept.active_sprints_count}
                  </span>
                  <button 
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigate) onNavigate('department_detail', dept.id);
                    }}
                    style={{ fontSize: '0.8rem', fontWeight: 800, padding: '0.35rem 0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    View Department <ChevronRight size={14} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* New Department Modal */}
      {isNewDeptOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', borderRadius: '16px', padding: '1.85rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>New Department</h2>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Group engineering squads, test teams, and product functions</span>
                </div>
              </div>
              <button onClick={() => setIsNewDeptOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDept} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label>Department Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. AI & Data Intelligence" 
                    value={deptName} 
                    onChange={e => setDeptName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. AIDATA" 
                    value={deptCode} 
                    onChange={e => setDeptCode(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label>Department Type</label>
                  <select className="form-select" value={deptType} onChange={e => setDeptType(e.target.value)}>
                    <option value="Engineering">Engineering</option>
                    <option value="QA & Quality">QA & Quality</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="DevOps & Security">DevOps & Security</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Operations">Operations</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Timezone</label>
                  <input type="text" className="form-input" value={deptTimezone} onChange={e => setDeptTimezone(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Working Hours</label>
                <input type="text" className="form-input" value={deptHours} onChange={e => setDeptHours(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="form-textarea" 
                  rows={3} 
                  placeholder="Mandate, responsibilities, and architecture domains covered by this department..." 
                  value={deptDesc} 
                  onChange={e => setDeptDesc(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsNewDeptOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ fontWeight: 800 }}>
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
