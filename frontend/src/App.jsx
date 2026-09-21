import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Issues } from './pages/Issues';
import { IssueDetail } from './pages/IssueDetail';
import { Sprints } from './pages/Sprints';
import { Milestones } from './pages/Milestones';
import { UserProfiles } from './pages/UserProfiles';
import { TeamWorkload } from './pages/TeamWorkload';
import { Analytics } from './pages/Analytics';
import { Timesheets } from './pages/Timesheets';
import { SLAManagement } from './pages/SLAManagement';
import { Automation } from './pages/Automation';
import { Documents } from './pages/Documents';
import { AICenter } from './pages/AICenter';
import { SecurityCenter } from './pages/SecurityCenter';
import { PerformanceCenter } from './pages/PerformanceCenter';
import { IntelligencePortal } from './pages/IntelligencePortal';
import { SettingsHub } from './pages/SettingsHub';
import { OrgOverview } from './pages/OrgOverview';
import DepartmentsPage from './pages/DepartmentsPage';
import WorkspacesPage from './pages/WorkspacesPage';
import TeamsPage from './pages/TeamsPage';
import { PeoplePage } from './pages/PeoplePage';
import { GoalsPage } from './pages/GoalsPage';
import { AskPortalPage } from './pages/AskPortalPage';
import { TestManagementPage } from './pages/TestManagementPage';
import { ReleasesPage } from './pages/ReleasesPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { TechnicalDebtPage } from './pages/TechnicalDebtPage';
import { OrganizationDetail } from './pages/OrganizationDetail';
import OnboardingModal from './components/OnboardingModal';

import { QRCodeModal } from './components/QRCodeModal';
import { AIWeeklyReportModal } from './components/AIWeeklyReportModal';
import { CommandPalette } from './components/CommandPalette';
import { BugFlowCopilotDrawer } from './components/BugFlowCopilotDrawer';
import { ReportIssueModal } from './components/ReportIssueModal';
import { api } from './services/api';

