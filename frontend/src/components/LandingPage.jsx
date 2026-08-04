import React from 'react';
import { Bug, Sparkles, ShieldCheck, FileText, QrCode, Globe2, ArrowRight, CheckCircle2, Zap, Kanban, Mic } from 'lucide-react';


export const LandingPage = ({ onGetStarted, onLogin }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.12) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(249, 115, 22, 0.1) 0%, transparent 40%), var(--bg-primary)' }}>
      
      {/* Top Header */}
      <header style={{ padding: '1.25rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #f97316 100%)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
            <Bug size={24} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            BugFlow AI
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onLogin}>Sign In</button>
          <button className="btn btn-primary" onClick={onGetStarted}>Get Started Free</button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
          <Sparkles size={16} /> AI-Powered Bug Tracking & Issue Management Platform
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.15, maxWidth: '950px' }}>
          AI-Powered Bug Tracking & <span style={{ background: 'linear-gradient(135deg, #10b981 0%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Issue Management</span> Platform
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '850px', lineHeight: 1.6 }}>
          BugFlow is a full-stack issue tracking system built to help software teams manage the complete bug lifecycle. Users can securely authenticate, create and manage projects, report software defects, collaborate through comments, monitor issue progress, and leverage AI to generate detailed bug reports within seconds.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button className="btn btn-primary" style={{ padding: '0.85rem 2.25rem', fontSize: '1.05rem' }} onClick={onGetStarted}>
            Launch BugFlow Workspace
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', marginTop: '3.5rem', textAlign: 'left' }}>
          
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Kanban size={22} color="#10b981" />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Interactive Kanban Board</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Go beyond list views. Drag and move issues seamlessly across columns (Open → In Progress → In Review → Resolved).
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Mic size={22} color="#f97316" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Voice Bug Reporting 🎙</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Speak naturally (e.g. "Login button crashes app"). Web Speech API & AI convert speech to a structured bug report.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Zap size={22} color="#3b82f6" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI Duplicate Detection</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Identifies 94%+ similarity with existing database bugs and recommends attaching your report to existing tickets.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Sparkles size={22} color="#a855f7" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI Severity Predictor</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Auto-selects severity (Critical, High, Medium, Low) with 96% confidence and precise reasoning text.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <FileText size={22} color="#ec4899" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI Weekly PDF Reports</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Generates weekly resolution metrics (e.g. 27 Bugs Fixed, 11 Critical) with a printable PDF download export.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <QrCode size={22} color="#0ea5e9" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>QR Code Mobile Reporting</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Scan QR code on your mobile phone to report defects instantly on the go.
            </p>
          </div>

        </div>

      </main>

      <footer style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
        © 2026 BugFlow AI Platform. Built for Software Defect & Triage Excellence.
      </footer>
    </div>
  );
};
