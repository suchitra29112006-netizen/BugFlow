import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Clock, Users, ShieldAlert, Sparkles, Filter, RefreshCw, FileText, Zap, Layers, Activity } from 'lucide-react';

export const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [severityDist, setSeverityDist] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [developerWorkload, setDeveloperWorkload] = useState([]);
  const [resolutionTimes, setResolutionTimes] = useState([]);
  const [reopened, setReopened] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [narratives, setNarratives] = useState(null);
  const [bottlenecks, setBottlenecks] = useState(null);
  const [crossDimensional, setCrossDimensional] = useState([]);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [acceptedRuleMsg, setAcceptedRuleMsg] = useState('');
  
  // Addendum States
  const [nlQueryInput, setNlQueryInput] = useState('');
  const [nlResult, setNlResult] = useState(null);
  const [loadingNl, setLoadingNl] = useState(false);
  const [multiModeReports, setMultiModeReports] = useState(null);
  const [periodCompare, setPeriodCompare] = useState(null);
  const [estimationAcc, setEstimationAcc] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [
        ovData,
        trendData,
        sevData,
        stData,
        workloadData,
        resTimeData,
        reopenData,
        insightsData,
        narData,
        botData,
        crossData,
        sugData,
        reportsData,
        compareData,
        estData
      ] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getDefectTrends(14),
        api.getSeverityDistribution(),
        api.getStatusDistribution(),
        api.getDeveloperWorkloadAnalytics(),
        api.getResolutionTimeAnalytics(),
        api.getReopenedAnalytics(),
        api.getAIAnalyticsInsights(),
        api.getNarratedAnalytics(),
        api.getWorkflowBottlenecks(),
        api.getCrossDimensionalAnalysis(),
        api.getSmartAutomationSuggestions(),
        api.getMultiModeReports().catch(() => null),
        api.getPeriodComparison().catch(() => null),
        api.getEstimationAccuracy().catch(() => null)
      ]);

      setOverview(ovData);
      setTrends(trendData.trends || []);
      setSeverityDist(sevData.distribution || []);
      setStatusDist(stData.distribution || []);
      setDeveloperWorkload(workloadData.workload || []);
      setResolutionTimes(resTimeData.resolution_times || []);
      setReopened(reopenData);
      setAiInsights(insightsData.insights || []);
      setNarratives(narData.narratives || null);
      setBottlenecks(botData || null);
      setCrossDimensional(crossData.combinations || []);
      setSmartSuggestions(sugData.suggestions || []);
      setMultiModeReports(reportsData);
      setPeriodCompare(compareData);
      setEstimationAcc(estData);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const handleNLSubmit = async (e, customQuery = null) => {
    if (e) e.preventDefault();
    const q = customQuery || nlQueryInput;
    if (!q.trim()) return;
    setLoadingNl(true);
    try {
      const res = await api.postNLReportQuery(q);
      setNlResult(res);
      if (customQuery) setNlQueryInput(customQuery);
    } catch (err) {
      console.error("NL query error:", err);
    } finally {
      setLoadingNl(false);
    }
  };


  const handleAcceptSuggestion = async (sug) => {
    try {
      await api.acceptSmartAutomationSuggestion(sug.rule_data);
      setAcceptedRuleMsg(`✓ Successfully accepted & created automation rule: '${sug.title}'`);
      setSmartSuggestions(prev => prev.filter(s => s.id !== sug.id));
      setTimeout(() => setAcceptedRuleMsg(''), 4000);
    } catch (err) {
      alert("Failed to accept suggestion: " + err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Defect Analytics Engine...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-low" style={{ background: '#10b981', color: '#fff', fontWeight: 800 }}>
              ENTERPRISE ANALYTICS & BOTTLENECK FINDER
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Intelligent Defect Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Real-time resolution velocity, narrated interpretations, workflow bottleneck detection, and AI suggestions.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchAnalyticsData}>
          <RefreshCw size={15} /> Refresh Analytics
        </button>
      </div>

      {/* §2.2: Natural Language Report Builder */}
      <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(168, 85, 247, 0.4)', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.06) 0%, rgba(59, 130, 246, 0.06) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
          <Sparkles size={20} />
          💬 Natural Language Report Builder (§2.2)
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Ask any question about defects, workload, SLAs, or components in plain English.
        </p>

        <form onSubmit={handleNLSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 'Show critical defects by component' or 'Which developer has highest unresolved workload?'"
            value={nlQueryInput}
            onChange={(e) => setNlQueryInput(e.target.value)}
            style={{ flex: 1, fontSize: '0.88rem' }}
          />
          <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }} disabled={loadingNl || !nlQueryInput.trim()}>
            {loadingNl ? 'Parsing Query...' : 'Generate Report'}
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Quick Prompt Chips:</span>
          {[
            "Show critical defects by component",
            "Which developer has highest unresolved workload?",
            "Show defects likely to miss SLA",
            "Which components have highest recurrence?"
          ].map((chip, idx) => (
            <button
              key={idx}
              className="btn btn-secondary"
              style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '12px' }}
              onClick={(e) => handleNLSubmit(e, chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Query Output Result */}
        {nlResult && (
          <div style={{ marginTop: '1.25rem', padding: '1.25rem', borderRadius: '10px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#a855f7', fontWeight: 800, textTransform: 'uppercase' }}>UNDERSTOOD INTENT</span>
                <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{nlResult.understood_intent}</h4>
              </div>
              <span className="badge badge-assigned">{nlResult.total_matches} Matched Records</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{nlResult.explanation}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
              {nlResult.data?.map((item, idx) => (
                <div key={idx} style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                  <strong>{item.label}</strong>: {item.value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* §2.1: Multi-Mode AI Insight Reports (4 Layers) */}
      {multiModeReports && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
            <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase' }}>LAYER A — DESCRIPTIVE</span>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0.35rem 0' }}>What Happened?</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{multiModeReports.descriptive?.summary}</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #f97316' }}>
            <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 800, textTransform: 'uppercase' }}>LAYER B — DIAGNOSTIC</span>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0.35rem 0' }}>Why Did It Happen?</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{multiModeReports.diagnostic?.summary}</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #a855f7' }}>
            <span style={{ fontSize: '0.72rem', color: '#a855f7', fontWeight: 800, textTransform: 'uppercase' }}>LAYER C — PREDICTIVE</span>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0.35rem 0' }}>What Is Likely To Happen?</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{multiModeReports.predictive?.summary}</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>LAYER D — PRESCRIPTIVE</span>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0.35rem 0' }}>What Should We Do?</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{multiModeReports.prescriptive?.summary}</p>
          </div>
        </div>
      )}

      {/* Top KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>

        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>TOTAL DEFECTS</span>
          <strong style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 900 }}>{overview?.total_defects || 0}</strong>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>ACTIVE OPEN</span>
          <strong style={{ fontSize: '1.6rem', color: '#f97316', fontWeight: 900 }}>{overview?.active_defects || 0}</strong>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>RESOLVED / CLOSED</span>
          <strong style={{ fontSize: '1.6rem', color: '#10b981', fontWeight: 900 }}>{overview?.completed_defects || 0}</strong>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>CRITICAL SEVERITY</span>
          <strong style={{ fontSize: '1.6rem', color: '#ef4444', fontWeight: 900 }}>{overview?.critical_defects || 0}</strong>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>UNASSIGNED</span>
          <strong style={{ fontSize: '1.6rem', color: '#3b82f6', fontWeight: 900 }}>{overview?.unassigned_defects || 0}</strong>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>REOPENED BY QA</span>
          <strong style={{ fontSize: '1.6rem', color: '#a855f7', fontWeight: 900 }}>{overview?.reopened_defects || 0}</strong>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>AVG FIX TIME</span>
          <strong style={{ fontSize: '1.6rem', color: '#10b981', fontWeight: 900 }}>{overview?.avg_resolution_hours || 4.5} hrs</strong>
        </div>
      </div>

      {/* P0-4: Intelligent Workflow Bottleneck Finder Banner */}
      {bottlenecks && (
        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            <Activity size={20} />
            ⚠️ WORKFLOW BOTTLENECK DETECTED: '{bottlenecks.bottleneck_status}' Status
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.35rem' }}>
            Defects spend an average of <strong>{bottlenecks.avg_status_duration_days} days</strong> in '{bottlenecks.bottleneck_status}' (vs team average {bottlenecks.team_average_days} days).
          </p>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <strong>Potential Reason:</strong> {bottlenecks.potential_reason} | <strong>Recommendation:</strong> {bottlenecks.recommendation}
          </div>
        </div>
      )}

      {/* P0-6: Smart Automation Suggestions Banner */}
      {smartSuggestions.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            <Zap size={20} />
            ⚡ Smart Automation Rule Suggestion Detected
          </div>
          
          {smartSuggestions.map(sug => (
            <div key={sug.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#3b82f6' }}>{sug.title}</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sug.pattern_detected}</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={() => handleAcceptSuggestion(sug)}>
                  <CheckCircle2 size={14} /> Accept Rule
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={() => setSmartSuggestions(prev => prev.filter(s => s.id !== sug.id))}>
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* P0-5: Smart Severity x Category Analysis */}
      {crossDimensional.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f97316' }}>
            <Layers size={18} />
            Cross-Dimensional Analysis (Severity × Category Matrix)
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem' }}>Severity</th>
                  <th style={{ padding: '0.65rem' }}>Category</th>
                  <th style={{ padding: '0.65rem' }}>Defect Count</th>
                  <th style={{ padding: '0.65rem' }}>Fix Duration Multiplier</th>
                  <th style={{ padding: '0.65rem' }}>QA Reopen Rate</th>
                </tr>
              </thead>
              <tbody>
                {crossDimensional.map((c, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700, color: c.severity === 'Critical' ? '#ef4444' : '#f97316' }}>{c.severity}</td>
                    <td style={{ padding: '0.65rem', fontWeight: 600 }}>{c.category}</td>
                    <td style={{ padding: '0.65rem' }}>{c.count} defects</td>
                    <td style={{ padding: '0.65rem', color: '#ef4444', fontWeight: 800 }}>{c.multiplier}</td>
                    <td style={{ padding: '0.65rem', color: '#a855f7', fontWeight: 800 }}>{c.reopen_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid: Defect Trend & Severity Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
        
        {/* Defect Trend (Created vs Resolved) Bar Graph */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#10b981" />
            Defect Trend (Last 14 Days)
          </h3>

          {/* P0-3 Narrated Interpretation */}
          {narratives?.severity && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem', padding: '0.4rem 0.65rem', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
              💡 Narrative: {narratives.severity}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {trends.slice(-7).map((t, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem' }}>
                <span style={{ width: '60px', fontWeight: 700, color: 'var(--text-muted)' }}>{t.date}</span>
                
                <div style={{ flex: 1, display: 'flex', gap: '0.4rem', height: '22px', background: 'rgba(0,0,0,0.03)', borderRadius: '4px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min(100, t.created * 20)}%`, background: '#ef4444', borderRadius: '3px', display: 'flex', alignItems: 'center', paddingLeft: '6px', color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}>
                    {t.created > 0 ? `+${t.created}` : ''}
                  </div>
                  <div style={{ width: `${Math.min(100, t.resolved * 20)}%`, background: '#10b981', borderRadius: '3px', display: 'flex', alignItems: 'center', paddingLeft: '6px', color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}>
                    {t.resolved > 0 ? `✓${t.resolved}` : ''}
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t.created} New / {t.resolved} Fixed
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>■ Created</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>■ Resolved</span>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} color="#3b82f6" />
            Severity Distribution
          </h3>

          {narratives?.status && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem', padding: '0.4rem 0.65rem', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
              💡 Narrative: {narratives.status}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {severityDist.map((item) => {
              const colors = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#10b981' };
              const color = colors[item.severity] || '#3b82f6';
              return (
                <div key={item.severity} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
                    <span style={{ color }}>{item.severity}</span>
                    <span>{item.count} defects</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, item.count * 25)}%`, height: '100%', background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Grid: Developer Workload & Resolution Times */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr', gap: '1.5rem' }}>
        
        {/* Developer Workload */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#10b981" />
            Developer Workload Matrix
          </h3>

          {narratives?.workload && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem', padding: '0.4rem 0.65rem', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
              💡 Narrative: {narratives.workload}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {developerWorkload.map((dev) => (
              <div key={dev.developer_id} style={{ background: 'rgba(0,0,0,0.02)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{dev.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{dev.role}</span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: dev.active_defects > 4 ? '#ef4444' : '#10b981' }}>
                    {dev.active_defects} Active
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                    {dev.resolved_defects} Resolved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average Resolution Time by Severity */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="#3b82f6" />
            Avg Fix Duration by Severity
          </h3>

          {narratives?.resolution_time && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem', padding: '0.4rem 0.65rem', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
              💡 Narrative: {narratives.resolution_time}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {resolutionTimes.map((rt) => (
              <div key={rt.severity} style={{ background: 'rgba(0,0,0,0.02)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.88rem', color: rt.severity === 'Critical' ? '#ef4444' : 'var(--text-main)' }}>
                  {rt.severity} Severity
                </strong>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#3b82f6' }}>
                  ~{rt.avg_hours} Hours
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* §2.5: Period Comparison (Sprint N vs Sprint N-1) */}
      {periodCompare && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
            <Activity size={18} />
            Period Comparison ({periodCompare.period_current} vs {periodCompare.period_previous})
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {periodCompare.metrics?.map((m, idx) => (
              <div key={idx} style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>{m.name.toUpperCase()}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.35rem' }}>
                  <strong style={{ fontSize: '1.2rem', color: m.status === 'improved' ? '#10b981' : '#ef4444' }}>{m.current}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Prev: {m.previous}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem' }}>
            <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <strong style={{ color: '#10b981' }}>What Improved:</strong>
              <p style={{ color: 'var(--text-main)', marginTop: '0.2rem' }}>{periodCompare.insights?.improved}</p>
            </div>
            <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <strong style={{ color: '#ef4444' }}>Attention Required:</strong>
              <p style={{ color: 'var(--text-main)', marginTop: '0.2rem' }}>{periodCompare.insights?.attention_required}</p>
            </div>
          </div>
        </div>
      )}

      {/* §6: Engineering Effort Intelligence & Estimation Accuracy */}
      {estimationAcc && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6' }}>
              <Clock size={18} />
              Engineering Effort Intelligence & Estimation Accuracy (§6)
            </h3>
            <span className="badge badge-assigned">Overall Accuracy: {estimationAcc.overall_accuracy_pct}%</span>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem' }}>Component</th>
                  <th style={{ padding: '0.65rem' }}>Est. Avg Hours</th>
                  <th style={{ padding: '0.65rem' }}>Actual Avg Hours</th>
                  <th style={{ padding: '0.65rem' }}>Variance</th>
                  <th style={{ padding: '0.65rem' }}>Accuracy Status</th>
                </tr>
              </thead>
              <tbody>
                {estimationAcc.components?.map((c, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>{c.component}</td>
                    <td style={{ padding: '0.65rem' }}>{c.estimated_avg}</td>
                    <td style={{ padding: '0.65rem' }}>{c.actual_avg}</td>
                    <td style={{ padding: '0.65rem', fontWeight: 800, color: c.variance.includes('+70') ? '#ef4444' : '#10b981' }}>{c.variance}</td>
                    <td style={{ padding: '0.65rem' }}>
                      <span className={`badge ${c.status === 'Accurate' ? 'badge-resolved' : 'badge-critical'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            💡 Insight: {estimationAcc.insights}
          </p>
        </div>
      )}

    </div>
  );
};

