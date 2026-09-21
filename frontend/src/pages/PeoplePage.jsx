import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  Award, 
  Code, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  AlertTriangle, 
  Briefcase, 
  Cpu, 
  ExternalLink, 
  X,
  Mail,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';

export function PeoplePage() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPerson, setSelectedPerson] = useState(null);

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/v1/people');
      if (Array.isArray(res)) {
        setPeople(res);
      } else {
        setPeople([]);
      }
    } catch (err) {
      console.error("Failed to load people directory:", err);
      setError(err.message || "Failed to connect to People Directory API.");
      setPeople([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter people list based on search and selected pills
  const filteredPeople = people.filter((p) => {
    const matchesSearch = 
      !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.skills && p.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesRole = roleFilter === 'ALL' || p.role?.toUpperCase() === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || p.workload?.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate top KPI statistics
  const totalCount = people.length;
  const overloadedCount = people.filter((p) => p.workload?.status === 'OVERLOADED').length;
  const totalOpenBugs = people.reduce((acc, p) => acc + (p.workload?.open_bugs || 0), 0);
  const avgWorkload = totalCount > 0 
    ? Math.round(people.reduce((acc, p) => acc + (p.workload?.workload_pct || 0), 0) / totalCount) 
    : 0;

  if (loading) {
    return (
      <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Analyzing engineering workload & skill matrix...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Users size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>People & Workload Directory</h1>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Transparent engineering capacity, skill matrix, and active defect allocations (non-surveillance).
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchPeople}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <Activity size={16} /> Sync Capacity Data
        </button>
      </div>

      {/* KPI Stats Header Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <Users size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', fontWeight: 600 }}>Total Team Members</span>
            <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalCount} Active</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <Activity size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', fontWeight: 600 }}>Avg Team Capacity</span>
            <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: avgWorkload > 80 ? '#ef4444' : '#10b981' }}>{avgWorkload}% Allocated</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: overloadedCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)', color: overloadedCount > 0 ? '#ef4444' : '#10b981' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', fontWeight: 600 }}>Overloaded Engineers</span>
            <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: overloadedCount > 0 ? '#ef4444' : '#10b981' }}>{overloadedCount} Members</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
            <Briefcase size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', fontWeight: 600 }}>Active Assigned Defects</span>
            <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalOpenBugs} Defects</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search by name, email, role, or skill..."
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

        {/* Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, marginRight: '0.25rem' }}>Role:</span>
          {['ALL', 'DEVELOPER', 'QA', 'ADMIN', 'REPORTER'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: roleFilter === r ? '#10b981' : 'var(--border-color)',
                background: roleFilter === r ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: roleFilter === r ? '#10b981' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}

          <div style={{ height: '18px', width: '1px', background: 'var(--border-color)', margin: '0 0.25rem' }} />

          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, marginRight: '0.25rem' }}>Workload:</span>
          {['ALL', 'OVERLOADED', 'OPTIMAL', 'AVAILABLE'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: statusFilter === s ? (s === 'OVERLOADED' ? '#ef4444' : '#10b981') : 'var(--border-color)',
                background: statusFilter === s ? (s === 'OVERLOADED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)') : 'transparent',
                color: statusFilter === s ? (s === 'OVERLOADED' ? '#ef4444' : '#10b981') : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {s === 'ALL' ? 'All Capacity' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* People Directory Grid */}
      {filteredPeople.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', borderRadius: '14px', color: 'var(--text-muted)' }}>
          <Users size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No team members match search filters</h3>
          <p style={{ fontSize: '0.88rem', margin: 0, color: 'var(--text-dim)' }}>Try clearing your search query or selecting a different role/workload filter.</p>
          <button
            onClick={() => { setSearchTerm(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
            className="btn-secondary"
            style={{ marginTop: '1rem', padding: '0.45rem 0.9rem', fontSize: '0.82rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredPeople.map((p) => {
            const isOverloaded = p.workload?.status === 'OVERLOADED';
            const capacityPct = p.workload?.workload_pct || 0;
            const initials = p.name ? p.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

            return (
              <div 
                key={p.id} 
                className="glass-panel" 
                style={{ 
                  padding: '1.4rem', 
                  borderRadius: '14px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem',
                  border: isOverloaded ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Header Row: Avatar, Name, Workload Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ 
                    width: '46px', 
                    height: '46px', 
                    borderRadius: '50%', 
                    background: isOverloaded 
                      ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' 
                      : 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyIn: 'center', 
                    color: '#fff', 
                    fontWeight: 800, 
                    fontSize: '1rem',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.role}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>•</span>
                      <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>{p.team}</span>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    padding: '0.2rem 0.55rem', 
                    borderRadius: '20px', 
                    background: isOverloaded ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)', 
                    color: isOverloaded ? '#ef4444' : '#10b981', 
                    fontWeight: 800,
                    letterSpacing: '0.4px',
                    flexShrink: 0
                  }}>
                    {p.workload?.status || 'AVAILABLE'}
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                    <span>Workload Allocation</span>
                    <strong style={{ color: isOverloaded ? '#ef4444' : '#10b981' }}>{capacityPct}% Capacity</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, capacityPct)}%`, 
                      height: '100%', 
                      background: isOverloaded ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #10b981)',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Skill Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {p.skills && p.skills.map((skill, i) => (
                    <span key={i} style={{ 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-muted)', 
                      fontSize: '0.72rem', 
                      padding: '0.18rem 0.55rem', 
                      borderRadius: '6px',
                      fontWeight: 500
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Workload Summary Box */}
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  padding: '0.85rem 1rem', 
                  borderRadius: '10px', 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '0.75rem', 
                  fontSize: '0.8rem',
                  border: '1px solid rgba(255, 255, 255, 0.03)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>Active Bugs</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>{p.workload?.open_bugs || 0} Active</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>Critical Defects</span>
                    <strong style={{ color: (p.workload?.critical_bugs || 0) > 0 ? '#ef4444' : '#10b981', fontSize: '0.92rem' }}>
                      {p.workload?.critical_bugs || 0} Critical
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>Fixed This Sprint</span>
                    <strong style={{ color: '#10b981', fontSize: '0.92rem' }}>{p.workload?.completed_sprint || 0} Resolved</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>Contact</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {p.email}
                    </span>
                  </div>
                </div>

                {/* Inspect Button */}
                <button
                  onClick={() => setSelectedPerson(p)}
                  className="btn-secondary"
                  style={{
                    marginTop: '0.2rem',
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.04)'
                  }}
                >
                  <Cpu size={14} /> Inspect Profile & Workload
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Engineer Detail Modal */}
      {selectedPerson && (
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
            maxWidth: '560px',
            borderRadius: '16px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card, #121824)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800
                }}>
                  {selectedPerson.name.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{selectedPerson.name}</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedPerson.role} • {selectedPerson.team}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPerson(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>Email Address</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedPerson.email}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>Current Capacity Status</span>
                <strong style={{ color: selectedPerson.workload?.status === 'OVERLOADED' ? '#ef4444' : '#10b981' }}>
                  {selectedPerson.workload?.status} ({selectedPerson.workload?.workload_pct}%)
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>Assigned Active Bugs</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedPerson.workload?.open_bugs} Defects</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>Critical Defects</span>
                <strong style={{ color: (selectedPerson.workload?.critical_bugs || 0) > 0 ? '#ef4444' : '#10b981' }}>
                  {selectedPerson.workload?.critical_bugs} Critical
                </strong>
              </div>
            </div>

            {/* Skills Matrix */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={16} style={{ color: '#10b981' }} /> Verified Skill Profile
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {selectedPerson.skills?.map((s, idx) => (
                  <span key={idx} style={{ padding: '0.25rem 0.65rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Non-Surveillance Notice */}
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.78rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={18} style={{ flexShrink: 0 }} />
              <span>Workload transparency algorithm calculates capacity based strictly on open issue complexity and SLA urgency (no keyboard tracking or intrusive surveillance).</span>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setSelectedPerson(null)}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close Directory Drawer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
