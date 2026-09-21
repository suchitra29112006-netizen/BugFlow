import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldAlert, ShieldCheck, Key, RefreshCw, Lock } from 'lucide-react';

export const SecurityCenter = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  // PII / Secret Leak Sandbox State
  const [testText, setTestText] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanningText, setScanningText] = useState(false);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const aRes = await api.getAuditAnomalies();
      setAnomalies(aRes || []);
    } catch (err) {
      console.error("Failed to load security data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleCheckPII = async (e) => {
    e.preventDefault();
    if (!testText.trim()) return;
    setScanningText(true);
    try {
      const res = await api.checkSensitiveDataLeak(testText);
      setScanResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setScanningText(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-high" style={{ background: '#ef4444', color: '#fff', fontWeight: 800 }}>
              SECURITY & GOVERNANCE LAYER
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>🛡️ AI Security Center & PII Leak Guard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Audit log anomaly detection, telemetry pattern monitoring, and pre-submit API key / secret leak guard.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchSecurityData} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
          {loading ? 'Refreshing...' : 'Refresh Telemetry'}
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>AUDIT LOG ANOMALIES</span>
          <strong style={{ fontSize: '1.8rem', color: '#a855f7', fontWeight: 900 }}>
            {anomalies.length}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Telemetry Pattern Detection</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>PII & SECRET GUARD</span>
          <strong style={{ fontSize: '1.8rem', color: '#10b981', fontWeight: 900 }}>
            ACTIVE 🛡️
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Pre-Submit Payload Inspection</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>SECURITY POSTURE</span>
          <strong style={{ fontSize: '1.8rem', color: '#10b981', fontWeight: 900 }}>
            PROTECTED ✓
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Audit & Governance Monitoring</span>
        </div>
      </div>

      {/* Section 1: Audit Log Anomaly Detector */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7' }}>
          <ShieldAlert size={20} /> 🕵️ Audit Log Anomaly Detector
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading security audit logs...</div>
        ) : anomalies.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>✓ No suspicious audit anomalies detected.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {anomalies.map((anom) => (
              <div key={anom.id} style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.06)', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-high" style={{ background: '#a855f7', color: '#fff' }}>{anom.pattern_name}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>User: {anom.user_name}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{anom.evidence}</p>
                </div>

                <span className="badge badge-low" style={{ background: '#10b981', color: '#fff', fontSize: '0.7rem' }}>
                  STATUS: {anom.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: PII / Secret Leak Guard Sandbox */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
          <Key size={20} /> 🧯 PII / Secret Leak Guard Sandbox
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Paste test text or payload containing API keys, JWT tokens, or credentials to test pre-submit leak detection.
        </p>

        <form onSubmit={handleCheckPII} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Paste text or API payload (e.g. 'Stripe Key: STRIPE_API_KEY_EXAMPLE')"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          />

          <button type="submit" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.8rem' }} disabled={scanningText || !testText.trim()}>
            {scanningText ? 'Scanning...' : 'Scan Payload for Secrets'}
          </button>
        </form>

        {scanResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: scanResult.contains_sensitive_data ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: scanResult.contains_sensitive_data ? '1px solid #ef4444' : '1px solid #10b981' }}>
            <strong style={{ fontSize: '0.9rem', color: scanResult.contains_sensitive_data ? '#ef4444' : '#10b981', display: 'block', marginBottom: '0.35rem' }}>
              {scanResult.contains_sensitive_data ? scanResult.warning : '✓ No secrets or PII detected in payload.'}
            </strong>

            {scanResult.findings.map((f, idx) => (
              <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                • <strong>{f.type}</strong> ({f.match_count} match): {f.recommendation}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
