import React, { useState } from 'react';
import { UploadCloud, File, Check, X } from 'lucide-react';

export const DragDropUpload = ({ selectedFile, onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: isDragging ? '2px dashed #10b981' : '2px dashed var(--border-color)',
        borderRadius: '10px',
        padding: '1.25rem',
        textAlign: 'center',
        background: isDragging ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.02)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      <input
        type="file"
        id="drag-drop-file-input"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
        onChange={(e) => onFileSelect(e.target.files[0] || null)}
        accept="image/*,video/*,.log,.txt,.pdf"
      />

      {selectedFile ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <File size={20} color="#10b981" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{selectedFile.name}</span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
            onClick={(e) => { e.stopPropagation(); onFileSelect(null); }}
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
          <UploadCloud size={24} color={isDragging ? '#10b981' : 'var(--text-muted)'} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {isDragging ? 'Drop file to upload...' : 'Drag & Drop screenshot, video, or log file here'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>or click to browse files</span>
        </div>
      )}
    </div>
  );
};
