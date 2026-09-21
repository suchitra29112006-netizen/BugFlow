import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LayoutGrid, Flame, AlertTriangle, CheckCircle2, Clock, ArrowUpDown, Filter, UserCheck, ShieldCheck } from 'lucide-react';

export const TeamWorkload = () => {
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('active_issues'); // 'active_issues' | 'capacity_percentage' | 'name'
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchWorkloads = async () => {
    setLoading(true);
    try {
      const data = await api.getTeamWorkloadSummary();
      setWorkloads(data);
    } catch (err) {
      console.error("Failed to load workload summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloads();
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedWorkloads = [...workloads].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-low" style={{ background: '#3b82f6', color: '#fff', fontWeight: 800 }}>
              TEAM CAPACITY MATRIX
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Smart Team Workload Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Real-time active defects distribution, capacity indicators (🟢 82% | 🟡 65% | 🔴 25%), and availability status.
          </p>
        </div>

        <button className="btn btn-primary" onClick={fetchWorkloads}>
          Refresh Workload Matrix
        </button>
      </div>

      {/* Workload Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Team Workload Matrix...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  Developer / QA Member <ArrowUpDown size={12} />
                </th>
                <th style={{ padding: '0.85rem' }}>Role</th>
                <th style={{ padding: '0.85rem', cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('active_issues')}>
                  Active Issues <ArrowUpDown size={12} />
                </th>
                <th style={{ padding: '0.85rem', textAlign: 'center' }}>Critical / High</th>
                <th style={{ padding: '0.85rem', textAlign: 'center' }}>In Progress</th>
                <th style={{ padding: '0.85rem', cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('capacity_percentage')}>
                  Capacity Score <ArrowUpDown size={12} />
                </th>
                <th style={{ padding: '0.85rem', textAlign: 'center' }}>Availability</th>
              </tr>
            </thead>
            <tbody>
              {sortedWorkloads.map((w) => {
                let badgeBg = 'rgba(16, 185, 129, 0.15)';
                let badgeColor = '#10b981';
                let indicatorEmoji = '🟢';

                if (w.status_indicator === 'YELLOW') {
                  badgeBg = 'rgba(245, 158, 11, 0.15)';
                  badgeColor = '#f59e0b';
                  indicatorEmoji = '🟡';
                } else if (w.status_indicator === 'RED') {
                  badgeBg = 'rgba(239, 68, 68, 0.15)';
                  badgeColor = '#ef4444';
                  indicatorEmoji = '🔴';
                }

                return (
                  <tr key={w.user_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem', fontWeight: 700 }}>
                      {w.name}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>{w.email}</span>
                    </td>

                    <td style={{ padding: '0.85rem' }}>
                      <span className={`badge badge-${w.role.toLowerCase()}`}>{w.role}</span>
                    </td>

                    <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', color: w.active_issues > 6 ? '#ef4444' : '#10b981' }}>
                      {w.active_issues} issues
                    </td>

                    <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                      <span style={{ color: w.critical_issues > 0 ? '#ef4444' : 'var(--text-main)', fontWeight: 700 }}>
                        {w.critical_issues} Critical / {w.high_issues} High
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 700, color: '#3b82f6' }}>
                      {w.in_progress_issues} In Progress
                    </td>

                    <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                      <span style={{ background: badgeBg, color: badgeColor, padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        {indicatorEmoji} {w.capacity_percentage}% Capacity
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 700, color: w.availability_status === 'Available' ? '#10b981' : '#f97316' }}>
                      {w.availability_status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

      </div>

    </div>
  );
};
