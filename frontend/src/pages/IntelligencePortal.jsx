import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Sparkles, TrendingUp, AlertOctagon, Sliders, FileText, Activity, ShieldAlert, CheckCircle2, RefreshCw, Bot, HelpCircle } from 'lucide-react';
import { ExplainWhyModal } from '../components/ExplainWhyModal';
import { IntelligenceGraph } from '../components/IntelligenceGraph';

export const IntelligencePortal = () => {
  const [techDebt, setTechDebt] = useState([]);
  const [hotspot, setHotspot] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [releaseNotes, setReleaseNotes] = useState(null);
  const [loading, setLoading] = useState(true);

  // What-If Simulator State
  const [scenario, setScenario] = useState("Scenario B: 20% fewer developers");
  const [capacityPct, setCapacityPct] = useState(80);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Explain Why Modal State
  const [explainModal, setExplainModal] = useState({ isOpen: false, targetId: 1, type: 'risk' });

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const [tRes, hRes, fRes, iRes] = await Promise.all([
        api.getTechnicalDebtRadar(),
        api.getDefectHotspotForecast(),
        api.getDefectForecast(),
        api.getIncidentsList()
      ]);
      setTechDebt(tRes || []);
      setHotspot(hRes);
      setForecast(fRes);
      setIncidents(iRes || []);
    } catch (err) {
      console.error("Failed to load intelligence portal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleRunSimulator = async (e) => {
    e?.preventDefault();
    setSimulating(true);
    try {
      const res = await api.runWhatIfSimulator(scenario, capacityPct);
      setSimResult(res);
    } catch (err) {
      alert("Simulation failed: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleGenerateReleaseNotes = async () => {
    try {
      const notes = await api.generateAutoReleaseNotes();
      setReleaseNotes(notes);
    } catch (err) {
      alert("Failed to generate release notes: " + err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Initializing Engineering Intelligence Portal...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-low" style={{ background: '#a855f7', color: '#fff', fontWeight: 800 }}>
              PREDICTIVE INTELLIGENCE & ENGINEERING KNOWLEDGE
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>🔮 Engineering Intelligence Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Technical debt radar, 14-day defect volume forecasting, what-if sprint simulator, release notes generator, and incident management.
          </p>
        </div>

        <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #10b981 100%)' }} onClick={handleGenerateReleaseNotes}>
          <FileText size={16} /> Auto Release Notes
        </button>
      </div>

      {/* Connected Engineering Intelligence Graph */}
      <IntelligenceGraph />

      {/* Auto Release Notes Drawer/Modal Banner */}
      {releaseNotes && (
        <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>📝 {releaseNotes.release_version} ({releaseNotes.release_date})</h3>
            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }} onClick={() => setReleaseNotes(null)}>Close</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {Object.entries(releaseNotes.sections || {}).map(([sec, items]) => (
              <div key={sec} style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong style={{ fontSize: '0.85rem', color: '#10b981', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>{sec}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {items.map((it, idx) => <span key={idx}>{it}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 14-Day Defect Forecasting & Hotspot Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        
        {/* Left: 14-Day Statistical Forecast */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} /> 14-Day Statistical Defect Forecast
            </h3>
            <span className="badge badge-assigned" style={{ fontSize: '0.7rem' }}>{forecast?.methodology}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>EXPECTED INCOMING</span>
              <strong style={{ fontSize: '1.5rem', color: '#f97316', fontWeight: 900 }}>{forecast?.expected_incoming_defects || 18}</strong>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>EXPECTED RESOLVED</span>
              <strong style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 900 }}>{forecast?.expected_resolved_defects || 13}</strong>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>NET BACKLOG CHANGE</span>
              <strong style={{ fontSize: '1.5rem', color: '#ef4444', fontWeight: 900 }}>{forecast?.projected_backlog_change || '+5'}</strong>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{forecast?.summary}</p>
        </div>

        {/* Right: Defect Hotspot Forecast */}
        <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertOctagon size={20} /> Defect Hotspot Forecast
            </h3>
            <span className="badge badge-high" style={{ fontSize: '0.7rem' }}>{hotspot?.hotspot_risk_pct}% RISK</span>
          </div>

          <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.35rem' }}>{hotspot?.predicted_hotspot}</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>Target Iteration: {hotspot?.forecast_release}</span>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {hotspot?.reasons?.map((r, idx) => (
              <span key={idx}>• {r}</span>
            ))}
          </div>
        </div>

      </div>

      {/* Technical Debt Radar Table */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7' }}>
          <Activity size={20} /> Technical Debt Radar (Component Risk Map)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {techDebt.map((td, idx) => (
            <div key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className={`badge badge-${td.risk_level.toLowerCase()}`}>{td.risk_level} Risk</span>
                  <strong style={{ fontSize: '0.9rem' }}>{td.component}</strong>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{td.why_explanation}</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => setExplainModal({ isOpen: true, targetId: 1, type: 'risk' })}
                >
                  <HelpCircle size={12} color="#10b981" /> Explain Why
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What-If Sprint Simulator */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6' }}>
          <Sliders size={20} /> 🎛️ What-If Sprint & Release Simulator
        </h3>

        <form onSubmit={handleRunSimulator} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <select className="form-select" style={{ fontSize: '0.85rem' }} value={scenario} onChange={(e) => setScenario(e.target.value)}>
            <option value="Scenario A: Current capacity">Scenario A: Current capacity</option>
            <option value="Scenario B: 20% fewer developers">Scenario B: 20% fewer developers</option>
            <option value="Scenario C: Resolve all critical issues first">Scenario C: Resolve all critical issues first</option>
            <option value="Scenario D: Increase resolution rate by 25%">Scenario D: Increase resolution rate by 25%</option>
          </select>

          <input
            type="number"
            className="form-input"
            placeholder="Capacity % (e.g. 80)"
            value={capacityPct}
            onChange={(e) => setCapacityPct(parseInt(e.target.value) || 80)}
            style={{ fontSize: '0.85rem' }}
          />

          <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }} disabled={simulating}>
            {simulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </form>

        {simResult && (
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <strong style={{ fontSize: '0.9rem', color: '#3b82f6', display: 'block', marginBottom: '0.35rem' }}>{simResult.summary}</strong>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', gap: '1rem' }}>
              <span>Projected Backlog: <strong>{simResult.projected_backlog} defects</strong></span>
              <span>Sprint Health: <strong>{simResult.projected_sprint_health}/100</strong></span>
              <span>Completion Probability: <strong>{simResult.completion_probability_pct}%</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Incident Management & Postmortems */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
          <ShieldAlert size={20} /> Incident Mode & AI Postmortems
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {incidents.map((inc) => (
            <div key={inc.id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-high" style={{ background: '#ef4444', color: '#fff' }}>{inc.incident_code}</span>
                  <strong style={{ fontSize: '0.95rem' }}>{inc.title}</strong>
                </div>
                <span className="badge badge-resolved" style={{ fontSize: '0.7rem' }}>{inc.status}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.25rem' }}><strong>Postmortem:</strong> {inc.postmortem}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Global Explain Why Modal */}
      <ExplainWhyModal
        isOpen={explainModal.isOpen}
        onClose={() => setExplainModal({ ...explainModal, isOpen: false })}
        targetId={explainModal.targetId}
        recommendationType={explainModal.type}
      />

    </div>
  );
};
