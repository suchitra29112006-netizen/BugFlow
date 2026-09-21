import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, Send, X, Bot, User, Loader2 } from 'lucide-react';

export const SprintCopilotDrawer = ({ isOpen, onClose, sprintId, sprintName }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello! I am Sprint AI for '${sprintName || 'Current Sprint'}'. Ask me anything about sprint risk, developer capacity, velocity, or blockers!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    "Why is this sprint at risk?",
    "Who is overloaded?",
    "Which issues should we prioritize?",
    "Summarize this sprint."
  ];

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || !sprintId) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askSprintAICopilot(sprintId, textToSend);
      const botMsg = { sender: 'bot', text: res.answer };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Error fetching Sprint AI response: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '420px',
        maxWidth: '90vw',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: '#10b981', padding: '0.4rem', borderRadius: '8px' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>🤖 Sprint AI Copilot</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time database context Q&A</span>
          </div>
        </div>

        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem' }} onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {/* Suggested Quick Questions */}
      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: 'rgba(0,0,0,0.02)' }}>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10b981',
              padding: '0.25rem 0.6rem',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => handleSend(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '0.6rem',
              justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {m.sender === 'bot' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={15} color="#fff" />
              </div>
            )}

            <div
              style={{
                maxWidth: '82%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                background: m.sender === 'user' ? '#10b981' : 'rgba(0,0,0,0.04)',
                color: m.sender === 'user' ? '#fff' : 'var(--text-main)',
                border: m.sender === 'bot' ? '1px solid var(--border-color)' : 'none'
              }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Loader2 className="animate-spin" size={16} color="#10b981" />
            <span>Analyzing Sprint metrics & database tables...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', gap: '0.5rem' }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Ask Sprint AI a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim() || loading}>
            <Send size={15} />
          </button>
        </form>
      </div>

    </div>
  );
};
