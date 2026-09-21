import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  FolderKanban, 
  ShieldCheck, 
  Activity, 
  Award, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  UserPlus, 
  FileText, 
  Pin, 
  Clock, 
  AlertTriangle, 
  Layers, 
  ArrowUpRight, 
  Copy, 
  Check,
  Briefcase,
  ChevronRight,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import OrgSwitcher from '../components/OrgSwitcher';
import OrgWizardModal from '../components/OrgWizardModal';
import OrgSettingsModal from '../components/OrgSettingsModal';

export function OrgOverview({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Executive Brief Modal State
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [briefData, setBriefData] = useState(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Squad Detail Drawer State
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [squadDetailData, setSquadDetailData] = useState(null);

  // Invite Member Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');

  useEffect(() => {
    fetchOrgOverview();
  }, []);

  const fetchOrgOverview = async (orgId = null) => {
    try {
      const url = orgId ? `/api/v1/organizations/overview?org_id=${orgId}` : '/api/v1/organizations/overview';
      const res = await api.get(url);
      setData(res);
    } catch (err) {
      console.error("Failed to load org overview:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExecutiveBrief = async () => {
    setIsBriefModalOpen(true);
    setLoadingBrief(true);
    try {
      const res = await api.post('/api/v1/organizations/executive-brief');
      setBriefData(res);
    } catch (err) {
      console.error("Failed to generate executive brief:", err);
    } finally {
      setLoadingBrief(false);
    }
  };

  const handleCopyBrief = () => {
    if (!briefData) return;
    const text = `BUGFLOW AI EXECUTIVE BRIEF - ${briefData.organization_name}\nSummary: ${briefData.executive_summary}\n\nMetrics:\n- Health: ${briefData.key_metrics?.platform_health_pct}%\n- Active Defects: ${briefData.key_metrics?.active_open_defects}\n- Critical: ${briefData.key_metrics?.critical_defects_open}\n\nStrategic Highlights:\n${briefData.strategic_highlights?.map(h => '• ' + h).join('\n')}\n\nRecommendations:\n${briefData.engineering_recommendations?.map(r => '• ' + r).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/organizations/invite-member', {
        email: inviteEmail,
        name: inviteName,
        role: inviteRole
      });
      alert(`Invited ${inviteName} (${inviteEmail}) to organization.`);
      setInviteEmail('');
      setInviteName('');
      setIsInviteOpen(false);
      fetchOrgOverview();
    } catch (err) {
      alert("Failed to invite member: " + (err.message || err));
    }
  };

  const handleTogglePin = async (docId, currentPin, e) => {
    e.stopPropagation();
    try {
      await api.put(`/api/v1/organizations/documents/${docId}/pin`, {
        is_pinned: !currentPin
      });
      fetchOrgOverview();
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Initializing Organization AI Command Center...</p>
      </div>
    );
  }

  const org = data?.organization || { name: 'BugFlow Technologies', description: 'AI-Powered Engineering Platform' };
  const stats = data?.stats || { total_departments: 4, total_teams: 4, total_members: 8, platform_health_pct: 94.5, total_open_bugs: 12, critical_unresolved: 2, sla_breached: 1, resolved_this_week: 18 };
  const departments = data?.departments || [];
  const squads = data?.squads || [];
  const projectsRollup = data?.projects_rollup || [];
  const peopleWorkload = data?.people_workload || [];
  const heatmap = data?.workload_heatmap || [];
  const sprintsEnding = data?.sprints_ending_this_week || [];
  const dependencies = data?.cross_squad_dependencies || [];
  const pinnedDocs = data?.pinned_documents || [];
  const healthTrend = data?.health_trend_8_weeks || [];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. Header Banner & Actions */}
      <div className="glass-panel" style={{ position: 'relative', zIndex: 100, padding: '1.75rem 2rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 101 }}>
          <div 
            style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.15s ease' }}
            title="Click to open Organization Detail view"
            onClick={() => onNavigate && onNavigate('org_detail', org.id)}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.25)', flexShrink: 0 }}>
              <Building2 size={30} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div onClick={(e) => e.stopPropagation()}>
                  <OrgSwitcher 
                    activeOrg={org} 
                    onSelectOrg={(selected) => {
                      if (selected?.id) {
                        fetchOrgOverview(selected.id);
                        if (onNavigate) onNavigate('org_detail', selected.id);
                      }
                    }} 
                    onOpenWizard={() => setIsWizardOpen(true)} 
                  />
                </div>
                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                  AI WORK MANAGEMENT OS
                </span>
                <span style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
                  {org.plan || 'Enterprise Tier'}
                </span>
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800 }}>
                  🔍 Detail View →
                </span>
              </div>
              <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {org.description} • {org.industry || 'Software Engineering'} • {org.company_size || '50-200 Members'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsWizardOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.95rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> + New Org
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsSettingsModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.95rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <Settings size={16} /> ⚙ Org Settings
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleOpenExecutiveBrief}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', border: 'none', color: '#fff', fontWeight: 700, padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <Sparkles size={16} color="#fff" /> AI Executive Brief
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 4 Interactive KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" onClick={() => onNavigate && onNavigate('issues')} style={{ padding: '1.25rem', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>TOTAL OPEN DEFECTS</span>
            <ArrowUpRight size={16} style={{ color: 'var(--text-dim)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-primary)' }}>
            {stats.total_open_bugs || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontWeight: 600 }}>
            <TrendingDown size={14} /> {stats.open_bugs_trend || '↓ 8% vs last week'}
          </div>
        </div>

        <div className="glass-panel" onClick={() => onNavigate && onNavigate('issues')} style={{ padding: '1.25rem', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s ease', border: (stats.critical_unresolved || 0) > 0 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>CRITICAL UNRESOLVED</span>
            <ArrowUpRight size={16} style={{ color: 'var(--text-dim)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: (stats.critical_unresolved || 0) > 0 ? '#ef4444' : '#10b981' }}>
            {stats.critical_unresolved || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: (stats.critical_unresolved || 0) > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontWeight: 600 }}>
            <AlertTriangle size={14} /> {stats.critical_trend || '↑ 1 vs last week'}
          </div>
        </div>

        <div className="glass-panel" onClick={() => onNavigate && onNavigate('issues')} style={{ padding: '1.25rem', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>SLA BREACHED</span>
            <ArrowUpRight size={16} style={{ color: 'var(--text-dim)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: (stats.sla_breached || 0) > 0 ? '#f59e0b' : '#10b981' }}>
            {stats.sla_breached || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontWeight: 600 }}>
            <Clock size={14} /> {stats.sla_trend || '↑ 2 vs last week'}
          </div>
        </div>

        <div className="glass-panel" onClick={() => onNavigate && onNavigate('issues')} style={{ padding: '1.25rem', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>RESOLVED THIS WEEK</span>
            <ArrowUpRight size={16} style={{ color: 'var(--text-dim)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: '#10b981' }}>
            {stats.resolved_this_week || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontWeight: 600 }}>
            <TrendingUp size={14} /> {stats.resolved_trend || '↑ 12% vs last week'}
          </div>
        </div>
      </div>

      {/* 3. Organization Health & 8-Week Trend */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ borderRight: '1px dashed var(--border-color)', paddingRight: '1.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block' }}>ORGANIZATION HEALTH RATING</span>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10b981', margin: '0.2rem 0' }}>
            {stats.platform_health_pct}%
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Computed from real-time SLA compliance, defect resolution rate, and critical bug backlog.
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>8-Week Health Score Trend</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>+6.0% Overall Improvement</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '80px', gap: '0.5rem', paddingTop: '0.5rem' }}>
            {healthTrend.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{h.health_score}%</span>
                <div style={{ 
                  width: '100%', 
                  maxWidth: '32px', 
                  height: `${(h.health_score / 100) * 55}px`, 
                  background: i === healthTrend.length - 1 ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' : 'rgba(59, 130, 246, 0.4)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.4s ease'
                }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h.week}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Departments & Squads */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Engineering Departments & Squads</h2>
          <button 
            onClick={() => onNavigate && onNavigate('departments')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Manage Departments →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem' }}>
          {departments.map((dept) => (
            <div key={dept.id} className="glass-panel" style={{ padding: '1.4rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{dept.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{dept.teams_count || dept.squads_count} Squads • {dept.members_count} Members</span>
                </div>
                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '12px', background: dept.health_status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: dept.health_status === 'HEALTHY' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                  {dept.health_status || 'HEALTHY'}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{dept.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', background: 'rgba(0,0,0,0.18)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>Open Defects</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{dept.open_bugs || 0} Open</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>Critical</span>
                  <strong style={{ color: (dept.critical_bugs || 0) > 0 ? '#ef4444' : '#10b981' }}>{dept.critical_bugs || 0} Critical</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Executive Brief Modal */}
      {isBriefModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1.5rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', borderRadius: '16px', padding: '2rem', border: '1px solid #10b981', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>AI Executive Brief</h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{org.name} • Real-time Engineering Synthesis</span>
                </div>
              </div>
              <button onClick={() => setIsBriefModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}>
                <X size={20} />
              </button>
            </div>

            {loadingBrief ? (
              <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Sparkles className="spin" size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
                <div>Synthesizing organization velocity, defect trends, and SLA risk metrics...</div>
              </div>
            ) : briefData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  <strong style={{ color: '#10b981', display: 'block', marginBottom: '0.35rem' }}>Executive Summary</strong>
                  {briefData.executive_summary}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Platform Health</span>
                    <strong style={{ fontSize: '1.2rem', color: '#10b981' }}>{briefData.key_metrics?.platform_health_pct}%</strong>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Active Defects</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{briefData.key_metrics?.active_open_defects}</strong>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Critical Open</span>
                    <strong style={{ fontSize: '1.2rem', color: briefData.key_metrics?.critical_defects_open > 0 ? '#ef4444' : '#10b981' }}>{briefData.key_metrics?.critical_defects_open}</strong>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Strategic Highlights</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {briefData.strategic_highlights?.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <CheckCircle2 size={16} color="#10b981" /> {h}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>AI Engineering Recommendations</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {briefData.engineering_recommendations?.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <AlertCircle size={16} color="#3b82f6" /> {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={handleOpenExecutiveBrief} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                  <Sparkles size={14} /> Regenerate
                </button>
                <button className="btn-secondary" onClick={handleCopyBrief} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                  {copiedBrief ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copiedBrief ? 'Copied!' : 'Copy Brief'}
                </button>
              </div>
              <button className="btn btn-secondary" onClick={() => setIsBriefModalOpen(false)}>Close Brief</button>
            </div>
          </div>
        </div>
      )}

      {/* Org Creation Wizard Modal */}
      <OrgWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCreated={() => fetchOrgOverview()}
      />

      {/* Org Settings Modal */}
      <OrgSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        organization={org}
        onUpdated={() => fetchOrgOverview()}
      />

    </div>
  );
}
