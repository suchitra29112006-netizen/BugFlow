import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Play, Pause, SkipBack, SkipForward, X, Clock, History, AlertTriangle, CheckCircle, MessageSquare, UserCheck, RefreshCw } from 'lucide-react';

export const DefectLifecycleReplayModal = ({ isOpen, onClose, issueId }) => {
  const [replayData, setReplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isOpen && issueId) {
      setLoading(true);
      setError('');
      api.getDefectLifecycleReplay(issueId)
        .then(data => {
          setReplayData(data);
          setCurrentStep(0);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Failed to load lifecycle replay data.');
          setLoading(false);
        });
    }
  }, [isOpen, issueId]);

  useEffect(() => {
    let timer;
    if (isPlaying && replayData?.timeline) {
      timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < replayData.timeline.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, replayData]);

  if (!isOpen) return null;

  const timeline = replayData?.timeline || [];
  const activeEvent = timeline[currentStep];

  const getEventIcon = (type) => {
    switch (type) {
      case 'created': return <History size={16} color="#3b82f6" />;
      case 'assignment': return <UserCheck size={16} color="#a855f7" />;
      case 'status_change': return <RefreshCw size={16} color="#f59e0b" />;
      case 'comment': return <MessageSquare size={16} color="#10b981" />;
      default: return <Clock size={16} color="#6b7280" />;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '750px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={22} color="#06b6d4" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Defect Lifecycle Time-Machine Replay</h3>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Reconstructing defect timeline events...
          </div>
        ) : error ? (
          <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px' }}>
            {error}
          </div>
        ) : timeline.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No lifecycle events recorded for this defect yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Top Summary Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL LIFECYCLE DURATION</span>
                <strong style={{ fontSize: '0.95rem', color: '#06b6d4' }}>{replayData?.total_duration_hours || 0} Hours</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>STATE TRANSITIONS</span>
                <strong style={{ fontSize: '0.95rem', color: '#a855f7' }}>{replayData?.state_transition_count || 0} Changes</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>REOPEN COUNT</span>
                <strong style={{ fontSize: '0.95rem', color: replayData?.reopen_count > 0 ? '#ef4444' : '#10b981' }}>{replayData?.reopen_count || 0} Times</strong>
              </div>
            </div>

            {/* Playback Controls & Scrubber */}
            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Step {currentStep + 1} of {timeline.length}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.6rem' }}
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  >
                    <SkipBack size={14} />
                  </button>

                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    {isPlaying ? 'Pause' : 'Play Replay'}
                  </button>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.6rem' }}
                    disabled={currentStep === timeline.length - 1}
                    onClick={() => setCurrentStep(prev => Math.min(timeline.length - 1, prev + 1))}
                  >
                    <SkipForward size={14} />
                  </button>
                </div>
              </div>

              {/* Progress Scrubber */}
              <input
                type="range"
                min={0}
                max={timeline.length - 1}
                value={currentStep}
                onChange={(e) => setCurrentStep(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#06b6d4' }}
              />
            </div>

            {/* Active Step Highlight Card */}
            {activeEvent && (
              <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem', color: '#06b6d4' }}>
                    {getEventIcon(activeEvent.type)}
                    {activeEvent.title}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(activeEvent.timestamp).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: '0.35rem 0' }}>
                  {activeEvent.description}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <span>Actor: <strong>{activeEvent.actor || 'System'}</strong></span>
                  {activeEvent.duration_in_step && <span>Phase Elapsed: <strong>{activeEvent.duration_in_step}</strong></span>}
                </div>
              </div>
            )}

            {/* Event Timeline List */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {timeline.map((ev, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: idx === currentStep ? '1px solid #06b6d4' : '1px solid var(--border-color)',
                    background: idx === currentStep ? 'rgba(6, 182, 212, 0.12)' : 'rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getEventIcon(ev.type)}
                    <span style={{ fontSize: '0.82rem', fontWeight: idx === currentStep ? 700 : 500 }}>
                      Step #{idx + 1}: {ev.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
