import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { 
  Bug, AlertTriangle, CheckCircle2, FolderKanban, Users, TrendingUp, ShieldCheck, 
  ArrowRight, Award, Zap, Clock, ShieldAlert, Plus, Filter
} from 'lucide-react';
import { WorkloadHeatmap } from '../components/WorkloadHeatmap';

export const Dashboard = ({ onNavigateToIssues, onSelectIssue }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRoleTab, setActiveRoleTab] = useState('overview');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [data, gami] = await Promise.all([
          api.getDashboardStats(),
          api.getGamificationBadges()
        ]);
        setStats(data);
        setGamification(gami);

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
    { label: 'Total Bugs', count: stats?.total_issues || 0, icon: Bug, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    { label: 'Open Defect Queue', count: stats?.open_bugs || 0, icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    { label: 'Resolved Defects', count: stats?.resolved_bugs || 0, icon: CheckCircle2, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
    { label: 'Critical Blockers', count: stats?.critical_bugs || 0, icon: ShieldAlert, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
    { label: 'Active Projects', count: stats?.total_projects || 0, icon: FolderKanban, color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
    { label: 'Active Engineers', count: stats?.total_users || 0, icon: Users, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  ];

  const roleTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'reporter', label: 'My Reported', count: stats?.my_reported_count || 0 },
    { key: 'developer', label: 'Assigned to Me', count: stats?.my_assigned_count || 0 },
    { key: 'qa', label: 'In QA Testing', count: stats?.testing_bugs_count || 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader 
        title="Engineering Dashboard"
        subtitle={`Real-time telemetry, AI triage queue & engineering velocity for ${user?.full_name || 'User'}`}
        breadcrumbs={[
          { label: 'BugFlow' },
          { label: 'Workspace' },
          { label: 'Dashboard' }
        ]}
        tabs={roleTabs}
        activeTab={activeRoleTab}
        onTabChange={setActiveRoleTab}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {gamification && Array.isArray(gamification?.badges) && gamification.badges.length > 0 && (
              <div style={{ display: 'flex', gap: '0.35rem', marginRight: '0.5rem' }}>
                {gamification.badges.map((b, i) => (
                  <span key={i} className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }} title={b.description}>
                    <Award size={12} style={{ marginRight: '4px' }} /> {b.name}
                  </span>
                ))}
              </div>
            )}
            <button className="btn btn-secondary" onClick={() => onNavigateToIssues && onNavigateToIssues()}>
              <Filter size={14} /> View All Issues
            </button>
          </div>
        }
      />

      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{card.label}</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={card.color} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: card.color }}>{card.count}</div>
            </div>
          );
        })}
      </div>

      {/* Overview Tab Content */}
      {activeRoleTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem' }}>
          
          {/* Left Column: Recent Work & Defect Queue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={16} color="#10b981" /> Active Defect Triage Queue
                </h3>
                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => onNavigateToIssues && onNavigateToIssues()}>
                  View All <ArrowRight size={14} />
                </button>
              </div>

              {(stats?.my_reported_issues || stats?.my_assigned_issues || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No active high-priority defects requiring immediate action.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '0.6rem 0.8rem' }}>Severity</th>
                        <th style={{ padding: '0.6rem 0.8rem' }}>Title</th>
                        <th style={{ padding: '0.6rem 0.8rem' }}>Status</th>
                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats?.my_reported_issues || []).slice(0, 5).map((iss) => (
                        <tr key={iss.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => onSelectIssue && onSelectIssue(iss.id)}>
                          <td style={{ padding: '0.75rem 0.8rem' }}>
                            <span className={`badge badge-${iss.severity.toLowerCase()}`}>{iss.severity}</span>
                          </td>
                          <td style={{ padding: '0.75rem 0.8rem', fontWeight: 600 }}>{iss.title}</td>
                          <td style={{ padding: '0.75rem 0.8rem' }}>
                            <span className={`badge badge-${iss.status.toLowerCase().replace(' ', '-')}`}>{iss.status}</span>
                          </td>
                          <td style={{ padding: '0.75rem 0.8rem', textAlign: 'right' }}>
                            <ArrowRight size={14} color="var(--text-dim)" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Workload & Severity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <WorkloadHeatmap />

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={16} color="#10b981" /> Severity Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.entries(stats?.severity_distribution || {}).map(([sev, count]) => {
                  const total = stats?.total_issues || 1;
                  const pct = Math.round((count / total) * 100);
                  const colorMap = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#10b981' };
                  return (
                    <div key={sev}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>{sev}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: colorMap[sev] || '#10b981', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role View Tabs */}
      {activeRoleTab === 'reporter' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#34d399' }}>Bugs Reported by You ({stats?.my_reported_count || 0})</h3>
          {(stats?.my_reported_issues || []).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You haven't reported any bugs yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(stats?.my_reported_issues || []).map((iss) => (
                <div key={iss.id} className="glass-panel table-row-hover" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => onSelectIssue && onSelectIssue(iss.id)}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <span className={`badge badge-${iss.severity.toLowerCase()}`}>{iss.severity}</span>
                      <span className={`badge badge-${iss.status.toLowerCase().replace(' ', '-')}`}>{iss.status}</span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{iss.title}</h4>
                  </div>
                  <ArrowRight size={16} color="var(--text-dim)" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeRoleTab === 'developer' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#60a5fa' }}>Defects Assigned to You ({stats?.my_assigned_count || 0})</h3>
          {(stats?.my_assigned_issues || []).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No open defects currently assigned to you.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(stats?.my_assigned_issues || []).map((iss) => (
                <div key={iss.id} className="glass-panel table-row-hover" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => onSelectIssue && onSelectIssue(iss.id)}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <span className={`badge badge-${iss.severity.toLowerCase()}`}>{iss.severity}</span>
                      <span className={`badge badge-${iss.status.toLowerCase().replace(' ', '-')}`}>{iss.status}</span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{iss.title}</h4>
                  </div>
                  <ArrowRight size={16} color="var(--text-dim)" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeRoleTab === 'qa' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#f59e0b' }}>Bugs Pending QA Verification ({stats?.testing_bugs_count || 0})</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Check the Issues section for resolved bugs awaiting regression verification.</p>
        </div>
      )}

    </div>
  );
};
