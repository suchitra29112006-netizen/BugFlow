import React from 'react';
import { FileText, Download, X, CheckCircle2, AlertTriangle, Clock, TrendingUp, Sparkles, Trophy } from 'lucide-react';

export const AIWeeklyReportModal = ({ isOpen = true, onClose, stats }) => {
  if (isOpen === false) return null;

  const handleDownloadPDF = () => {
    const reportElem = document.getElementById('printable-weekly-report');
    if (!reportElem) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BugFlow_Weekly_Executive_AI_Report_${new Date().toISOString().slice(0,10)}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; background: #ffffff; }
            h2 { color: #10b981; margin-bottom: 4px; font-size: 24px; }
            .header-bar { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .report-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
            .metric-box { background: #ffffff; border: 1px solid #cbd5e1; padding: 15px; border-radius: 10px; text-align: center; }
            .metric-val { font-size: 28px; font-weight: 900; margin: 6px 0; }
            .badge-green { color: #10b981; font-weight: 700; }
            .badge-red { color: #ef4444; font-weight: 700; }
            .badge-orange { color: #f97316; font-weight: 700; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <h2>🚀 BugFlow — AI Weekly Executive Summary Report</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0;">Generated on: ${new Date().toLocaleDateString()} | Leadership Digest</p>
          </div>
          ${reportElem.innerHTML}
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: '680px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #f97316 100%)', padding: '0.4rem', borderRadius: '8px' }}>
              <FileText size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>AI Weekly Executive Summary Report</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generated every Friday for engineering leadership</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Printable Report Body */}
        <div id="printable-weekly-report" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '1rem 1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REPORT PERIOD</span>
              <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>Current Week Summary (Friday Digest)</h4>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                <Sparkles size={12} /> Health Score: 94%
              </span>
            </div>
          </div>

          {/* Metrics Overview Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <CheckCircle2 size={16} color="#10b981" /> Bugs Fixed
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>27</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>+15% vs last week</span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <AlertTriangle size={16} color="#ef4444" /> Critical Resolved
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444' }}>11</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Zero open criticals</span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <Clock size={16} color="#f97316" /> Avg Resolution Time
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f97316' }}>2 Days</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Fastest triage cycle</span>
            </div>
          </div>

          {/* Top Bug Hunter Leaderboard */}
          <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f97316' }}>
              <Trophy size={16} /> Top Developer Resolution Leaderboard
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                <span>🥇 <strong>Sarah Developer</strong></span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>14 Resolved</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                <span>🥈 <strong>Alex QA</strong></span>
                <span style={{ fontWeight: 700, color: '#f97316' }}>9 Verified</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                <span>🥉 <strong>David Reporter</strong></span>
                <span style={{ fontWeight: 700, color: '#3b82f6' }}>4 Triaged</span>
              </div>
            </div>
          </div>

          {/* AI Synthesis Summary */}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px' }}>
            <strong>AI Executive Insight:</strong> Resolution velocity increased by 18% this week. Critical authentication and database constraint bottlenecks were resolved within 48 hours. Zero security regressions detected.
          </div>

        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handleDownloadPDF}>
            <Download size={16} />
            Download PDF Report
          </button>
        </div>

      </div>
    </div>
  );
};
