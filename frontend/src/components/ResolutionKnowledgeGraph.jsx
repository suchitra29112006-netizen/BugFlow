import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Network, Sparkles, Layers, ShieldAlert, X, MousePointerClick } from 'lucide-react';

export const ResolutionKnowledgeGraphModal = ({ isOpen, onClose, issueId }) => {
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && issueId) {
      setLoading(true);
      setSelectedNode(null);
      api.getResolutionKnowledgeGraph(issueId)
        .then(data => setGraphData(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, issueId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '780px', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: 800, fontSize: '1.2rem' }}>
            <Network size={22} />
            Phase 6: Resolution Knowledge Graph
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Calculating connected graph relationship nodes...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Systemic Cluster Insight Banner */}
            {graphData?.systemic_cluster_insight && (
              <div style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, color: '#a855f7', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} />
                {graphData.systemic_cluster_insight}
              </div>
            )}

            {/* Interactive Nodes Visual Matrix */}
            <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '280px', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#09101d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 800 }}>
                <span>CONNECTED KNOWLEDGE GRAPH NODES</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MousePointerClick size={14} /> Click nodes to inspect relationships</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                {graphData?.nodes?.map((node) => {
                  const isSel = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      style={{
                        padding: '0.75rem 1.1rem',
                        borderRadius: '10px',
                        background: isSel ? node.color : `${node.color}20`,
                        border: `2px solid ${node.color}`,
                        color: isSel ? '#fff' : node.color,
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        boxShadow: `0 0 14px ${node.color}40`,
                        transform: isSel ? 'scale(1.05)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setSelectedNode(isSel ? null : node)}
                    >
                      <span style={{ fontSize: '0.68rem', display: 'block', opacity: 0.8, textTransform: 'uppercase' }}>{node.type}</span>
                      {node.label}
                    </div>
                  );
                })}
              </div>

              {/* Node Inspector Detail */}
              {selectedNode && (
                <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '0.85rem' }}>
                  <strong style={{ color: selectedNode.color }}>Inspect Node ({selectedNode.type}):</strong> {selectedNode.label}
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Connected across {graphData?.edges?.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} graph relationship edges.
                  </p>
                </div>
              )}

              {/* Edge Relationships List */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>GRAPH EDGES & RELATIONSHIPS:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                  {graphData?.edges?.map((e, idx) => (
                    <div key={idx} style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>{e.source}</span> —[{e.relation}]→ <span style={{ color: '#c084fc', fontWeight: 700 }}>{e.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
