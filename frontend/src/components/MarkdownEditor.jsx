import React, { useState } from 'react';
import { Bold, Italic, Code, List, Quote, Eye, Edit3 } from 'lucide-react';

export const MarkdownEditor = ({ value, onChange, placeholder, rows = 5 }) => {
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'

  const insertFormatting = (syntax) => {
    let insertedText = '';
    if (syntax === 'bold') insertedText = '**bold text**';
    else if (syntax === 'italic') insertedText = '*italic text*';
    else if (syntax === 'code') insertedText = '`code snippet`';
    else if (syntax === 'list') insertedText = '\n- Item 1\n- Item 2\n';
    else if (syntax === 'quote') insertedText = '\n> Blockquote text\n';

    onChange(value ? `${value}\n${insertedText}` : insertedText);
  };

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
      
      {/* Editor Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => insertFormatting('bold')} title="Bold">
            <Bold size={13} />
          </button>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => insertFormatting('italic')} title="Italic">
            <Italic size={13} />
          </button>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => insertFormatting('code')} title="Inline Code">
            <Code size={13} />
          </button>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => insertFormatting('list')} title="Bullet List">
            <List size={13} />
          </button>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => insertFormatting('quote')} title="Quote">
            <Quote size={13} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'write' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
            onClick={() => setActiveTab('write')}
          >
            <Edit3 size={12} /> Write
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
            onClick={() => setActiveTab('preview')}
          >
            <Eye size={12} /> Preview
          </button>
        </div>
      </div>

      {/* Write View */}
      {activeTab === 'write' ? (
        <textarea
          className="form-textarea"
          rows={rows}
          style={{ border: 'none', borderRadius: 0, padding: '0.85rem', width: '100%', resize: 'vertical' }}
          placeholder={placeholder || 'Markdown supported (**bold**, `code`, etc.)...'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div style={{ padding: '0.85rem', minHeight: `${rows * 24}px`, whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.6, background: 'rgba(0,0,0,0.02)' }}>
          {value ? value : <span style={{ color: 'var(--text-muted)' }}>Nothing to preview.</span>}
        </div>
      )}

    </div>
  );
};
