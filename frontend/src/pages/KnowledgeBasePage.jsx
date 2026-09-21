import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Tag, 
  FileText, 
  X, 
  Trash2, 
  Sparkles, 
  Folder, 
  Clock, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { api } from '../services/api';

export function KnowledgeBasePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [readingArticle, setReadingArticle] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Architecture');
  const [tags, setTags] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/knowledge-base/articles');
      setArticles(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load knowledge base articles:", err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!title || !contentMarkdown) return;
    setSubmitting(true);

    try {
      await api.post('/api/v1/knowledge-base/articles', {
        title,
        category,
        tags,
        content_markdown: contentMarkdown
      });

      // Reset form & reload
      setTitle('');
      setCategory('Architecture');
      setTags('');
      setContentMarkdown('');
      setIsCreateOpen(false);
      fetchArticles();
    } catch (err) {
      alert("Failed to create article: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async (articleId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this documentation article?")) return;

    try {
      await api.delete(`/api/v1/knowledge-base/articles/${articleId}`);
      if (readingArticle?.id === articleId) setReadingArticle(null);
      fetchArticles();
    } catch (err) {
      alert("Failed to delete article: " + (err.message || err));
    }
  };

  const filteredArticles = articles.filter((art) => {
    const matchesSearch = 
      !searchTerm ||
      art.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.content_markdown?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.tags?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || art.category?.toUpperCase() === categoryFilter.toUpperCase();
    return matchesSearch && matchesCategory;
  });

  const categoriesList = ['ALL', 'Architecture', 'AI Intelligence', 'Coding Standards', 'Runbooks', 'Security'];

  if (loading) {
    return (
      <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Loading Engineering Knowledge Base...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Engineering Knowledge Base</h1>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              System architecture guides, API documentation, AI algorithms, and team runbooks.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          <Plus size={16} /> Add Documentation Article
        </button>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search articles by title, tags, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.4rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, marginRight: '0.25rem' }}>Category:</span>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '0.35rem 0.7rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: categoryFilter.toUpperCase() === cat.toUpperCase() ? '#3b82f6' : 'var(--border-color)',
                background: categoryFilter.toUpperCase() === cat.toUpperCase() ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: categoryFilter.toUpperCase() === cat.toUpperCase() ? '#3b82f6' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article Grid */}
      {filteredArticles.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', borderRadius: '14px', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No documentation articles found</h3>
          <p style={{ fontSize: '0.88rem', margin: 0, color: 'var(--text-dim)' }}>Try adjusting your search criteria or create a new article for your engineering team.</p>
          <button
            onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); }}
            className="btn-secondary"
            style={{ marginTop: '1rem', padding: '0.45rem 0.9rem', fontSize: '0.82rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredArticles.map((art) => {
            const tagArray = art.tags ? art.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

            return (
              <div 
                key={art.id} 
                className="glass-panel" 
                onClick={() => setReadingArticle(art)}
                style={{ 
                  padding: '1.4rem', 
                  borderRadius: '14px', 
                  border: '1px solid var(--border-color)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.85rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '0.73rem', 
                    padding: '0.2rem 0.55rem', 
                    borderRadius: '12px', 
                    background: 'rgba(59, 130, 246, 0.15)', 
                    color: '#3b82f6', 
                    fontWeight: 700 
                  }}>
                    {art.category}
                  </span>
                  
                  <button
                    onClick={(e) => handleDeleteArticle(art.id, e)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.2rem' }}
                    title="Delete Article"
                  >
                    <Trash2 size={16} style={{ hover: { color: '#ef4444' } }} />
                  </button>
                </div>

                <h3 style={{ fontSize: '1.08rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {art.title}
                </h3>

                <p style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--text-muted)', 
                  margin: 0, 
                  display: '-webkit-box', 
                  WebkitLineClamp: 3, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden',
                  lineHeight: 1.5 
                }}>
                  {art.content_markdown}
                </p>

                {/* Tags */}
                {tagArray.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    {tagArray.map((t, idx) => (
                      <span key={idx} style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                  <FileText size={14} /> Read Full Document →
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Article Modal */}
      {isCreateOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '650px',
            borderRadius: '16px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card, #121824)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <BookOpen size={20} color="#3b82f6" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Create Documentation Article</h2>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Article Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Microservice Auth Architecture & JWT Rotation" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    className="form-select" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Architecture">Architecture</option>
                    <option value="AI Intelligence">AI Intelligence</option>
                    <option value="Coding Standards">Coding Standards</option>
                    <option value="Runbooks">Runbooks</option>
                    <option value="Security">Security</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tags (Comma-separated)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="auth, jwt, security" 
                    value={tags} 
                    onChange={(e) => setTags(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Content (Markdown)</label>
                <textarea 
                  className="form-textarea" 
                  rows={8} 
                  placeholder="Write documentation content in Markdown format..." 
                  value={contentMarkdown} 
                  onChange={(e) => setContentMarkdown(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)} 
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submitting}
                  style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {submitting ? 'Publishing...' : 'Publish Documentation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Article Reader Modal */}
      {readingArticle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '750px',
            maxHeight: '85vh',
            overflowY: 'auto',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card, #121824)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 700 }}>
                  {readingArticle.category}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}>
                  {readingArticle.title}
                </h2>
              </div>
              <button 
                onClick={() => setReadingArticle(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ 
              background: 'rgba(0,0,0,0.25)', 
              padding: '1.25rem', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-primary)', 
              fontSize: '0.92rem', 
              lineHeight: 1.7, 
              whiteSpace: 'pre-line' 
            }}>
              {readingArticle.content_markdown}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {readingArticle.tags && readingArticle.tags.split(',').map((t, i) => (
                  <span key={i} style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    #{t.trim()}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setReadingArticle(null)}
                className="btn-secondary"
                style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Close Article Reader
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
