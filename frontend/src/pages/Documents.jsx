import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  FileText, Plus, Download, Folder, Upload, Search, Filter, Sparkles,
  BookOpen, Layers, CheckCircle2, Clock, AlertCircle, ShieldAlert,
  Tag, ChevronRight, Eye, Grid, List, Table as TableIcon, Bot, ArrowRight,
  FileCode, TestTube, Rocket, LifeBuoy, FileSpreadsheet, User, Building2
} from 'lucide-react';

const DOCUMENT_TYPES = [
  'Requirement',
  'Product Spec',
  'Technical Spec',
  'API Docs',
  'Architecture',
  'Design',
  'Test Plan',
  'Test Report',
  'Release Note',
  'Incident Report',
  'Postmortem',
  'Runbook',
  'Engineering Decision',
  'Meeting Note',
  'Knowledge Article',
  'Other'
];

const CATEGORIES = [
  { key: 'ALL', label: 'All Documents', icon: BookOpen },
  { key: 'PRODUCT', label: 'Product & Specs', icon: Layers },
  { key: 'ENGINEERING', label: 'Engineering & Tech', icon: FileCode },
  { key: 'QUALITY', label: 'QA & Testing', icon: TestTube },
  { key: 'DELIVERY', label: 'Release & Delivery', icon: Rocket },
  { key: 'OPERATIONS', label: 'Ops & Runbooks', icon: LifeBuoy },
  { key: 'KNOWLEDGE', label: 'Knowledge Base', icon: BookOpen },
  { key: 'AI', label: 'AI Intelligence', icon: Sparkles }
];

const TEMPLATES = {
  'Requirement': `# Product Requirement Document (PRD)

## 1. Executive Summary
Brief high-level summary of the feature or product goal.

## 2. Problem Statement & User Value
Describe the user pain point and expected business outcome.

## 3. Functional Requirements
- **FR-01**: 
- **FR-02**: 

## 4. Non-Functional Requirements
- **Performance**: Latency < 200ms
- **Security**: RBAC authorization enforced on all endpoints
`,

  'Technical Spec': `# Technical Design Specification

## 1. System Architecture
Overview of components, microservices, and database models.

## 2. API Contract Specification
- **POST /api/endpoint**: Accepts JSON payload and returns state.

## 3. Data Schema & Persistence
SQLAlchemy models and SQLite migration strategies.

## 4. Verification & Testing Strategy
Unit tests and integration test criteria.
`,

  'API Docs': `# API Documentation & Contract

## Base Endpoint
\`GET /api/v1/resource\`

## Request Headers
\`\`\`json
{
  "Authorization": "Bearer <TOKEN>",
  "Content-Type": "application/json"
}
\`\`\`

## Response Schema
\`\`\`json
{
  "status": "success",
  "data": {}
}
\`\`\`
`,

  'Engineering Decision': `# Architecture Decision Record (ADR)

## Title: ADR-001 [Short Title]

### Status
Accepted / Proposed / Superseded

### Context
What issue or technical constraint are we addressing?

### Decision
What option did we choose and why?

### Consequences
Pros, cons, and future implications.
`,

  'Test Plan': `# QA Test Plan & Verification Matrix

## 1. Test Objectives
Ensure end-to-end reliability and defect zero-tolerance.

## 2. Test Environments
- Staging Environment (v3.5 Build)

## 3. Test Cases Matrix
| Test Case ID | Feature Scope | Pass/Fail Criteria | Severity |
|---|---|---|---|
| TC-101 | Auth JWT Refresh | Returns 200 OK | Critical |
| TC-102 | Workspace RBAC | Access Denied | High |
`,

  'Release Note': `# Release Notes - BugFlow v3.5

## 🚀 Highlights
- Introduced Enterprise Engineering Knowledge Hub.
- AI-Powered Sprint Intelligence and Burndown Forecasting.

## 🐛 Defect Fixes
- DEF-104: Fixed burndown chart date alignment.
- DEF-112: Resolved timezone mismatch in SLA triggers.
`
};

