import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { History, User, Clock, ArrowRight } from 'lucide-react';

export const ActivityTimeline = ({ issueId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.getIssueActivityLog(issueId);
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch activity log:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [issueId]);

  if (loading) return <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading audit history...</div>;

  return (
    <div className="glass-panel" style={{ padding: '1.75rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
        <History size={18} />
        Activity Audit Log & History Timeline ({logs.length})
      </h3>

      {logs.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No field update records captured yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', borderLeft: '2px solid var(--border-color)', paddingLeft: '1.25rem', marginLeft: '0.5rem' }}>
          {logs.map((log) => (
            <div key={log.id} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-1.65rem', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <span>{log.user?.name || 'User'}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>changed</span>
                <span style={{ color: '#f97316', fontWeight: 700 }}>{log.field_changed}</span>
              </div>
              
              {log.old_value && log.new_value && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <span style={{ background: 'rgba(0,0,0,0.04)', padding: '1px 6px', borderRadius: '4px' }}>{log.old_value}</span>
                  <ArrowRight size={12} />
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>{log.new_value}</span>
                </div>
              )}

              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={10} /> {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
