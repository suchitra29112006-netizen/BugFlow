import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldAlert, Plus, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export const SLAManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSLA = async () => {
      try {
        const data = await api.getSLAPolicies();
        setPolicies(data);
      } catch (err) {
        console.error("Failed to load SLA policies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSLA();
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading SLA policies...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>SLA Management & Escalations</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Define criteria-based Service Level Agreements and automated manager escalation triggers.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {policies.map(p => (
          <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`badge badge-${p.severity.toLowerCase()}`}>{p.severity} Severity</span>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>ACTIVE</span>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{p.name}</h3>

            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Resolution Time</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f97316' }}>{p.target_hours} Hours</div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              Auto-Escalate To: <strong>{p.escalate_role}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
