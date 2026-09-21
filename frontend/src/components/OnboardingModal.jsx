import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function OnboardingModal({ isOpen, onClose, role = 'developer' }) {
  const [activeTab, setActiveTab] = useState('welcome');
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBrief();
    }
  }, [isOpen]);

  const fetchBrief = async () => {
    try {
      setLoading(true);
      const res = await api.getDeveloperBrief();
      setBrief(res.data || res);
    } catch (err) {
      console.error('Failed to load onboarding brief:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const roleGuide = {
    admin: {
      title: 'Admin Onboarding',
      badge: 'System Admin',
      steps: [
        { icon: '🛡️', text: 'Manage Team Roles, RBAC permissions, and system security thresholds.' },
        { icon: '⚡', text: 'Monitor Database Performance & N+1 Query Advisory tools in Performance Center.' },
        { icon: '🔒', text: 'Audit AI Security Log Anomalies and PII/Secret leak detections in Security Center.' },
      ],
    },
    qa: {
      title: 'QA / Tester Onboarding',
      badge: 'Quality Engineer',
      steps: [
        { icon: '🐞', text: 'Submit defects with automated PII leak checking and duplicate DNA detection.' },
        { icon: '✅', text: 'Verify defect fixes using mandatory Verification Plan checklists before close.' },
        { icon: '📊', text: 'Track Defect Quality Scores and recurrence risk indicators across modules.' },
      ],
    },
    developer: {
      title: 'Developer Onboarding',
      badge: 'Software Engineer',
      steps: [
        { icon: '⏱️', text: 'Read your 7-Minute Developer Brief to ramp up fast on active project context.' },
        { icon: '🧬', text: 'Inspect Defect DNA & Bug Family Trees to locate root cause code modules.' },
        { icon: '🔬', text: 'Launch Collaborative AI Investigation Workspaces to brainstorm hypotheses.' },
      ],
    },
    reporter: {
      title: 'Reporter Onboarding',
      badge: 'Project Contributor',
      steps: [
        { icon: '📝', text: 'Use Smart AI Triage to auto-expand bug reports with steps to reproduce.' },
        { icon: '🎯', text: 'Track bug status transitions in real-time on Sprint Kanban boards.' },
        { icon: '📈', text: 'View project defect volume forecasts in the Intelligence Portal.' },
      ],
    },
  };

  const guide = roleGuide[role?.toLowerCase()] || roleGuide.developer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/90 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                BugFlow Developer Onboarding
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  {guide.badge}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Intelligent Defect Tracking & Resolution Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('welcome')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'welcome'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🚀 Role Guide
          </button>
          <button
            onClick={() => setActiveTab('brief')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'brief'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ⏱️ 7-Minute Developer Brief
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'welcome' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                <h3 className="text-sm font-bold text-indigo-300 mb-1">{guide.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Welcome to BugFlow! Here is your quick start checklist tailored for your{' '}
                  <strong className="text-indigo-400">{guide.badge}</strong> workflow.
                </p>
              </div>

              <div className="grid gap-3">
                {guide.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 text-xs"
                  >
                    <span className="text-base p-1 bg-slate-800 rounded-lg">{step.icon}</span>
                    <span className="mt-0.5 leading-relaxed">{step.text}</span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                <span>💡 Tip: AI models only recommend actions. Developers always maintain full execution approval.</span>
              </div>
            </div>
          )}

          {activeTab === 'brief' && (
            <div className="space-y-4">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  Generating 7-Minute Developer Brief...
                </div>
              ) : brief ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-200 block">Est. Ramp-Up Time</span>
                      <span className="text-indigo-400 font-medium">{brief.estimated_read_time || '7 minutes'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200 block">Architecture Modules</span>
                      <span className="text-slate-400">{brief.modules?.length || 4} components</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-300 mb-2">High-Risk Defect Hotspots</h4>
                    <div className="grid gap-2">
                      {brief.top_risk_modules?.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                          <span className="text-slate-300 font-mono text-[11px]">{m.name}</span>
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-semibold">
                            {m.risk} Risk
                          </span>
                        </div>
                      )) || (
                        <p className="text-slate-500">No active high-risk modules recorded.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-300 mb-2">Architectural Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      {brief.architecture_tips?.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      )) || (
                        <>
                          <li>Review sqlalchemy async connection pool sizes under high load.</li>
                          <li>Check static analysis findings in Security Center prior to deployment.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Could not load brief details. Please check system backend connection.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 border-t border-slate-800 px-6 py-3 flex justify-between items-center">
          <span className="text-[11px] text-slate-400">Milestone 4 — Developer Ramp-Up Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition"
          >
            Got it, Let's Start 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