export const Documents = ({ projects = [], workspaces = [], departments = [], onSelectDocument }) => {
  const handleOpenDocument = (docId) => {
    if (onSelectDocument) {
      onSelectDocument(docId);
    } else {
      window.history.pushState({}, '', `/documents/${docId}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const [docs, setDocs] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDocType, setSelectedDocType] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'list'

  // AI Assistant Drawer state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // New Document Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ENGINEERING');
  const [docType, setDocType] = useState('Technical Spec');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [workspaceId, setWorkspaceId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('Architecture, Core');

  const fetchKnowledgeData = async () => {
    setLoading(true);
    try {
      const [docsData, kpisData] = await Promise.all([
        api.getDocuments({
          category: selectedCategory,
          document_type: selectedDocType,
          search: searchQuery
        }),
        api.getKnowledgeHubKPIs()
      ]);
      setDocs(docsData);
      setKpis(kpisData);
    } catch (err) {
      console.error("Failed to load Knowledge Hub data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeData();
  }, [selectedCategory, selectedDocType, searchQuery]);

  const handleApplyTemplate = (typeKey) => {
    setDocType(typeKey);
    if (TEMPLATES[typeKey]) {
      setContent(TEMPLATES[typeKey]);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const tagsArray = tagsInput.split(',').map(t => t.strip ? t.strip() : t.trim()).filter(Boolean);

      const payload = {
        title,
        description,
        category,
        document_type: docType,
        content,
        project_id: projectId ? parseInt(projectId) : null,
        workspace_id: workspaceId ? parseInt(workspaceId) : null,
        department_id: departmentId ? parseInt(departmentId) : null,
        status: 'PUBLISHED',
        version: 'v1.0',
        tags: tagsArray
      };

      const newDoc = await api.createDocument(payload);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setContent('');
      if (newDoc && newDoc.id) {
        navigate(`/documents/${newDoc.id}`);
      } else {
        fetchKnowledgeData();
      }
    } catch (err) {
      alert("Failed to create document: " + err.message);
    }
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.askKnowledgeAI(aiQuestion, null, selectedCategory);
      setAiAnswer(res);
    } catch (err) {
      alert("AI Assistant error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const getStatusBadgeClass = (statusStr) => {
    switch (statusStr) {
      case 'PUBLISHED': return 'badge badge-low';
      case 'APPROVED': return 'badge badge-low';
      case 'DRAFT': return 'badge badge-medium';
      case 'IN_REVIEW': return 'badge badge-high';
      default: return 'badge badge-low';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Engineering Knowledge Hub</h1>
            <span className="badge badge-high" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <Sparkles size={13} /> v3.5 Central Spec
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Centralized Repository for Product Requirements, Tech Specs, Architecture, Test Plans, API Contracts & Release Intelligence
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="btn" 
            onClick={() => setIsAiDrawerOpen(true)}
            style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(59, 130, 246, 0.2))', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#e9d5ff', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Bot size={16} /> Ask Knowledge AI
          </button>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <Plus size={16} /> + New Document
          </button>
        </div>
      </div>

      {/* 10 Real DB Metric KPI Section */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Documents</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{kpis.total_documents}</div>
            <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><CheckCircle2 size={11} /> Knowledge active</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Published</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{kpis.published_documents}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Approved specifications</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Drafts</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{kpis.draft_documents}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Work in progress</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recently Updated</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6' }}>{kpis.recently_updated}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Last 7 days activity</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Product Docs</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a855f7' }}>{kpis.project_docs}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PRDs & Requirements</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>API & Tech Specs</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#06b6d4' }}>{kpis.api_docs}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Architectural contracts</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Test & QA Docs</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ec4899' }}>{kpis.test_docs}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Plans & Test Reports</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Release Notes</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#84cc16' }}>{kpis.release_docs}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deployment logs</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Unassigned Owner</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{kpis.without_owner}</div>
            <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>Needs owner assign</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Requiring Review</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f97316' }}>{kpis.requiring_review}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pending approval</span>
          </div>
        </div>
      )}

      {/* Filter Bar & Category Tabs */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Top Search & Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              className="form-input"
              placeholder="Search specifications, architecture, API endpoints, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select 
              className="form-select"
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              style={{ minWidth: '160px' }}
            >
              <option value="ALL">All Document Types</option>
              {DOCUMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px' }}>
              <button 
                onClick={() => setViewMode('grid')}
                style={{ padding: '0.35rem 0.6rem', border: 'none', background: viewMode === 'grid' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: viewMode === 'grid' ? '#3b82f6' : 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer' }}
                title="Grid View"
              >
                <Grid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                style={{ padding: '0.35rem 0.6rem', border: 'none', background: viewMode === 'table' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: viewMode === 'table' ? '#3b82f6' : 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer' }}
                title="Table View"
              >
                <TableIcon size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                style={{ padding: '0.35rem 0.6rem', border: 'none', background: viewMode === 'list' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: viewMode === 'list' ? '#3b82f6' : 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer' }}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 7 Category Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: active ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                  background: active ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                  color: active ? '#60a5fa' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Knowledge Hub specifications...</div>
      ) : docs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <BookOpen size={36} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>No Documents Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
            No engineering documentation matches the selected category or search filter.
          </p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Create First Specification
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {docs.map(doc => (
            <div 
              key={doc.id} 
              className="glass-panel hover-card" 
              onClick={() => handleOpenDocument(doc.id)}
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={getStatusBadgeClass(doc.status)} style={{ fontSize: '0.7rem' }}>
                  {doc.document_type}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                  {doc.version}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>{doc.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {doc.description || doc.content || "No detailed summary provided."}
                </p>
              </div>

              {/* Tags */}
              {doc.tags && doc.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {doc.tags.map((t, idx) => (
                    <span key={idx} style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={13} />
                  <span>{doc.author_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span>{doc.relations_count} links</span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Title & Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem' }}>Version</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Author / Owner</th>
                <th style={{ padding: '0.75rem 1rem' }}>Relations</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => handleOpenDocument(doc.id)}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{doc.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.document_type}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>{doc.category}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#60a5fa' }}>{doc.version}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={getStatusBadgeClass(doc.status)} style={{ fontSize: '0.7rem' }}>{doc.status}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {doc.author_name}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>{doc.relations_count} linked</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>View Workspace</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Detailed List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {docs.map(doc => (
            <div 
              key={doc.id} 
              className="glass-panel hover-card" 
              onClick={() => handleOpenDocument(doc.id)}
              style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', shrink: 0 }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{doc.title}</h3>
                    <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>{doc.document_type}</span>
                    <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>{doc.version}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {doc.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', shrink: 0 }}>
                <span className={getStatusBadgeClass(doc.status)}>{doc.status}</span>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ask Knowledge AI Drawer */}
      {isAiDrawerOpen && (
        <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div style={{ width: '500px', maxWidth: '100vw', height: '100vh', background: 'var(--bg-main)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bot size={20} color="#a855f7" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Ask Knowledge AI Copilot</h2>
              </div>
              <button className="btn btn-secondary" onClick={() => setIsAiDrawerOpen(false)} style={{ padding: '0.2rem 0.5rem' }}>✕</button>
            </div>

            <form onSubmit={handleAskAI} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ask e.g. What is the OAuth API auth flow?"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={aiLoading}>
                {aiLoading ? 'Asking...' : 'Ask'}
              </button>
            </form>

            {aiAnswer && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.5rem' }}>AI Response</h4>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-line', color: 'var(--text-main)' }}>
                    {aiAnswer.answer}
                  </div>
                </div>

                {aiAnswer.citations && aiAnswer.citations.length > 0 && (
                  <div>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Cited Knowledge Sources:</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {aiAnswer.citations.map(c => (
                        <div key={c.id} onClick={() => { setIsAiDrawerOpen(false); navigate(`/documents/${c.id}`); }} style={{ padding: '0.6rem 0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{c.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.document_type} | {c.version}</div>
                          </div>
                          <ChevronRight size={14} color="#60a5fa" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Document Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '750px', width: '90vw' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Create Engineering Specification</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Select a category and engineering document type to pre-fill standard architectural templates.
            </p>

            <form onSubmit={handleCreateDocument}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Document Title *</label>
                  <input type="text" className="form-input" placeholder="e.g. Defect Intelligence Engine Design Specification" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="PRODUCT">PRODUCT (Requirements & Specs)</option>
                    <option value="ENGINEERING">ENGINEERING (Tech Specs, API, ADRs)</option>
                    <option value="QUALITY">QUALITY (Test Plans & Reports)</option>
                    <option value="DELIVERY">DELIVERY (Release Notes)</option>
                    <option value="OPERATIONS">OPERATIONS (Incident & Runbooks)</option>
                    <option value="KNOWLEDGE">KNOWLEDGE (Articles & Wiki)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Document Type</label>
                  <select className="form-select" value={docType} onChange={(e) => handleApplyTemplate(e.target.value)}>
                    {DOCUMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Project</label>
                  <select className="form-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    <option value="">No Project (Global Spec)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tags (Comma separated)</label>
                  <input type="text" className="form-input" placeholder="Architecture, API, Security" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Summary / Short Description</label>
                  <input type="text" className="form-input" placeholder="Brief outline of goals and architectural constraints" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Specification Markdown Content</label>
                  <textarea className="form-textarea" rows={8} value={content} onChange={(e) => setContent(e.target.value)} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">+ Create Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
