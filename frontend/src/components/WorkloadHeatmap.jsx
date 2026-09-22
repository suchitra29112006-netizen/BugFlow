import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Users, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const WorkloadHeatmap = () => {
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const data = await api.getWorkloadHeatmap();
        setHeatmap(data);
      } catch (err) {
        console.error("Failed to load workload heatmap:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, []);

  if (loading) return <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading workload heatmap...</div>;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users size={18} color="#a855f7" />
        Team Workload Distribution Heatmap
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {(Array.isArray(heatmap) ? heatmap : []).map((dev) => {
          const isHigh = dev.workload_level === 'High';
          return (
            <div
              key={dev.developer_id}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.02)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{dev.developer_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dev.role}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isHigh ? '#ef4444' : '#10b981' }}>
                    {dev.active_assigned_bugs} Active Bugs
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {dev.resolved_bugs} Resolved
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 800,
                    background: isHigh ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: isHigh ? '#ef4444' : '#10b981'
                  }}
                >
                  {dev.workload_level}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
