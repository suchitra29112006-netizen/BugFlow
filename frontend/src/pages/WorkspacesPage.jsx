import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, Layers, Globe, Lock, Shield, Eye, X } from 'lucide-react';
import { api } from '../services/api';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewWsOpen, setIsNewWsOpen] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [wsVisibility, setWsVisibility] = useState('Organization');

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/workspaces');
      setWorkspaces(res || []);
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWs = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/workspaces', {
        name: wsName,
        description: wsDesc,
        visibility: wsVisibility
      });
      setWsName('');
      setWsDesc('');
      setIsNewWsOpen(false);
      fetchWorkspaces();
    } catch (err) {
      alert("Failed to create workspace: " + (err.message || err));
    }
  };

  if (loading) {
    return <div style={{ padding: '2.5rem', color: 'var(--text-muted)' }}>Loading Workspaces...</div>;
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FolderKanban size={26} color="#3b82f6" /> Workspaces & Project Portfolios
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Workspaces group related engineering projects, repositories, and defect boards.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => setIsNewWsOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> + New Workspace
        </button>
      </div>

      {/* Workspaces Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {workspaces.map((ws) => (
          <div key={ws.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${ws.color_theme || '#10b981'}20`, color: ws.color_theme || '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderKanban size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{ws.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{ws.projects_count || 3} Projects</span>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', fontWeight: 700 }}>
                {ws.visibility || 'Organization'}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{ws.description || 'Central repository workspace'}</p>
          </div>
        ))}
      </div>

      {/* New Workspace Modal */}
      {isNewWsOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FolderKanban size={20} color="#3b82f6" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Create Workspace</h2>
              </div>
              <button onClick={() => setIsNewWsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWs} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Workspace Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Platform Infrastructure Workspace" value={wsName} onChange={e => setWsName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Visibility</label>
                <select className="form-select" value={wsVisibility} onChange={e => setWsVisibility(e.target.value)}>
                  <option value="Organization">Organization (All Members)</option>
                  <option value="Private">Private (Members Only)</option>
                  <option value="Public">Public</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Workspace purpose..." value={wsDesc} onChange={e => setWsDesc(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsNewWsOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Workspace</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
