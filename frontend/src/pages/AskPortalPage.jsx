import React, { useState, useEffect } from 'react';
import { HelpCircle, Send, CheckCircle2, Sparkles, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export function AskPortalPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [env, setEnv] = useState('Production');
  const [type, setType] = useState('BUG');
  const [submitting, setSubmitting] = useState(false);
  const [lastTriage, setLastTriage] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/v1/ask-portal/requests');
      setRequests(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/api/v1/ask-portal/submit', {
        requester_name: name,
        requester_email: email,
        title,
        description,
        environment: env,
        request_type: type
      });
      setLastTriage(res.ai_triage);
      setTitle('');
      setDescription('');
      fetchRequests();
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvert = async (reqId) => {
    try {
      const res = await api.post(`/api/v1/ask-portal/requests/${reqId}/convert`);
      alert("Converted to Issue #" + res.converted_issue_id);
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Public Ask & Bug Portal</h1>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Lightweight submission portal for non-users, clients, and beta testers with automatic AI Triage & duplicate detection.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        {/* Submission Form */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <HelpCircle size={18} color="#10b981" /> Submit Defect or Request
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Your Name</label>
              <input type="text" className="form-input" placeholder="Jane Doe" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-input" placeholder="jane@client.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Type</label>
                <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                  <option value="BUG">Defect / Bug</option>
                  <option value="FEATURE_REQUEST">Feature Request</option>
                  <option value="SUPPORT">Support Ticket</option>
                </select>
              </div>
              <div className="form-group">
                <label>Environment</label>
                <select className="form-select" value={env} onChange={e => setEnv(e.target.value)}>
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Mobile App">Mobile App</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input type="text" className="form-input" placeholder="Brief issue summary..." value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Detailed Description</label>
              <textarea className="form-textarea" rows={4} placeholder="Describe expected vs actual behavior..." value={description} onChange={e => setDescription(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
              <Send size={16} /> {submitting ? 'Triaging with AI...' : 'Submit to Engineering'}
            </button>
          </form>

          {lastTriage && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Sparkles size={16} /> BugFlow AI Triage Summary
              </div>
              <div>Suggested Severity: <strong>{lastTriage.severity_suggestion}</strong> ({lastTriage.confidence_score}% confidence)</div>
              <div>Suggested Squad: <strong>{lastTriage.suggested_team}</strong></div>
            </div>
          )}
        </div>

        {/* Incoming Submissions List */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Submitted Requests</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.map((r) => (
              <div key={r.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.requester_name} ({r.requester_email})</span>
                  <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: r.status === 'CONVERTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: r.status === 'CONVERTED' ? '#10b981' : '#3b82f6', fontWeight: 700 }}>
                    {r.status}
                  </span>
                </div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.title}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.description}</p>
                {r.status === 'SUBMITTED' && (
                  <button className="btn btn-secondary" onClick={() => handleConvert(r.id)} style={{ alignSelf: 'flex-start', marginTop: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                    Convert to Bug / Task
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
