import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  User, Lock, Bell, Palette, Eye, Key, FolderKanban, Users, GitFork, Tag, Sliders,
  ShieldAlert, Zap, Sparkles, SlidersHorizontal, Shield, Cpu, History, Users2,
  Download, Network, FileText, Mail, ShieldCheck, Code2, Terminal, HelpCircle,
  Search, Check, Loader2, RefreshCw, AlertCircle, ExternalLink, Activity, Play, Trash2, Plus, Copy
} from 'lucide-react';

export const SettingsHub = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [error, setError] = useState('');

  // Personal Settings State
  const [profileData, setProfileData] = useState({ name: '', email: '', role: '', created_at: '', project_memberships: [] });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [preferences, setPreferences] = useState({
    notification_settings: {
      assigned: { in_app: true, email: true },
      mentioned: { in_app: true, email: true },
      status_changed: { in_app: true, email: false },
      priority_changed: { in_app: true, email: true },
      critical_created: { in_app: true, email: true },
      reopened: { in_app: true, email: true },
      sla_approaching: { in_app: true, email: true },
      sla_breached: { in_app: true, email: true },
      sprint_deadline: { in_app: true, email: false },
      security_anomaly: { in_app: true, email: true },
      ai_recommendation: { in_app: true, email: false },
      release_risk: { in_app: true, email: true }
    },
    appearance: { theme: 'light', density: 'comfortable' },
    default_views: { landing_page: 'dashboard', issue_view: 'list' },
    region: { timezone: 'Asia/Kolkata', language: 'English' }
  });
  const [sessions, setSessions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdRawToken, setCreatedRawToken] = useState(null);
  const [usersList, setUsersList] = useState([]);

  // Project Settings State
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [escalationContacts, setEscalationContacts] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [labels, setLabels] = useState([]);
  const [newField, setNewField] = useState({ name: '', field_type: 'Text', is_required: false });

  // AI & Intelligence State
  const [aiSettings, setAiSettings] = useState({
    provider: { name: 'Gemini 1.5 Flash / Pro', status: 'Connected', mode: 'Live AI' },
    feature_toggles: {
      copilot: true, investigation: true, classification: true,
      duplicate_detection: true, resolution_assistance: true,
      forecasting: true, predictive_sla: true, test_scenarios: true
    },
    confidence_thresholds: { duplicate: 70, triage: 75, root_cause: 65, sla: 70 },
    data_controls: { allow_descriptions: true, allow_comments: true, allow_attachments: true, pii_guard: true, secret_guard: true },
    safety_policy: { require_human_confirmation: true, prohibit_auto_delete: true },
    decision_history: [
      { id: 1, type: 'Risk Escalation', confidence: 88, human_decision: 'ACCEPTED', timestamp: new Date().toISOString() },
      { id: 2, type: 'Smart Assignment', confidence: 92, human_decision: 'ACCEPTED', timestamp: new Date().toISOString() }
    ]
  });

  // Admin & System State
  const [adminUsers, setAdminUsers] = useState([]);
  const [smtpSettings, setSmtpSettings] = useState({
    smtp_host: 'smtp.mailtrap.io', smtp_port: 587, username: 'bugflow_smtp',
    from_address: 'noreply@bugflow.ai', is_enabled: false
  });
  const [securityPolicies, setSecurityPolicies] = useState({
    min_password_length: 8, session_timeout_minutes: 60, failed_login_threshold: 5, enforce_2fa: false, rbac_strict_mode: true
  });
  const [systemHealth, setSystemHealth] = useState(null);

  // Initial Data Fetching
  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [profRes, prefsRes, sessRes, keysRes, projRes, aiRes, healthRes, usersRes, labelsRes] = await Promise.all([
        api.getSettingsProfile().catch(() => null),
        api.getSettingsPreferences().catch(() => null),
        api.getSettingsSessions().catch(() => []),
        api.getSettingsAPIKeys().catch(() => []),
        api.getProjects().catch(() => []),
        api.getAISettings().catch(() => null),
        api.getSystemHealth().catch(() => null),
        api.getUsers().catch(() => []),
        api.getLabels().catch(() => []),
      ]);

      if (profRes) setProfileData(profRes);
      if (prefsRes) setPreferences(prev => ({ ...prev, ...prefsRes }));
      if (sessRes) setSessions(sessRes);
      if (keysRes) setApiKeys(keysRes);
      if (usersRes) setUsersList(usersRes);
      if (labelsRes) setLabels(labelsRes);
      if (projRes && projRes.length > 0) {
        setProjects(projRes);
        setSelectedProjectId(projRes[0].id.toString());
      }
      if (aiRes) setAiSettings(prev => ({ ...prev, ...aiRes }));
      if (healthRes) setSystemHealth(healthRes);

      if (user?.role === 'Admin') {
        const [uAdminRes, smtpRes, secRes] = await Promise.all([
          api.getAdminUsers().catch(() => []),
          api.getSMTPSettings().catch(() => null),
          api.getSecurityPolicies().catch(() => null),
        ]);
        if (uAdminRes) setAdminUsers(uAdminRes);
        if (smtpRes) setSmtpSettings(prev => ({ ...prev, ...smtpRes }));
        if (secRes) setSecurityPolicies(prev => ({ ...prev, ...secRes }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load settings data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  useEffect(() => {
    if (selectedProjectId) {
      api.getEscalationContacts(selectedProjectId).then(data => data && setEscalationContacts(data)).catch(console.error);
      api.getCustomFields(selectedProjectId).then(data => data && setCustomFields(data)).catch(console.error);
    }
  }, [selectedProjectId]);

  const showNotification = (msg) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  // Handlers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettingsProfile({ name: profileData.name, email: profileData.email });
      showNotification('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      setError("New passwords do not match.");
      return;
    }
    try {
      await api.changeSettingsPassword(passwords.current_password, passwords.new_password);
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      showNotification('Password updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSavePreferences = async (updatedPrefs) => {
    try {
      await api.updateSettingsPreferences(updatedPrefs);
      setPreferences(updatedPrefs);
      showNotification('Preferences saved.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateAPIKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const res = await api.createSettingsAPIKey(newKeyName, 30);
      setCreatedRawToken(res.raw_token);
      setNewKeyName('');
      const updatedKeys = await api.getSettingsAPIKeys();
      setApiKeys(updatedKeys);
      showNotification('API Key generated successfully.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevokeKey = async (id) => {
    try {
      await api.revokeSettingsAPIKey(id);
      setApiKeys(prev => prev.filter(k => k.id !== id));
      showNotification('API Key revoked.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveEscalationContacts = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      await api.updateEscalationContacts(selectedProjectId, {
        pm_user_id: escalationContacts?.pm_user?.id || null,
        dev_lead_user_id: escalationContacts?.dev_lead_user?.id || null,
        qa_lead_user_id: escalationContacts?.qa_lead_user?.id || null,
        security_contact_user_id: escalationContacts?.security_contact_user?.id || null,
      });
      showNotification('Escalation contacts updated.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveAISettings = async () => {
    try {
      await api.updateAISettings(aiSettings);
      showNotification('AI Governance settings updated.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveSMTP = async (e) => {
    e.preventDefault();
    try {
      await api.updateSMTPSettings(smtpSettings);
      showNotification('SMTP configuration saved.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTestSMTP = async () => {
    try {
      const res = await api.testSMTPConnection();
      showNotification(res.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveSecurityPolicies = async () => {
    try {
      await api.updateSecurityPolicies(securityPolicies);
      showNotification('Security policies saved.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddCustomField = async (e) => {
    e.preventDefault();
    if (!newField.name.trim() || !selectedProjectId) return;
    try {
      await api.createCustomField(selectedProjectId, newField);
      setNewField({ name: '', field_type: 'Text', is_required: false });
      const updated = await api.getCustomFields(selectedProjectId);
      setCustomFields(updated);
      showNotification('Custom field added.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCustomField = async (fieldId) => {
    try {
      await api.deleteCustomField(selectedProjectId, fieldId);
      setCustomFields(prev => prev.filter(f => f.id !== fieldId));
      showNotification('Custom field removed.');
    } catch (err) {
      setError(err.message);
    }
  };

  // Sidebar Menu Items (All 18 sub-sections)
  const navSections = [
    {
      group: 'PERSONAL',
      items: [
        { id: 'overview', label: 'Settings Overview', icon: Eye },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'password', label: 'Password & Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
        { id: 'defaults', label: 'Default Views & Region', icon: SlidersHorizontal },
        { id: 'apikeys', label: 'API Keys / Access Tokens', icon: Key },
      ]
    },
    {
      group: 'PROJECT',
      items: [
        { id: 'project_general', label: 'Project General & Contacts', icon: FolderKanban },
        { id: 'workflow', label: 'Workflow & Transitions', icon: GitFork },
        { id: 'labels', label: 'Labels & Custom Fields', icon: Tag },
      ]
    },
    {
      group: 'SLA & AUTOMATION',
      items: [
        { id: 'sla_auto', label: 'SLA Policies & Automation', icon: ShieldAlert },
      ]
    },
    {
      group: 'AI & INTELLIGENCE',
      items: [
        { id: 'ai_governance', label: 'AI Provider & Controls', icon: Cpu },
        { id: 'ai_history', label: 'AI Decision History', icon: History },
      ]
    },
    {
      group: 'SYSTEM & ADMIN',
      items: [
        { id: 'user_mgmt', label: 'User Management', icon: Users2 },
        { id: 'smtp', label: 'Email / SMTP Config', icon: Mail },
        { id: 'security_policies', label: 'Security Policies & Guard', icon: ShieldCheck },
      ]
    },
    {
      group: 'DEVELOPER & HELP',
      items: [
        { id: 'developer', label: 'API Docs & Diagnostics', icon: Terminal },
        { id: 'help', label: 'Help & About BugFlow', icon: HelpCircle },
      ]
    }
  ];

  const selectedProj = projects.find(p => p.id.toString() === selectedProjectId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 'calc(100vh - 120px)' }}>
      
      {/* Top Header & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>⚙️ Settings Hub</h1>
            <span className="badge badge-low" style={{ background: '#10b981', color: '#fff', fontWeight: 800 }}>
              {user?.role || 'User'} Access
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Unified configuration center for personal preferences, workspace rules, AI governance, and security controls.
          </span>
        </div>

        {/* Settings Quick Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search settings (e.g. password, AI, SLA)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {saveSuccess && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={16} /> {saveSuccess}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Main Settings Grid: Left Nav + Right Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', flex: 1 }}>
        
        {/* Left Sub-Navigation */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', paddingLeft: '0.5rem', display: 'block', marginBottom: '0.35rem' }}>
                {sec.group}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {sec.items
                  .filter(item => !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'transparent',
                          color: isActive ? '#10b981' : 'var(--text-muted)',
                          fontWeight: isActive ? 700 : 500,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent'
                        }}
                      >
                        <Icon size={15} />
                        {item.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Content Panel */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          
          {/* SECTION 1: Settings Overview */}
          {activeSection === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Good day, {profileData.name || user?.name || 'Engineer'}! 👋
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Manage your account settings, notification alerts, AI intelligence governance, and workspace permissions.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setActiveSection('profile')}>
                  <User size={20} color="#10b981" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.5rem' }}>Personal Profile</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Name, email & account details</span>
                </div>

                <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setActiveSection('notifications')}>
                  <Bell size={20} color="#f59e0b" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.5rem' }}>Notifications</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Configure In-App & Email alerts</span>
                </div>

                <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setActiveSection('ai_governance')}>
                  <Cpu size={20} color="#a855f7" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.5rem' }}>AI Governance</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Toggles, thresholds & data safety</span>
                </div>

                <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setActiveSection('developer')}>
                  <Terminal size={20} color="#06b6d4" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.5rem' }}>Developer Tools</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>API Docs, webhooks & system status</span>
                </div>
              </div>

              {systemHealth && (
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} color="#10b981" /> System Health Diagnostics
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {systemHealth.services?.map((srv, idx) => (
                      <div key={idx} style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{srv.name.toUpperCase()}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>● {srv.status}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{srv.latency_ms}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: My Profile */}
          {activeSection === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>👤 Personal Profile</h2>

              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Authorization Role (READ-ONLY)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.role || user?.role}
                    disabled
                    style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    Role permissions are managed by an authorized administrator.
                  </span>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}

          {/* SECTION 3: Password & Security */}
          {activeSection === 'password' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🔒 Password & Session Security</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Change your account password and review active browser sessions.</span>
              </div>

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwords.current_password}
                    onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwords.new_password}
                    onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwords.confirm_password}
                    onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  Update Password
                </button>
              </form>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Active Sessions ({sessions.length || 1})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(sessions.length > 0 ? sessions : [{ id: 1, device_info: 'Windows 11 / Chrome Browser', ip_address: '127.0.0.1', last_active: new Date().toISOString(), is_current: true }]).map(s => (
                    <div key={s.id} style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>{s.device_info}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>IP: {s.ip_address} • Last Active: {new Date(s.last_active).toLocaleTimeString()}</span>
                      </div>
                      {s.is_current ? (
                        <span className="badge badge-low" style={{ background: '#10b981', color: '#fff' }}>Current Session</span>
                      ) : (
                        <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => api.revokeSettingsSession(s.id).then(fetchAllData)}>
                          Sign Out
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Notifications */}
          {activeSection === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🔔 Notification Preferences</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Granular control over In-App alerts and Email dispatches.</span>
              </div>

              <div style={{ padding: '0.85rem 1rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '8px', fontSize: '0.82rem' }}>
                ⚠️ <strong>Email Infrastructure Notice:</strong> Email notifications require configured SMTP server credentials in System Admin Settings.
              </div>

              {preferences?.notification_settings && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.65rem' }}>Event Name</th>
                        <th style={{ padding: '0.65rem', textAlign: 'center' }}>In-App Alert</th>
                        <th style={{ padding: '0.65rem', textAlign: 'center' }}>Email Notification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(preferences.notification_settings).map((evtKey) => {
                        const evt = preferences.notification_settings[evtKey];
                        const label = evtKey.replace(/_/g, ' ').toUpperCase();
                        return (
                          <tr key={evtKey} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.65rem', fontWeight: 600 }}>{label}</td>
                            <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={evt.in_app}
                                onChange={(e) => {
                                  const updated = { ...preferences.notification_settings, [evtKey]: { ...evt, in_app: e.target.checked } };
                                  handleSavePreferences({ ...preferences, notification_settings: updated });
                                }}
                              />
                            </td>
                            <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={evt.email}
                                onChange={(e) => {
                                  const updated = { ...preferences.notification_settings, [evtKey]: { ...evt, email: e.target.checked } };
                                  handleSavePreferences({ ...preferences, notification_settings: updated });
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: Appearance & Theme */}
          {activeSection === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🎨 Appearance & Workspace Layout</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Customize color themes and grid component density preferences.</span>
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.5rem' }}>Theme Mode</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['light', 'dark', 'system'].map((t) => (
                    <button
                      key={t}
                      className={`btn ${preferences?.appearance?.theme === t ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleSavePreferences({ ...preferences, appearance: { ...preferences?.appearance, theme: t } })}
                    >
                      {t.toUpperCase()} MODE
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.5rem' }}>Table & Kanban Density</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['comfortable', 'compact'].map((d) => (
                    <button
                      key={d}
                      className={`btn ${preferences?.appearance?.density === d ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleSavePreferences({ ...preferences, appearance: { ...preferences?.appearance, density: d } })}
                    >
                      {d.toUpperCase()} DENSITY
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: Default Views & Region */}
          {activeSection === 'defaults' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🎛️ Default Landing Views & Regional Formatting</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Set your default entry tab and localized timestamp formats.</span>
              </div>

              <div className="form-group" style={{ maxWidth: '400px' }}>
                <label>Default Landing Tab</label>
                <select
                  className="form-select"
                  value={preferences?.default_views?.landing_page || 'dashboard'}
                  onChange={(e) => handleSavePreferences({ ...preferences, default_views: { ...preferences?.default_views, landing_page: e.target.value } })}
                >
                  <option value="dashboard">Command Center (Dashboard)</option>
                  <option value="issues">Bugs & Kanban</option>
                  <option value="projects">Projects</option>
                  <option value="analytics">Defect Analytics</option>
                </select>
              </div>

              <div className="form-group" style={{ maxWidth: '400px' }}>
                <label>Timezone & Region</label>
                <input
                  type="text"
                  className="form-input"
                  value={preferences?.region?.timezone || 'Asia/Kolkata'}
                  onChange={(e) => handleSavePreferences({ ...preferences, region: { ...preferences?.region, timezone: e.target.value } })}
                />
              </div>
            </div>
          )}

          {/* SECTION 7: API Keys */}
          {activeSection === 'apikeys' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🔑 Personal API Access Tokens</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Generate personal tokens for CI/CD integrations and local development scripts.</span>
              </div>

              {createdRawToken && (
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '8px' }}>
                  <strong style={{ color: '#10b981', fontSize: '0.9rem' }}>⚠️ COPY YOUR TOKEN NOW (IT WILL NOT BE SHOWN AGAIN):</strong>
                  <code style={{ display: 'block', background: 'rgba(0,0,0,0.4)', padding: '0.5rem 0.75rem', color: '#10b981', borderRadius: '6px', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                    {createdRawToken}
                  </code>
                </div>
              )}

              <form onSubmit={handleCreateAPIKey} style={{ display: 'flex', gap: '0.75rem', maxWidth: '500px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Token Name (e.g. CI Script)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">Generate Token</button>
              </form>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.65rem' }}>Token Name</th>
                      <th style={{ padding: '0.65rem' }}>Prefix</th>
                      <th style={{ padding: '0.65rem' }}>Created At</th>
                      <th style={{ padding: '0.65rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No API tokens generated yet.</td></tr>
                    ) : (
                      apiKeys.map(k => (
                        <tr key={k.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.65rem', fontWeight: 700 }}>{k.name}</td>
                          <td style={{ padding: '0.65rem' }}><code>{k.key_prefix}</code></td>
                          <td style={{ padding: '0.65rem' }}>{new Date(k.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '0.65rem' }}>
                            <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleRevokeKey(k.id)}>
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 8: Project General & Contacts */}
          {activeSection === 'project_general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>📁 Project General Details & Escalation Contacts</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Configure project properties and explicit lead assignees for SLA & Incident escalation.</span>
              </div>

              <div className="form-group" style={{ maxWidth: '400px' }}>
                <label>Select Active Project</label>
                <select
                  className="form-select"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProj && (
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Project: {selectedProj.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{selectedProj.description}</p>
                </div>
              )}

              <form onSubmit={handleSaveEscalationContacts} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '450px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>Project Escalation Contacts</h3>

                <div className="form-group">
                  <label>Project Manager Lead</label>
                  <select
                    className="form-select"
                    value={escalationContacts?.pm_user?.id || ''}
                    onChange={(e) => setEscalationContacts({ ...escalationContacts, pm_user: { id: parseInt(e.target.value) } })}
                  >
                    <option value="">Select User...</option>
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Development Lead</label>
                  <select
                    className="form-select"
                    value={escalationContacts?.dev_lead_user?.id || ''}
                    onChange={(e) => setEscalationContacts({ ...escalationContacts, dev_lead_user: { id: parseInt(e.target.value) } })}
                  >
                    <option value="">Select User...</option>
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>QA Lead</label>
                  <select
                    className="form-select"
                    value={escalationContacts?.qa_lead_user?.id || ''}
                    onChange={(e) => setEscalationContacts({ ...escalationContacts, qa_lead_user: { id: parseInt(e.target.value) } })}
                  >
                    <option value="">Select User...</option>
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  Save Escalation Contacts
                </button>
              </form>
            </div>
          )}

          {/* SECTION 9: Workflow Configuration */}
          {activeSection === 'workflow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🌿 Visual Workflow & Transition Rules</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Configurable defect lifecycle states and role-restricted state transitions.</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                {['Reported', 'Open', 'Assigned', 'In Progress', 'In Review', 'Resolved', 'Closed'].map((st, i) => (
                  <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-assigned" style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}>{st}</span>
                    {i < 6 && <span style={{ color: 'var(--text-dim)' }}>➔</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 10: Labels & Custom Fields */}
          {activeSection === 'labels' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🏷️ Labels & Custom Field Definitions</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Create custom fields and manage project defect labels.</span>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Add Custom Field to Project</h3>
                <form onSubmit={handleAddCustomField} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Field Name (e.g. Browser Version)"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    style={{ flex: 1 }}
                    required
                  />
                  <select
                    className="form-select"
                    value={newField.field_type}
                    onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
                  >
                    <option value="Text">Text</option>
                    <option value="Number">Number</option>
                    <option value="Dropdown">Dropdown</option>
                    <option value="Boolean">Boolean</option>
                    <option value="Date">Date</option>
                  </select>
                  <button type="submit" className="btn btn-primary">Add Custom Field</button>
                </form>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.65rem' }}>Field Name</th>
                      <th style={{ padding: '0.65rem' }}>Type</th>
                      <th style={{ padding: '0.65rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customFields.map(cf => (
                      <tr key={cf.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.65rem', fontWeight: 700 }}>{cf.name}</td>
                        <td style={{ padding: '0.65rem' }}>{cf.field_type}</td>
                        <td style={{ padding: '0.65rem' }}>
                          <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDeleteCustomField(cf.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 11: SLA & Automation */}
          {activeSection === 'sla_auto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>⚡ SLA Policies & Automation Engine</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Configure severity SLA thresholds and event-driven automation rules.</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <ShieldAlert size={24} color="#ef4444" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '0.5rem' }}>SLA Policy Engine</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.35rem 0 1rem 0' }}>Configure resolution targets per severity.</p>
                  <button className="btn btn-primary" onClick={() => onNavigate && onNavigate('sla')}>Open SLA Engine</button>
                </div>

                <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <Zap size={24} color="#f59e0b" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '0.5rem' }}>Automation Rules</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.35rem 0 1rem 0' }}>Event triggers and automated triage actions.</p>
                  <button className="btn btn-primary" onClick={() => onNavigate && onNavigate('automation')}>Open Automation Rules</button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 12: AI Provider & Controls (AI Governance) */}
          {activeSection === 'ai_governance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🤖 AI & Intelligence Governance</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Configure AI model modes, feature switches, confidence sliders, and data safety guards.</span>
              </div>

              {/* Provider Card */}
              <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#a855f7' }}>Provider: {aiSettings?.provider?.name || 'Gemini 1.5 Flash / Pro'}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                      Status: <strong>● {aiSettings?.provider?.status || 'Connected'}</strong> • Active Mode: <strong>{aiSettings?.provider?.mode || 'Live AI'}</strong>
                    </span>
                  </div>
                  <span className="badge badge-low" style={{ background: '#a855f7', color: '#fff', fontWeight: 800 }}>
                    {aiSettings?.provider?.mode || 'Live AI'}
                  </span>
                </div>
              </div>

              {/* Feature Toggles */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Active AI Features</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {Object.keys(aiSettings?.feature_toggles || {}).map(key => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, background: 'rgba(0,0,0,0.02)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <input
                        type="checkbox"
                        checked={aiSettings.feature_toggles[key]}
                        onChange={(e) => {
                          const updated = { ...aiSettings.feature_toggles, [key]: e.target.checked };
                          setAiSettings({ ...aiSettings, feature_toggles: updated });
                        }}
                      />
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>

              {/* Confidence Threshold Sliders */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Confidence Threshold Sliders</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.keys(aiSettings?.confidence_thresholds || {}).map(key => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
                        <span>{key.replace(/_/g, ' ').toUpperCase()} CONFIDENCE</span>
                        <span style={{ color: '#10b981' }}>{aiSettings.confidence_thresholds[key]}% Minimum</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={95}
                        value={aiSettings.confidence_thresholds[key]}
                        onChange={(e) => {
                          const updated = { ...aiSettings.confidence_thresholds, [key]: parseInt(e.target.value) };
                          setAiSettings({ ...aiSettings, confidence_thresholds: updated });
                        }}
                        style={{ accentColor: '#10b981' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSaveAISettings} style={{ alignSelf: 'flex-start' }}>
                Save AI Governance Configuration
              </button>
            </div>
          )}

          {/* SECTION 13: AI Decision History */}
          {activeSection === 'ai_history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>📜 AI Decision & Audit History</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(aiSettings?.decision_history || []).map(dh => (
                  <div key={dh.id} style={{ padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: '#a855f7' }}>{dh.type} Recommendation</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Timestamp: {new Date(dh.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Confidence: {dh.confidence}%</span>
                      <span className="badge badge-low" style={{ background: '#10b981', color: '#fff' }}>{dh.human_decision}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 14: User Management */}
          {activeSection === 'user_mgmt' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>👥 Global User Management</h2>
              {user?.role !== 'Admin' && (
                <div style={{ padding: '0.85rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.82rem' }}>
                  ⚠️ Restricted Access: Global user role management requires Administrator privileges.
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.65rem' }}>User ID</th>
                      <th style={{ padding: '0.65rem' }}>Name</th>
                      <th style={{ padding: '0.65rem' }}>Email</th>
                      <th style={{ padding: '0.65rem' }}>Global Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adminUsers.length > 0 ? adminUsers : usersList).map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.65rem' }}>#{u.id}</td>
                        <td style={{ padding: '0.65rem', fontWeight: 700 }}>{u.name}</td>
                        <td style={{ padding: '0.65rem' }}>{u.email}</td>
                        <td style={{ padding: '0.65rem' }}>
                          <select
                            className="form-select"
                            style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem' }}
                            value={u.role}
                            disabled={user?.role !== 'Admin'}
                            onChange={(e) => api.updateAdminUser(u.id, { role: e.target.value }).then(fetchAllData)}
                          >
                            <option value="Admin">Admin</option>
                            <option value="Developer">Developer</option>
                            <option value="QA">QA</option>
                            <option value="Reporter">Reporter</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 15: SMTP Config */}
          {activeSection === 'smtp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>✉️ Email / SMTP Server Credentials</h2>
              {user?.role !== 'Admin' && (
                <div style={{ padding: '0.85rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.82rem' }}>
                  ⚠️ Restricted Access: SMTP server credentials can only be edited by an Administrator.
                </div>
              )}
              <form onSubmit={handleSaveSMTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
                <div className="form-group">
                  <label>SMTP Host</label>
                  <input type="text" className="form-input" value={smtpSettings?.smtp_host || 'smtp.mailtrap.io'} onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_host: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>SMTP Port</label>
                  <input type="number" className="form-input" value={smtpSettings?.smtp_port || 587} onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_port: parseInt(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>From Address</label>
                  <input type="email" className="form-input" value={smtpSettings?.from_address || 'noreply@bugflow.ai'} onChange={(e) => setSmtpSettings({ ...smtpSettings, from_address: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={user?.role !== 'Admin'}>Save SMTP Settings</button>
                  <button type="button" className="btn btn-secondary" onClick={handleTestSMTP}>Test Connection</button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 16: Security Policies */}
          {activeSection === 'security_policies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🛡️ Security Policies & PII Protection</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveSecurityPolicies(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
                <div className="form-group">
                  <label>Minimum Password Length</label>
                  <input type="number" className="form-input" value={securityPolicies?.min_password_length || 8} onChange={(e) => setSecurityPolicies({ ...securityPolicies, min_password_length: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Session Timeout (Minutes)</label>
                  <input type="number" className="form-input" value={securityPolicies?.session_timeout_minutes || 60} onChange={(e) => setSecurityPolicies({ ...securityPolicies, session_timeout_minutes: parseInt(e.target.value) })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={user?.role !== 'Admin'}>Save Security Policies</button>
              </form>
            </div>
          )}

          {/* SECTION 17: Developer & Diagnostics */}
          {activeSection === 'developer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>💻 Developer Tools & OpenAPI Docs</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Access automatically generated FastAPI interactive documentation and backend OpenAPI schema specifications.
              </p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <a href="/docs" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ExternalLink size={16} /> Open FastAPI Interactive /docs UI
                </a>
                <a href="/redoc" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ExternalLink size={16} /> Open ReDoc Specification
                </a>
              </div>
            </div>
          )}

          {/* SECTION 18: Help & About */}
          {activeSection === 'help' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>❓ Help, Keyboard Shortcuts & About</h2>
              <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>⌨️ Global Keyboard Shortcuts</h3>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <li><code>Ctrl + K</code> — Open Global Command Palette</li>
                  <li><code>Esc</code> — Close active modals & side drawers</li>
                </ul>
              </div>

              <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>ℹ️ About BugFlow Platform</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  <strong>BugFlow v4.2 Intelligence Edition</strong> — Intelligent Software Defect Engineering Platform with Resolution Assistance.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
