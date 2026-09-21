import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, X, Send, Bot, User, AlertTriangle, CheckCircle2, Loader2, Wrench, MessageSquareCode } from 'lucide-react';

export const BugFlowCopilotDrawer = ({ isOpen, onClose, onSelectIssue }) => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am BugFlow Copilot (Defect Whisperer). Ask me natural-language queries about sprint blockers, risk scores, SLA breaches, developer workload, or draft daily updates!' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionPayload, setActionPayload] = useState(null);

  if (!isOpen) return null;

  const quickQueries = [
    "What is blocking Sprint 1?",
    "Show me highest-risk unresolved defects",
    "Which critical defects are close to SLA breach?",
    "Who has the highest developer workload?",
    "Which defects are repeatedly being reopened?",
    "Draft a daily defect status update",
    "Assign DEF-1 to Sarah Developer"
  ];

  const handleSendMessage = async (e, textOverride = null) => {
    e?.preventDefault();
    const queryToUse = textOverride || inputText;
    if (!queryToUse.trim() || loading) return;

    if (!textOverride) setInputText('');
    setMessages(prev => [...prev, { sender: 'user', text: queryToUse }]);
    setLoading(true);

    try {
      const res = await api.askBugFlowCopilot(queryToUse);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: res.answer,
        tools: res.tools_used || [],
        actionRequired: res.action_required,
        payload: res.action_payload
      }]);

      if (res.action_required && res.action_payload) {
        setActionPayload(res.action_payload);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!actionPayload) return;
    try {
      const result = await api.executeCopilotAction(actionPayload.action_type, actionPayload.issue_id, actionPayload.target);
      setMessages(prev => [...prev, { sender: 'bot', text: `✓ Action Executed: ${result.message}` }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Action Execution Failed: " + err.message }]);
    } finally {
      setActionPayload(null);
    }
  };

  return (
    <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div className="glass-panel" style={{ width: '440px', height: '100vh', borderRadius: 0, display: 'flex', flexDirection: 'column', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>
            <Sparkles size={20} />
            BugFlow Copilot AI
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Quick Query Pills */}
        <div style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)', display: 'flex', gap: '0.4rem', overflowX: 'auto', flexShrink: 0 }}>
          {quickQueries.map((q, idx) => (
            <button
              key={idx}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600 }}
              onClick={(e) => handleSendMessage(e, q)}
            >
              <MessageSquareCode size={11} color="#10b981" /> {q}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.75rem', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.sender === 'bot' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <Bot size={18} />
                </div>
              )}

              <div style={{ maxWidth: '82%', padding: '0.85rem 1rem', borderRadius: '12px', background: m.sender === 'user' ? '#10b981' : 'rgba(0,0,0,0.03)', color: m.sender === 'user' ? '#fff' : 'var(--text-main)', border: m.sender === 'user' ? 'none' : '1px solid var(--border-color)', fontSize: '0.88rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {m.text}

                {m.tools && m.tools.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {m.tools.map((t, i) => (
                      <span key={i} style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Wrench size={10} /> {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', flexShrink: 0 }}>
                  <User size={18} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Loader2 className="animate-spin" size={16} color="#10b981" />
              BugFlow Copilot is querying workspace telemetry...
            </div>
          )}

          {/* Action Confirmation Modal Card inside Thread */}
          {actionPayload && (
            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                <AlertTriangle size={16} />
                Confirm Write Action Proposal
              </div>
              <p style={{ fontSize: '0.82rem', marginBottom: '0.75rem' }}>{actionPayload.prompt}?</p>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={handleConfirmAction}>
                  <CheckCircle2 size={14} /> Confirm Action
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={() => setActionPayload(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask BugFlow Copilot..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          />
          <button type="submit" className="btn btn-primary" disabled={!inputText.trim() || loading}>
            <Send size={16} />
          </button>
        </form>

      </div>
    </div>
  );
};
