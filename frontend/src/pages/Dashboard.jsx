import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Bug, AlertTriangle, CheckCircle2, FolderKanban, Users, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

export const Dashboard = ({ onNavigateToIssues, onSelectIssue }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRoleTab, setActiveRoleTab] = useState('overview');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
        if (data.user_role === 'Reporter') setActiveRoleTab('reporter');
        else if (data.user_role === 'Developer') setActiveRoleTab('developer');
        else if (data.user_role === 'QA') setActiveRoleTab('qa');
        else setActiveRoleTab('overview');
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics dashboard...</div>;
  }

  const metricCards = [
    { label: 'Total Bugs', count: stats?.total_issues || 0, icon: Bug, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    { label: 'Open Bugs', count: stats?.open_bugs || 0, icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    { label: 'Resolved Bugs', count: stats?.resolved_bugs || 0, icon: CheckCircle2, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    { label: 'Critical Bugs', count: stats?.critical_bugs || 0, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    { label: 'Active Projects', count: stats?.total_projects || 0, icon: FolderKanban, color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
    { label: 'Team Members', count: stats?.total_users || 0, icon: Users, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <ShieldCheck size={14} /> Role: {user?.role} Workspace
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>BugFlow Command Center</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Real-time defect analytics, AI triage & role-customized issue tracking.</p>
        </div>
      </div>

      {/* Role Navigation Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          className={`btn ${activeRoleTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveRoleTab('overview')}
        >
          Overview (Everything)
        </button>
        <button
          className={`btn ${activeRoleTab === 'reporter' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveRoleTab('reporter')}
        >
          My Reported Bugs ({stats?.my_reported_count || 0})
        </button>
        <button
          className={`btn ${activeRoleTab === 'developer' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveRoleTab('developer')}
        >
          Assigned to Me ({stats?.my_assigned_count || 0})
        </button>
        <button
          className={`btn ${activeRoleTab === 'qa' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveRoleTab('qa')}
        >
          Testing Bugs ({stats?.testing_bugs_count || 0})
        </button>
      </div>

      {/* Role View: Reporter (My Bugs) */}
      {activeRoleTab === 'reporter' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#34d399' }}>Bugs Reported by You ({stats?.my_reported_count})</h3>
          {stats?.my_reported_issues?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>You haven't reported any bugs yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats?.my_reported_issues.map((iss) => (
                <div key={iss.id} className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => onSelectIssue(iss.id)}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className={`badge badge-${iss.severity.toLowerCase()}`}>{iss.severity}</span>
                      <span className={`badge badge-${iss.status.toLowerCase().replace(' ', '-')}`}>{iss.status}</span>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{iss.title}</h4>
                  </div>
                  <ArrowRight size={16} color="var(--text-dim)" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role View: Developer (Assigned Bugs) */}
      {activeRoleTab === 'developer' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#fb923c' }}>Bugs Assigned to You ({stats?.my_assigned_count})</h3>
          {stats?.my_assigned_issues?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No bugs currently assigned to you.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats?.my_assigned_issues.map((iss) => (
                <div key={iss.id} className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => onSelectIssue(iss.id)}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className={`badge badge-${iss.severity.toLowerCase()}`}>{iss.severity}</span>
                      <span className={`badge badge-${iss.status.toLowerCase().replace(' ', '-')}`}>{iss.status}</span>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{iss.title}</h4>
                  </div>
                  <ArrowRight size={16} color="var(--text-dim)" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role View: QA (Testing Bugs) */}
      {activeRoleTab === 'qa' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#38bdf8' }}>Bugs Pending QA Verification ({stats?.testing_bugs_count})</h3>
          {stats?.testing_issues?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No bugs pending verification.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats?.testing_issues.map((iss) => (
                <div key={iss.id} className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => onSelectIssue(iss.id)}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className={`badge badge-${iss.severity.toLowerCase()}`}>{iss.severity}</span>
                      <span className={`badge badge-${iss.status.toLowerCase().replace(' ', '-')}`}>{iss.status}</span>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{iss.title}</h4>
                  </div>
                  <ArrowRight size={16} color="var(--text-dim)" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overview Mode: Metric Cards Grid */}
      {activeRoleTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {metricCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{card.label}</span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={card.color} />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: card.color }}>{card.count}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Severity Distribution */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="#10b981" />
                Severity Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(stats?.severity_distribution || {}).map(([sev, count]) => {
                  const total = stats?.total_issues || 1;
                  const pct = Math.round((count / total) * 100);
                  const colorMap = {
                    Critical: 'var(--severity-critical)',
                    High: 'var(--severity-high)',
                    Medium: 'var(--severity-medium)',
                    Low: 'var(--severity-low)',
                  };
                  return (
                    <div key={sev}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600 }}>{sev}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: colorMap[sev] || '#10b981', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workflow Status Distribution */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bug size={18} color="#f97316" />
                Workflow Status Distribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.entries(stats?.status_distribution || {}).map(([st, count]) => (
                  <div key={st} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span className={`badge badge-${st.toLowerCase().replace(' ', '-')}`}>{st}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
