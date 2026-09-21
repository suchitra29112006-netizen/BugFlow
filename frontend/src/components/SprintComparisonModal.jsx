import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Layers, X, TrendingUp, CheckCircle2, ShieldCheck } from 'lucide-react';

export const SprintComparisonModal = ({ isOpen, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await api.compareSprints();
      setData(res.sprints_comparison || []);
    } catch (err) {
      console.error("Failed to compare sprints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComparison();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '850px', width: '92%', padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={20} color="#10b981" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900 }}>Sprint Performance Comparison Matrix</h2>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading sprint comparison metrics...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem' }}>Metric / Feature</th>
                  {data.map(s => (
                    <th key={s.sprint_id} style={{ padding: '0.85rem', textAlign: 'center', color: '#10b981', fontWeight: 800 }}>
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem', fontWeight: 700 }}>Velocity (pts/day)</td>
                  {data.map(s => (
                    <td key={s.sprint_id} style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 800, color: '#3b82f6' }}>
                      {s.velocity} pts
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem', fontWeight: 700 }}>Completion Story Points</td>
                  {data.map(s => (
                    <td key={s.sprint_id} style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 800 }}>
                      {s.completed_story_points} / {s.planned_story_points} pts
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem', fontWeight: 700 }}>Health Score (0-100)</td>
                  {data.map(s => (
                    <td key={s.sprint_id} style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 800, color: '#10b981' }}>
                      {s.health_score}%
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem', fontWeight: 700 }}>Capacity Utilization</td>
                  {data.map(s => (
                    <td key={s.sprint_id} style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 700, color: '#f97316' }}>
                      {s.capacity_utilization_pct}%
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem', fontWeight: 700 }}>QA Readiness Score</td>
                  {data.map(s => (
                    <td key={s.sprint_id} style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 700 }}>
                      {s.qa_readiness_score}%
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ padding: '0.85rem', fontWeight: 700 }}>Release Readiness</td>
                  {data.map(s => (
                    <td key={s.sprint_id} style={{ padding: '0.85rem', textAlign: 'center' }}>
                      <span className={`badge badge-${s.release_status.toLowerCase().replace(' ', '-')}`}>
                        {s.release_status}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close Comparison</button>
        </div>

      </div>
    </div>
  );
};
