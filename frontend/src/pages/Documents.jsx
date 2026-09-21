import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FileText, Plus, Download, Folder, Upload } from 'lucide-react';

export const Documents = ({ projects }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Requirements');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);

  const fetchDocs = async () => {
    try {
      const data = await api.getDocuments();
      setDocs(data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('project_id', projectId);
      if (content) formData.append('content', content);
      if (file) formData.append('file', file);

      await api.createDocument(formData);
      setTitle('');
      setContent('');
      setFile(null);
      setIsModalOpen(false);
      fetchDocs();
    } catch (err) {
      alert("Failed to create document: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading documents...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Project Documents & Knowledge Base</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Central repository for Requirements, Test Reports, API Docs, and Release Notes.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Document
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {docs.map(d => (
          <div key={d.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-low" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>{d.category}</span>
              <FileText size={18} color="#3b82f6" />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{d.title}</h3>
            {d.content && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{d.content}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span>By {d.author_name}</span>
              {d.file_path && (
                <a href={d.file_path} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                  <Download size={12} /> File
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Add Document / Report</h3>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Document Title</label>
                <input type="text" className="form-input" placeholder="e.g. Authentication API Specification" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Requirements">Requirements</option>
                  <option value="Test Reports">Test Reports</option>
                  <option value="API Documentation">API Documentation</option>
                  <option value="Release Notes">Release Notes</option>
                </select>
              </div>
              <div className="form-group">
                <label>Target Project</label>
                <select className="form-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Document Content / Summary</label>
                <textarea className="form-textarea" rows={3} value={content} onChange={(e) => setContent(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Upload PDF / File (Optional)</label>
                <input type="file" className="form-input" onChange={(e) => setFile(e.target.files[0] || null)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
