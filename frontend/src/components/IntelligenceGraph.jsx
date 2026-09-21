import React, { useState } from 'react';
import { Network, Layers, GitBranch, ShieldAlert, CheckCircle2, User, Target } from 'lucide-react';

export function IntelligenceGraph() {
  const [selectedNode, setSelectedNode] = useState(null);

  const nodes = [
    { id: 'g1', type: 'GOAL', label: 'Goal: Zero Critical Escapes', color: '#10b981' },
    { id: 'p1', type: 'PROJECT', label: 'Project: BugFlow Platform', color: '#3b82f6' },
    { id: 't1', type: 'TEAM', label: 'Team: Backend Squad', color: '#8b5cf6' },
    { id: 'b1', type: 'BUG', label: 'BUG-421: Token Expiry NPE', color: '#ef4444' },
    { id: 'tc1', type: 'TEST', label: 'Test: Token Refresh Rotation', color: '#f59e0b' },
    { id: 'r1', type: 'RELEASE', label: 'Release: v2.4.0', color: '#06b6d4' },
    { id: 'inc1', type: 'INCIDENT', label: 'Incident: INC-101 Outage', color: '#ec4899' },
  ];

  const connections = [
    { from: 'Goal: Zero Critical Escapes', to: 'Project: BugFlow Platform' },
    { from: 'Project: BugFlow Platform', to: 'Team: Backend Squad' },
    { from: 'Team: Backend Squad', to: 'BUG-421: Token Expiry NPE' },
    { from: 'BUG-421: Token Expiry NPE', to: 'Test: Token Refresh Rotation' },
    { from: 'BUG-421: Token Expiry NPE', to: 'Release: v2.4.0' },
    { from: 'BUG-421: Token Expiry NPE', to: 'Incident: INC-101 Outage' },
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Network size={20} color="#10b981" /> Engineering Intelligence Graph & Blast Radius
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Visualizes connected relationships between Goals → Projects → Squads → Defects → Tests → Releases → Incidents.
          </p>
        </div>
      </div>

      {/* Graph Visualizer Node Flow */}
      <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '2rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
        {nodes.map((node) => (
          <div
            key={node.id}
            onClick={() => setSelectedNode(node)}
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: '12px',
              background: `rgba(${parseInt(node.color.slice(1,3),16)}, ${parseInt(node.color.slice(3,5),16)}, ${parseInt(node.color.slice(5,7),16)}, 0.15)`,
              border: `2px solid ${node.color}`,
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: selectedNode?.id === node.id ? `0 0 16px ${node.color}` : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: node.color }} />
            {node.label}
          </div>
        ))}
      </div>

      {/* Traversal Connection Details */}
      <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: 'var(--text-primary)' }}>Connected Traversal Graph Summary</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', color: 'var(--text-muted)' }}>
          {connections.map((c, i) => (
            <span key={i} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              {c.from} <strong style={{ color: '#10b981' }}>→</strong> {c.to}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
