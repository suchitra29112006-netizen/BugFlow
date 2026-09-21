import React, { useState, useEffect } from 'react';
import { Search, Bug, FolderKanban, User, ArrowRight, Command } from 'lucide-react';
import { api } from '../services/api';

export const CommandPalette = ({ isOpen, onClose, onSelectIssue, onSelectProject }) => {
  const [query, setQuery] = useState('');
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setIssues([]);
      setProjects([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [iss, proj] = await Promise.all([
          api.getIssues({ search: query }),
          api.getProjects()
        ]);
        setIssues(iss.slice(0, 5));
        setProjects(proj.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, background: 'rgba(0,0,0,0.65)' }} onClick={() => onClose(false)}>
      <div
        className="modal-card"
        style={{ width: '600px', padding: '1.25rem', top: '15%', transform: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', fontSize: '1.05rem', fontWeight: 600 }}
            placeholder="Type to search issues, projects, or users... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <span style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>
            Ctrl+K
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Searching workspace...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
            {issues.length > 0 && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                  Issues ({issues.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {issues.map(iss => (
                    <div
                      key={iss.id}
                      style={{ padding: '0.6rem 0.85rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => { onClose(false); onSelectIssue(iss.id); }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bug size={16} color="#10b981" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>#{iss.id} {iss.title}</span>
                      </div>
                      <span className={`badge badge-${iss.status.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '0.65rem' }}>{iss.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                  Projects ({projects.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {projects.map(p => (
                    <div
                      key={p.id}
                      style={{ padding: '0.6rem 0.85rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => { onClose(false); onSelectProject(p.id); }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FolderKanban size={16} color="#f97316" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.name}</span>
                      </div>
                      <ArrowRight size={14} color="var(--text-dim)" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {query.trim() && issues.length === 0 && projects.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                No matching issues or projects found for "{query}".
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
