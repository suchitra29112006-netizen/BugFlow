import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { QRCodeModal } from './components/QRCodeModal';
import { AIWeeklyReportModal } from './components/AIWeeklyReportModal';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Issues } from './pages/Issues';
import { IssueDetail } from './pages/IssueDetail';
import { api } from './services/api';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState('landing'); // 'landing' | 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'projects' | 'issues' | 'issue-detail'
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);

  // Theme Management (Light Green+Peach default, Dark Eye Protection mode)
  const [theme, setTheme] = useState(localStorage.getItem('bugflow_theme') || 'light');

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('bugflow_theme', nextTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Modal States
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.getProjects().then(setProjects).catch(console.error);
      api.getDashboardStats().then(setStats).catch(console.error);
    }
  }, [user, activeTab]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
        Loading BugFlow...
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
    return authMode === 'login' ? (
      <Login onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveTab('issues');
  };

  const handleSelectIssue = (issueId) => {
    setSelectedIssueId(issueId);
    setActiveTab('issue-detail');
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <Navbar
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenQRCode={() => setIsQRModalOpen(true)}
          onOpenWeeklyReport={() => setIsWeeklyReportOpen(true)}
          onHome={() => setActiveTab('dashboard')}
        />
        
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)' }}>
          <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'issues') setSelectedProjectId(null);
          }} />
          
          <main className="page-wrapper">
            {activeTab === 'dashboard' && (
              <Dashboard
                onNavigateToIssues={() => setActiveTab('issues')}
                onSelectIssue={handleSelectIssue}
              />
            )}

            {activeTab === 'projects' && (
              <Projects onSelectProject={handleSelectProject} />
            )}

            {activeTab === 'issues' && (
              <Issues
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectIssue={handleSelectIssue}
              />
            )}

            {activeTab === 'issue-detail' && (
              <IssueDetail
                issueId={selectedIssueId}
                onBack={() => setActiveTab('issues')}
              />
            )}
          </main>
        </div>
      </div>

      {/* Global Modals */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />

      <AIWeeklyReportModal
        isOpen={isWeeklyReportOpen}
        onClose={() => setIsWeeklyReportOpen(false)}
        stats={stats}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
