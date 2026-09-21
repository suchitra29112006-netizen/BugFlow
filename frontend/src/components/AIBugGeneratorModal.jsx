import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, X, Check, Loader2, Wand2, Mic } from 'lucide-react';

export const AIBugGeneratorModal = ({ isOpen, onClose, projects, onIssueCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);

  if (!isOpen) return null;

  const handleStartVoiceTriage = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Speech Recognition API is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setListening(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
        setListening(false);
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setListening(false);
      };

      recognition.onend = () => setListening(false);
    } catch (err) {
      console.error(err);
      setListening(false);
    }
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');

    try {
      const projName = projects.find(p => p.id === parseInt(selectedProject))?.name;
      const result = await api.generateAIBugReport(prompt, projName);
      setGeneratedReport(result);
    } catch (err) {
      setError(err.message || 'AI Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async () => {
    if (!generatedReport || !selectedProject) return;

    setLoading(true);
    try {
      const formattedDescription = `${generatedReport.description}\n\n**Expected Behavior:**\n${generatedReport.expected_behavior}\n\n**Actual Behavior:**\n${generatedReport.actual_behavior}\n\n**Steps to Reproduce:**\n${generatedReport.steps_to_reproduce}\n\n**Environment:**\n${generatedReport.environment}`;

      await api.createIssue({
        title: generatedReport.title,
        description: formattedDescription,
        severity: generatedReport.suggested_severity,
        priority: generatedReport.suggested_priority,
        project_id: parseInt(selectedProject),
      });

      onIssueCreated();
      onClose();
      setGeneratedReport(null);
      setPrompt('');
    } catch (err) {
      setError(err.message || 'Failed to create issue from report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', padding: '0.4rem', borderRadius: '8px' }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>AI Bug Report & One-Tap Voice Triage</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type or speak a short symptom and let Gemini synthesize a complete bug report.</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Input Phase */}
        {!generatedReport ? (
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label>Select Target Project</label>
              <select className="form-select" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label>Describe Bug / Symptom (Short Prompt or Speech)</label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: listening ? '#ef4444' : 'transparent', color: listening ? '#fff' : '#10b981' }}
                  onClick={handleStartVoiceTriage}
                >
                  <Mic size={14} className={listening ? 'animate-pulse' : ''} />
                  {listening ? 'Listening...' : '🎙️ Voice Triage'}
                </button>
              </div>

              <textarea
                className="form-textarea"
                rows={4}
                placeholder="e.g. Payment page crashes on Chrome mobile when clicking submit button..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-ai" disabled={loading || !prompt.trim()}>
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                {loading ? 'AI Synthesizing...' : 'Generate with Gemini AI'}
              </button>
            </div>
          </form>
        ) : (
          /* Preview & Edit Phase */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="badge badge-high">Suggested Severity: {generatedReport.suggested_severity}</span>
                <span className="badge badge-assigned">Priority: {generatedReport.suggested_priority}</span>
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f3f4f6', marginBottom: '0.5rem' }}>{generatedReport.title}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{generatedReport.description}</p>
            </div>

            <div className="form-group">
              <label>Steps to Reproduce</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={generatedReport.steps_to_reproduce}
                onChange={(e) => setGeneratedReport({ ...generatedReport, steps_to_reproduce: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Expected Behavior</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={generatedReport.expected_behavior}
                  onChange={(e) => setGeneratedReport({ ...generatedReport, expected_behavior: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Actual Behavior</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={generatedReport.actual_behavior}
                  onChange={(e) => setGeneratedReport({ ...generatedReport, actual_behavior: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setGeneratedReport(null)}>
                ← Back to Prompt
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCreateIssue} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                Confirm & Post Issue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
