import React, { useState, useEffect } from 'react';
import { Settings, X, Building2, Globe, Clock, ShieldCheck, Sparkles, AlertTriangle, Save, Check } from 'lucide-react';
import { api } from '../services/api';

export default function OrgSettingsModal({ isOpen, onClose, organization, onUpdated, onDeleted }) {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // General & Regional Fields
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [country, setCountry] = useState('United States');
  const [timezone, setTimezone] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [currency, setCurrency] = useState('');

  // SLA Engine Fields
  const [critResp, setCritResp] = useState(1);
  const [critRes, setCritRes] = useState(4);
  const [highResp, setHighResp] = useState(4);
  const [highRes, setHighRes] = useState(24);

  // AI Controls
  const [enableCopilot, setEnableCopilot] = useState(true);
  const [enableWorkloadAI, setEnableWorkloadAI] = useState(true);
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(75);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '');
      setOrgDesc(organization.description || '');
      setLogoUrl(organization.logo_url || '');
      setWebsiteUrl(organization.website || '');
      setIndustry(organization.industry || 'Software Engineering & Technology');
      setCompanySize(organization.company_size || '50-200 Employees');
      setTimezone(organization.timezone || 'UTC (Coordinated Universal Time)');
      setWorkingHours(organization.working_hours || '09:00 - 18:00 MON-FRI');
      setCurrency(organization.currency || 'USD ($)');
    }
  }, [organization]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/v1/organizations/settings', {
        name: orgName,
        description: orgDesc,
        logo_url: logoUrl,
        website: websiteUrl,
        industry,
        company_size: companySize,
        timezone,
        working_hours: workingHours,
        currency
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert("Failed to update organization settings: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrganization = async () => {
    const targetName = orgName || organization?.name || 'this organization';
    const targetId = organization?.id || 1;

    if (!window.confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to delete "${targetName}"?\n\nThis will permanently purge all linked departments, squads, projects, defects, and activity logs.\n\nThis action CANNOT be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/v1/organizations/${targetId}`);
      alert(`Organization "${targetName}" has been permanently deleted.`);
      if (onDeleted) {
        onDeleted(targetId);
      } else if (onUpdated) {
        onUpdated();
      }
      onClose();
    } catch (err) {
      alert("Failed to delete organization: " + (err.message || err));
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: Building2 },
    { id: 'localization', label: 'Localization & Hours', icon: Globe },
    { id: 'sla', label: 'SLA Engine', icon: ShieldCheck },
    { id: 'ai', label: 'AI Controls', icon: Sparkles },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '720px', borderRadius: '16px', padding: '1.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Settings size={22} color="#10b981" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Organization Settings</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: isActive ? '#10b981' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <>
              <div className="form-group">
                <label>Organization Name</label>
                <input type="text" className="form-input" value={orgName} onChange={e => setOrgName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea className="form-textarea" rows={3} value={orgDesc} onChange={e => setOrgDesc(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label>Industry</label>
                  <input type="text" className="form-input" value={industry} onChange={e => setIndustry(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Company Size</label>
                  <input type="text" className="form-input" value={companySize} onChange={e => setCompanySize(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label>Logo Image URL</label>
                  <input type="url" className="form-input" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://domain.com/logo.png" />
                </div>
                <div className="form-group">
                  <label>Company Website URL</label>
                  <input type="text" className="form-input" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://novaui.demo" />
                </div>
              </div>
            </>
          )}

          {/* LOCALIZATION TAB */}
          {activeTab === 'localization' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label>Country</label>
                  <input type="text" className="form-input" value={country} onChange={e => setCountry(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Default Currency</label>
                  <input type="text" className="form-input" value={currency} onChange={e => setCurrency(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label>Time Zone</label>
                  <input type="text" className="form-input" value={timezone} onChange={e => setTimezone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Working Hours</label>
                  <input type="text" className="form-input" value={workingHours} onChange={e => setWorkingHours(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* SLA TAB */}
          {activeTab === 'sla' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure organization response and resolution thresholds for SLA breaches.</span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', background: 'rgba(239, 68, 68, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div className="form-group">
                  <label>Critical Response (Hours)</label>
                  <input type="number" className="form-input" value={critResp} onChange={e => setCritResp(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>Critical Resolution (Hours)</label>
                  <input type="number" className="form-input" value={critRes} onChange={e => setCritRes(Number(e.target.value))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', background: 'rgba(245, 158, 11, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div className="form-group">
                  <label>High Response (Hours)</label>
                  <input type="number" className="form-input" value={highResp} onChange={e => setHighResp(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>High Resolution (Hours)</label>
                  <input type="number" className="form-input" value={highRes} onChange={e => setHighRes(Number(e.target.value))} />
                </div>
              </div>
            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-primary)' }}>AI Copilot & Investigation Engine</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enable AI automated defect root-cause analysis</span>
                </div>
                <input type="checkbox" checked={enableCopilot} onChange={e => setEnableCopilot(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-primary)' }}>AI Workload & Capacity Insights</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enable squad capacity overload detection</span>
                </div>
                <input type="checkbox" checked={enableWorkloadAI} onChange={e => setEnableWorkloadAI(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === 'danger' && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1.25rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                <AlertTriangle size={20} />
                <strong style={{ fontSize: '1rem' }}>Organization Danger Zone</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Deleting an organization permanently purges all linked departments, squads, workspaces, projects, defects, and activity logs. This action <strong style={{ color: '#ef4444' }}>cannot be undone</strong>.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleDeleteOrganization}
                  disabled={deleting}
                  className="btn"
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <AlertTriangle size={16} />
                  {deleting ? 'Deleting Organization...' : 'Delete Organization'}
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {savedSuccess ? <Check size={16} color="#10b981" /> : <Save size={16} />}
              {saving ? 'Saving...' : (savedSuccess ? 'Saved!' : 'Save Settings')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
