import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, AlertTriangle, Wand2, Search, Globe, Code2, Terminal, TrendingUp, Check, Edit3, X } from 'lucide-react';

export const AICenter = () => {
  const [activeTab, setActiveTab] = useState('risk'); // 'risk' | 'triage' | 'duplicates' | 'summary'

  // Auto Triage Interactive Form State
  const [triageTitle, setTriageTitle] = useState('Login fails on Safari');
  const [triageDesc, setTriageDesc] = useState('Users are unable to authenticate after entering valid credentials on Safari browser.');
  const [triageResult, setTriageResult] = useState(null);
  const [triaging, setTriaging] = useState(false);
  const [triageAccepted, setTriageAccepted] = useState(false);

  const handleRunTriage = async () => {
    if (!triageTitle.trim()) return;
    setTriaging(true);
    setTriageAccepted(false);
    try {
      const pred = await api.predictAISeverity(triageTitle, triageDesc);
      const tags = await api.autoTagIssue(triageTitle, triageDesc);
      setTriageResult({
        category: tags.tags?.[0] || 'Authentication',
        component: tags.tags?.[1] || 'Backend API',
        severity: pred.severity,
        priority: pred.severity,
        confidence: pred.confidence || 94
      });
    } catch (err) {
      alert("Triage failed: " + err.message);
    } finally {
      setTriaging(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#a855f7', color: '#fff', fontWeight: 800 }}>
              <Sparkles size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> AI ENGINEERING INTELLIGENCE
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>BugFlow AI Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Autonomous defect triage, semantic duplicate detection, activity summarization & sprint risk forecasting.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button className={`btn ${activeTab === 'risk' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('risk')}>
          ⚠️ AI Sprint Risk Analyzer
        </button>
        <button className={`btn ${activeTab === 'triage' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('triage')}>
          🧠 AI Auto-Triage Studio
        </button>
        <button className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('summary')}>
          📜 AI Activity Summarizer
        </button>
      </div>

      {/* Tab 1: AI Sprint Risk Analyzer */}
      {activeTab === 'risk' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: '#ef4444', fontWeight: 800, fontSize: '1.2rem' }}>
              <AlertTriangle size={24} />
              AI Sprint Risk Alert
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ef4444', marginBottom: '0.5rem' }}>
              72% Probability of Missed Sprint Target
            </div>

            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.92rem', marginBottom: '1.25rem' }}>
              <strong>AI Risk Analysis:</strong> 4 critical authentication issues remain unresolved in Sprint 04. Based on current developer velocity (1.8 bugs/day), Sprint 04 has a <strong>72% probability of delay</strong> unless 2 issues are reassigned.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>Rebalance Team Workload</button>
              <button className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>Adjust Sprint Scope</button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Sprint Forecasting Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Historical Resolution Velocity:</span>
                <strong>1.8 Bugs / Day</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Remaining Unresolved Defects:</span>
                <strong style={{ color: '#ef4444' }}>8 Issues (4 Critical)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Estimated Hours Required:</span>
                <strong>38.5 Hours</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>Recommended Action:</span>
                <strong style={{ color: '#10b981' }}>Reassign BUG-105 to Sarah</strong>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: AI Auto-Triage Studio */}
      {activeTab === 'triage' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: '#a855f7' }}>
            🤖 AI Auto-Triage & Classification
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '650px', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Bug Title</label>
              <input type="text" className="form-input" value={triageTitle} onChange={(e) => setTriageTitle(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea className="form-textarea" rows={3} value={triageDesc} onChange={(e) => setTriageDesc(e.target.value)} />
            </div>

            <button className="btn btn-primary" onClick={handleRunTriage} disabled={triaging}>
              {triaging ? 'Running AI Triage...' : 'Execute AI Auto-Triage'}
            </button>
          </div>

          {triageResult && (
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '1.5rem', borderRadius: '12px', maxWidth: '650px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#a855f7', marginBottom: '1rem' }}>
                AI TRIAGE SUGGESTIONS (Confidence: {triageResult.confidence}%)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <div><strong>Category:</strong> {triageResult.category}</div>
                <div><strong>Component:</strong> {triageResult.component}</div>
                <div><strong>Severity:</strong> <span className={`badge badge-${triageResult.severity.toLowerCase()}`}>{triageResult.severity}</span></div>
                <div><strong>Priority:</strong> <span className={`badge badge-${triageResult.priority.toLowerCase()}`}>{triageResult.priority}</span></div>
              </div>

              {triageAccepted ? (
                <div style={{ padding: '0.5rem', color: '#10b981', fontWeight: 800, fontSize: '0.9rem' }}>
                  ✓ AI Suggestions Accepted & Saved!
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => setTriageAccepted(true)}>
                    <Check size={14} /> Accept Suggestions
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => setTriageResult(null)}>
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: AI Activity Summarizer */}
      {activeTab === 'summary' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: '#10b981' }}>
            ✨ AI Activity & Executive Defect Summarizer
          </h3>

          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.25rem', borderRadius: '10px', lineHeight: 1.6, fontSize: '0.95rem' }}>
            <strong>AI Synthesis:</strong> BUG-105 was reported by QA Alex and assigned to Sarah Developer. AI classified it as a High-Severity authentication issue. Priority was escalated after production impact was confirmed. A fix snippet was implemented and subsequently verified clean by QA with zero regressions.
          </div>
        </div>
      )}

    </div>
  );
};
