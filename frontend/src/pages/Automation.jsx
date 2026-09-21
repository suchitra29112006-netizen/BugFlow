import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Zap, Plus, ArrowRight, Settings } from 'lucide-react';

export const Automation = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const data = await api.getAutomationRules();
        setRules(data);
      } catch (err) {
        console.error("Failed to load automation rules:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading automation engine...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Workflow Automation Rules Builder</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Configure event-driven WHEN [Trigger] THEN [Action] workflow automation rules.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {rules.map(r => (
          <div key={r.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} color="#10b981" />
              </div>

              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{r.name}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>WHEN {r.trigger_event} ({r.condition_field} = "{r.condition_value}")</span>
                  <ArrowRight size={14} color="#10b981" />
                  <span style={{ color: '#10b981', fontWeight: 700 }}>THEN {r.action_type} → "{r.action_value}"</span>
                </div>
              </div>
            </div>

            <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Active Rule</span>
          </div>
        ))}
      </div>
    </div>
  );
};
