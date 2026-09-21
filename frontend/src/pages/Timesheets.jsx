import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Clock, Play, Pause, Square, FileText, User } from 'lucide-react';

export const Timesheets = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const data = await api.getTimeEntries();
        setEntries(data);
      } catch (err) {
        console.error("Failed to load time entries:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading timesheets...</div>;

  const totalHours = entries.reduce((sum, e) => sum + (e.hours_logged || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Bug Timesheets & Work Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Track engineering time spent per defect and developer work logs.</p>
        </div>

        <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL LOGGED TIME: </span>
          <strong style={{ fontSize: '1.1rem', color: '#3b82f6' }}>{totalHours.toFixed(1)} Hours</strong>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {entries.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No time logged yet. Use the live timer on any issue page to log work.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <th style={{ padding: '0.75rem' }}>Issue</th>
                <th style={{ padding: '0.75rem' }}>Developer</th>
                <th style={{ padding: '0.75rem' }}>Hours Logged</th>
                <th style={{ padding: '0.75rem' }}>Work Notes</th>
                <th style={{ padding: '0.75rem' }}>Date Logged</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{e.issue_id} {e.issue_title}</td>
                  <td style={{ padding: '0.75rem' }}>{e.user_name}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 800, color: '#3b82f6' }}>{e.hours_logged}h</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{e.note || 'Regular work session'}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{new Date(e.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
