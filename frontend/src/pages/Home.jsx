import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Bug, AlertTriangle, Clock, CheckCircle2, ShieldAlert, ArrowRight, Activity, Calendar } from 'lucide-react';

export const Home = ({ onSelectIssue }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [dashData, issData] = await Promise.all([
          api.getDashboardStats(),
          api.getIssues({ assigned_to: user?.id })
        ]);
        setStats(dashData);
        setMyIssues(issData);
      } catch (err) {
        console.error("Failed to load home widgets:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchHomeData();
  }, [user]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading personal workspace...</div>;

  const openCount = myIssues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length;
  const criticalCount = myIssues.filter(i => i.severity === 'Critical').length;
  const overdueCount = myIssues.filter(i => i.is_overdue).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Personalized Header Banner */}
      <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.12) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900 }}>{getTimeGreeting()}, {user?.name} 👋</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem', fontSize: '0.95rem' }}>
            Welcome to your BugFlow Command Portal. Here is your personal work summary for today.
          </p>
        </div>
        <div className="badge badge-low" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
          Role: {user?.role}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>My Open Bugs</span>
            <Bug size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981' }}>{openCount}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Critical Bugs</span>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ef4444' }}>{criticalCount}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Overdue</span>
            <Clock size={20} color="#f97316" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f97316' }}>{overdueCount}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Resolved This Week</span>
            <CheckCircle2 size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#3b82f6' }}>{stats?.resolved_bugs || 0}</div>
        </div>

      </div>

      {/* Main Work & Activity Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
        
        {/* Left: My Work Assigned List */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
            <Bug size={18} /> My Work & Assigned Defects ({myIssues.length})
          </h3>

          {myIssues.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active defects currently assigned to you. Enjoy your clean queue!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myIssues.map(iss => (
                <div
                  key={iss.id}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => onSelectIssue(iss.id)}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className={`badge badge-${iss.severity.toLowerCase()}`}>{iss.severity}</span>
                      <span className={`badge badge-${iss.status.toLowerCase().replace(' ', '-')}`}>{iss.status}</span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>#{iss.id} {iss.title}</h4>
                  </div>
                  <ArrowRight size={16} color="var(--text-dim)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Workspace Activity Feed */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f97316' }}>
            <Activity size={18} /> Recent Workspace Stream
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ borderLeft: '2px solid #10b981', paddingLeft: '0.75rem' }}>
              <div style={{ fontWeight: 700 }}>AI Auto-Triage Completed</div>
              <div style={{ color: 'var(--text-muted)' }}>Classified new authentication defect as High Severity</div>
            </div>
            <div style={{ borderLeft: '2px solid #3b82f6', paddingLeft: '0.75rem' }}>
              <div style={{ fontWeight: 700 }}>QA Verified Fix</div>
              <div style={{ color: 'var(--text-muted)' }}>Issue #3 verified and moved to Resolved</div>
            </div>
            <div style={{ borderLeft: '2px solid #a855f7', paddingLeft: '0.75rem' }}>
              <div style={{ fontWeight: 700 }}>Sprint 04 Milestone Target</div>
              <div style={{ color: 'var(--text-muted)' }}>78% of sprint milestone target reached</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
