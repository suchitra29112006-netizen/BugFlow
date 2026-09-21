import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Plus, CheckCircle2, FileText, Clock } from 'lucide-react';
import { api } from '../services/api';

export function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/api/v1/incidents');
      setIncidents(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading Incident Center...</div>;
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Incident Center & Postmortems</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Production outage tracking, affected services timeline, root cause linking, and AI postmortems.
          </p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444', borderColor: '#ef4444' }}>
          <AlertTriangle size={16} /> Declare Incident
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {incidents.map((inc) => (
          <div key={inc.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444' }}>{inc.incident_code}</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{inc.title}</h3>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: inc.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: inc.status === 'RESOLVED' ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                      {inc.status}
                    </span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Affected: {inc.affected_components}</p>
                </div>
              </div>
            </div>

            {inc.postmortem_text && (
              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                {inc.postmortem_text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