export function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedSprintId, setSelectedSprintId] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(1);
  const [projects, setProjects] = useState([]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Deep-linking URL Route Listener (/organizations/:orgId)
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const match = path.match(/\/organizations\/(\d+)/);
      if (match) {
        setSelectedOrgId(parseInt(match[1]));
        setActiveTab('org_detail');
      }
    };
    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);


  // Theme State ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('bugflow_theme') || 'light';
  });

  // Modal & Drawer States
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isGlobalReportOpen, setIsGlobalReportOpen] = useState(false);
  const [globalProjects, setGlobalProjects] = useState([]);
  const [globalSprints, setGlobalSprints] = useState([]);
  const [globalUsers, setGlobalUsers] = useState([]);

  const handleOpenGlobalReportModal = async () => {
    setIsGlobalReportOpen(true);
    try {
      const [projs, sprins, usrs] = await Promise.all([
        api.getProjects().catch(() => []),
        api.compareSprints().catch(() => []),
        api.getUsers().catch(() => [])
      ]);
      setGlobalProjects(projs || []);
      setGlobalSprints(sprins || []);
      setGlobalUsers(usrs || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Auth Mode State for Landing Page switch: 'landing' | 'login' | 'register'
  const [authMode, setAuthMode] = useState('landing');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Reporter');
  const [authError, setAuthError] = useState('');
  const { login, register } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bugflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setSelectedSprintId(null);
    setSelectedIssueId(null);
    setActiveTab('issues');
  };

  const handleSelectSprint = (sprintId) => {
    setSelectedSprintId(sprintId);
    setSelectedProjectId(null);
    setSelectedIssueId(null);
    setActiveTab('issues');
  };

  const handleSelectIssue = (issueId) => {
    setSelectedIssueId(issueId);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        await login(authEmail, authPassword);
      } else {
        await register({
          email: authEmail,
          password: authPassword,
          name: authName,
          role: authRole
        });
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Initializing BugFlow AI Platform...</div>
      </div>
    );
  }

  if (!user) {
    if (authMode === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => setAuthMode('register')}
          onLogin={() => setAuthMode('login')}
        />
      );
    }

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.12) 0%, transparent 60%), var(--bg-primary)' }}>
        <div className="glass-panel" style={{ width: '400px', padding: '2.5rem' }}>
          
          <button className="btn btn-secondary" style={{ marginBottom: '1.25rem', fontSize: '0.8rem' }} onClick={() => setAuthMode('landing')}>
            ← Back to Home
          </button>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
            {authMode === 'login' ? 'Sign In to BugFlow' : 'Create Account'}
          </h2>
          
          {authError && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {authMode === 'register' && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Jane Doe"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Account Role</label>
                  <select className="form-select" value={authRole} onChange={(e) => setAuthRole(e.target.value)}>
                    <option value="Reporter">Reporter (Reports defects)</option>
                    <option value="Developer">Developer (Fixes defects)</option>
                    <option value="QA">QA Tester (Verifies fixes)</option>
                    <option value="Admin">Admin (Full Control)</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="developer@bugflow.io"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              {authMode === 'login' ? 'Sign In' : 'Register Account'}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {authMode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer' }} onClick={() => setAuthMode('register')}>
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer' }} onClick={() => setAuthMode('login')}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      
      {/* Top Navbar */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenQRCode={() => setIsQRCodeOpen(true)}
        onOpenWeeklyReport={() => setIsWeeklyReportOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenReportModal={handleOpenGlobalReportModal}
        onHome={() => { setActiveTab('home'); setSelectedIssueId(null); }}
        onSelectIssue={handleSelectIssue}
      />

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setSelectedIssueId(null); }} />

        {/* Workspace Content View */}
        <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
          {selectedIssueId ? (
            <IssueDetail issueId={selectedIssueId} onBack={() => setSelectedIssueId(null)} />
          ) : (
            <>
              {activeTab === 'home' && (
                <Home onSelectIssue={handleSelectIssue} />
              )}

              {activeTab === 'dashboard' && (
                <Dashboard
                  onSelectIssue={handleSelectIssue}
                  onSelectProject={handleSelectProject}
                />
              )}

              {activeTab === 'analytics' && (
                <Analytics />
              )}

              {activeTab === 'projects' && (
                <Projects onSelectProject={handleSelectProject} />
              )}

              {activeTab === 'issues' && (
                <Issues
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  selectedSprintId={selectedSprintId}
                  onSelectIssue={handleSelectIssue}
                />
              )}

              {activeTab === 'sprints' && (
                <Sprints onSelectSprint={handleSelectSprint} />
              )}

              {activeTab === 'milestones' && (
                <Milestones projects={projects} />
              )}

              {activeTab === 'userprofiles' && (
                <UserProfiles />
              )}

              {activeTab === 'teamworkload' && (
                <TeamWorkload />
              )}

              {activeTab === 'timesheets' && (
                <Timesheets />
              )}

              {activeTab === 'sla' && (
                <SLAManagement />
              )}

              {activeTab === 'automation' && (
                <Automation />
              )}

              {activeTab === 'documents' && (
                <Documents projects={projects} />
              )}

              {activeTab === 'aicenter' && (
                <AICenter />
              )}

              {activeTab === 'security' && (
                <SecurityCenter />
              )}

              {activeTab === 'performance' && (
                <PerformanceCenter />
              )}

              {activeTab === 'intelligence' && (
                <IntelligencePortal />
              )}

              {activeTab === 'org' && (
                <OrgOverview onNavigate={(tab, orgId) => { if (orgId) setSelectedOrgId(orgId); setActiveTab(tab); setSelectedIssueId(null); }} />
              )}

              {activeTab === 'org_detail' && (
                <OrganizationDetail
                  orgId={selectedOrgId}
                  onNavigate={(tab) => { setActiveTab(tab); setSelectedIssueId(null); }}
                  onSelectIssue={handleSelectIssue}
                  onSelectProject={handleSelectProject}
                />
              )}

              {activeTab === 'departments' && (
                <DepartmentsPage />
              )}

              {activeTab === 'workspaces' && (
                <WorkspacesPage />
              )}

              {activeTab === 'teams' && (
                <TeamsPage />
              )}

              {activeTab === 'people' && (
                <PeoplePage />
              )}

              {activeTab === 'goals' && (
                <GoalsPage />
              )}

              {activeTab === 'askportal' && (
                <AskPortalPage />
              )}

              {activeTab === 'testmgmt' && (
                <TestManagementPage />
              )}

              {activeTab === 'releases' && (
                <ReleasesPage />
              )}

              {activeTab === 'incidents' && (
                <IncidentsPage />
              )}

              {activeTab === 'kb' && (
                <KnowledgeBasePage />
              )}

              {activeTab === 'debt' && (
                <TechnicalDebtPage />
              )}

              {activeTab === 'settings' && (
                <SettingsHub onNavigate={(tab) => { setActiveTab(tab); setSelectedIssueId(null); }} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Role-Aware Developer Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        role={user?.role || 'Developer'}
      />

      {/* QR Code Modal */}
      {isQRCodeOpen && <QRCodeModal isOpen={isQRCodeOpen} onClose={() => setIsQRCodeOpen(false)} />}

      {/* AI Weekly Report Modal */}
      {isWeeklyReportOpen && <AIWeeklyReportModal isOpen={isWeeklyReportOpen} onClose={() => setIsWeeklyReportOpen(false)} />}


      {/* Command Palette Modal (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={setIsCommandPaletteOpen}
        onSelectIssue={handleSelectIssue}
        onSelectProject={handleSelectProject}
      />

      {/* BugFlow Copilot AI Drawer */}
      <BugFlowCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onSelectIssue={handleSelectIssue}
      />

      {/* Global Intelligent Issue Reporting Workspace Modal */}
      <ReportIssueModal
        isOpen={isGlobalReportOpen}
        onClose={() => setIsGlobalReportOpen(false)}
        projects={globalProjects}
        sprints={globalSprints}
        users={globalUsers}
        onIssueCreated={() => setActiveTab('issues')}
        onOpenIssueDetail={handleSelectIssue}
      />

    </div>
  );
}

export default App;
