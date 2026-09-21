const API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('bugflow_token');
  
  const headers = {
    ...(options.headers || {}),
  };

  if (!options.isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const cleanEndpoint = endpoint.startsWith('/api/')
    ? endpoint.slice(4)
    : endpoint === '/api'
    ? ''
    : endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, config);

  if (response.status === 204) {
    return null;
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { detail: text || `HTTP ${response.status} Error` };
  }

  if (!response.ok) {
    const errorMsg = data.detail || 'An unexpected API error occurred.';
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }

  return data;
}

export const api = {
  // Generic HTTP Methods
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body = null, options = {}) => {
    const isFormData = options?.isFormData || (typeof FormData !== 'undefined' && body instanceof FormData);
    const opts = { ...options, method: 'POST', isFormData };
    if (body !== null && body !== undefined && !isFormData) {
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    } else if (isFormData) {
      opts.body = body;
    }
    return request(endpoint, opts);
  },
  put: (endpoint, body = null, options = {}) => {
    const isFormData = options?.isFormData || (typeof FormData !== 'undefined' && body instanceof FormData);
    const opts = { ...options, method: 'PUT', isFormData };
    if (body !== null && body !== undefined && !isFormData) {
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    } else if (isFormData) {
      opts.body = body;
    }
    return request(endpoint, opts);
  },
  patch: (endpoint, body = null, options = {}) => {
    const isFormData = options?.isFormData || (typeof FormData !== 'undefined' && body instanceof FormData);
    const opts = { ...options, method: 'PATCH', isFormData };
    if (body !== null && body !== undefined && !isFormData) {
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    } else if (isFormData) {
      opts.body = body;
    }
    return request(endpoint, opts);
  },
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getProfile: () => request('/auth/me'),

  // Milestone 4 Security & Governance API Client Methods
  runSecurityAudit: () => request('/security/audit', { method: 'POST' }),
  getSecurityFindings: () => request('/security/findings'),
  updateSecurityFindingStatus: (findingId, status) => request(`/security/findings/${findingId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAuditAnomalies: () => request('/security/anomalies'),
  checkSensitiveDataLeak: (text) => request('/security/sensitive-data/check', { method: 'POST', body: JSON.stringify({ text }) }),

  // Milestone 4 Query Performance Advisor Methods
  getPerformanceReport: () => request('/performance/report'),
  getCapturedQueries: () => request('/performance/queries'),

  // Milestone 4 Intelligence & Predictive Analytics API Methods
  getDefectDNA: (issueId) => request(`/issues/${issueId}/fingerprint`),
  getRecurrenceRisk: (issueId) => request(`/issues/${issueId}/recurrence`),
  getBugFamilyTree: (issueId) => request(`/issues/${issueId}/genealogy`),
  getInvestigationWorkspace: (issueId) => request(`/issues/${issueId}/investigation`),
  submitInvestigationDecision: (issueId, decision) => request(`/issues/${issueId}/investigation/decision`, { method: 'POST', body: JSON.stringify({ decision }) }),
  getVerificationPlan: (issueId) => request(`/issues/${issueId}/verification`),
  updateTestCaseStatus: (issueId, testCaseId, status) => request(`/issues/${issueId}/verification/test-status`, { method: 'POST', body: JSON.stringify({ test_case_id: testCaseId, status }) }),
  getDefectQualityScore: (issueId) => request(`/issues/${issueId}/quality`),
  getDefectContradictions: (issueId) => request(`/issues/${issueId}/contradictions`),
  getDefectForecast: () => request('/analytics/forecast'),
  getDefectHotspotForecast: () => request('/analytics/hotspots'),
  getTechnicalDebtRadar: () => request('/analytics/technical-debt'),
  getExplainableWhy: (metric = 'backlog') => request(`/analytics/why?metric=${encodeURIComponent(metric)}`),
  runWhatIfSimulator: (scenario, developerCapacityPct = 80) => request('/sprints/simulator', { method: 'POST', body: JSON.stringify({ scenario, developer_capacity_pct: developerCapacityPct }) }),
  generateAutoReleaseNotes: (sprintId = null) => request(`/releases/generate-notes${sprintId ? `?sprint_id=${sprintId}` : ''}`, { method: 'POST' }),
  getIncidentsList: () => request('/incidents'),
  getRoleOnboarding: (role) => request(`/onboarding/${role}`),

  // Milestone 3 Analytics API Client Methods
  getAnalyticsOverview: (projectId) => request(`/analytics/overview${projectId ? `?project_id=${projectId}` : ''}`),
  getDefectTrends: (days = 14, projectId) => request(`/analytics/defect-trends?days=${days}${projectId ? `&project_id=${projectId}` : ''}`),
  getSeverityDistribution: (projectId) => request(`/analytics/severity${projectId ? `?project_id=${projectId}` : ''}`),
  getPriorityDistribution: (projectId) => request(`/analytics/priority${projectId ? `?project_id=${projectId}` : ''}`),
  getStatusDistribution: (projectId) => request(`/analytics/status${projectId ? `?project_id=${projectId}` : ''}`),
  getDeveloperWorkloadAnalytics: () => request('/analytics/developer-workload'),
  getResolutionTimeAnalytics: () => request('/analytics/resolution-time'),
  getReopenedAnalytics: () => request('/analytics/reopened'),
  getUnassignedDefectsAnalytics: () => request('/analytics/unassigned'),
  getAIAnalyticsInsights: () => request('/analytics/ai-insights'),
  getNarratedAnalytics: () => request('/analytics/narrative'),
  getWorkflowBottlenecks: () => request('/analytics/bottlenecks'),
  getCrossDimensionalAnalysis: () => request('/analytics/cross-dimensional'),

  // Milestone 3 AI Copilot & Intelligence API Methods
  askBugFlowCopilot: (query, history = []) => request('/ai/copilot', { method: 'POST', body: JSON.stringify({ query, history }) }),
  executeCopilotAction: (actionType, issueId, target = null) => request('/ai/copilot/execute-action', { method: 'POST', body: JSON.stringify({ action_type: actionType, issue_id: issueId, target }) }),
  getExplainWhy: (targetId, type = 'risk') => request(`/issues/${targetId}/explain-why?type=${type}`),
  getSmartTriageQueue: (projectId) => request(`/issues/smart-triage${projectId ? `?project_id=${projectId}` : ''}`),
  getAIResolutionAssistance: (issueId) => request(`/issues/${issueId}/ai-resolution-assistance`, { method: 'POST' }),
  getSimilarDefects: (issueId, limit = 5) => request(`/issues/${issueId}/similar?limit=${limit}`),
  searchHistoricalResolutions: (query, limit = 5) => request(`/issues/historical-resolutions?query=${encodeURIComponent(query)}&limit=${limit}`),
  getDefectIntelligenceScore: (issueId) => request(`/issues/${issueId}/intelligence-score`),
  askAICommandCenter: (query) => request('/ai/command-center', { method: 'POST', body: JSON.stringify({ query }) }),
  linkGitHubPR: (issueId, prUrl) => request('/github/link-pr', { method: 'POST', body: JSON.stringify({ issue_id: issueId, pr_url: prUrl }) }),
  runAIPRReview: (issueId, prUrl, diffText = '') => request('/github/ai-pr-review', { method: 'POST', body: JSON.stringify({ issue_id: issueId, pr_url: prUrl, diff_text: diffText }) }),
  getResolutionKnowledgeGraph: (issueId) => request(`/issues/${issueId}/knowledge-graph`),
  generateAITestScenarios: (issueId) => request(`/issues/${issueId}/generate-test-scenarios`, { method: 'POST' }),
  getDailyTeamBrief: () => request('/team/daily-brief', { method: 'POST' }),

  // Smart Automation & Escalation
  getSmartAutomationSuggestions: () => request('/automation/smart-suggestions'),
  acceptSmartAutomationSuggestion: (ruleData) => request('/automation/accept-suggestion', { method: 'POST', body: JSON.stringify(ruleData) }),
  getSmartEscalation: (issueId) => request(`/sla/smart-escalation/${issueId}`),
  verifyDefectsBatch: (release, defects) => request('/issues/defects/verify-batch', { method: 'POST', body: JSON.stringify({ release, defects }) }),

  // Users & Developer Intelligence Profiles
  getUsers: () => request('/users'),
  getDeveloperProfile: (userId) => request(`/users/${userId}/profile`),
  updateDeveloperProfile: (userId, data) =>
    request(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getUserProfessionalProfile: (userId) => request(`/users/${userId}/profile`),
  updateUserProfessionalProfile: (userId, data) =>
    request(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Skills Management
  listSkillsCatalog: () => request('/skills'),
  createSkillCatalog: (name, category = 'Backend') =>
    request('/skills', {
      method: 'POST',
      body: JSON.stringify({ name, category }),
    }),
  addSkillToUser: (userId, skillId, proficiencyLevel = 3, yearsExp = 1.0) =>
    request(`/users/${userId}/skills`, {
      method: 'POST',
      body: JSON.stringify({ skill_id: skillId, proficiency_level: proficiencyLevel, years_experience: yearsExp }),
    }),
  removeSkillFromUser: (userId, skillId) =>
    request(`/users/${userId}/skills/${skillId}`, {
      method: 'DELETE',
    }),

  // Workload & Team Intelligence
  getTeamWorkloadSummary: () => request('/users/workload'),
  analyzeIssueAssignment: (issueId) => request(`/issues/${issueId}/assignment/analyze`, { method: 'POST' }),
  assignIssue: (issueId, payload) =>
    request(`/issues/${issueId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getIssueAssignmentHistory: (issueId) => request(`/issues/${issueId}/assignment-history`),
  getTeamAssignmentInsights: () => request('/team/assignment-insights'),

  // AI Sprint Intelligence Center API Methods
  getSprints: () => request('/sprints'),
  getSprintDetails: (id) => request(`/sprints/${id}`),
  getSprintRebalanceProposal: (sprintId) => request(`/sprints/${sprintId}/rebalance-proposal`),
  applySprintRebalance: (sprintId, actionIds = [1, 2]) => request(`/sprints/${sprintId}/apply-rebalance`, { method: 'POST', body: JSON.stringify({ action_ids: actionIds }) }),
  createSprint: (data) =>
    request('/sprints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSprint: (id, data) =>
    request(`/sprints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSprint: (id) =>
    request(`/sprints/${id}`, {
      method: 'DELETE',
    }),

  assignIssueToSprint: (sprintId, issueId) =>
    request(`/sprints/${sprintId}/issues/${issueId}`, { method: 'POST' }),

  createSprintObjective: (sprintId, data) =>
    request(`/sprints/${sprintId}/objectives`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteSprintObjective: (sprintId, objectiveId) =>
    request(`/sprints/${sprintId}/objectives/${objectiveId}`, { method: 'DELETE' }),

  planSprintWithAI: (sprintId) => request(`/sprints/${sprintId}/ai-plan`, { method: 'POST' }),
  getSprintHealth: (sprintId) => request(`/sprints/${sprintId}/health`),
  getSprintRisk: (sprintId) => request(`/sprints/${sprintId}/risk`),
  getSprintCapacity: (sprintId) => request(`/sprints/${sprintId}/capacity`),
  getSprintBurndown: (sprintId) => request(`/sprints/${sprintId}/burndown`),
  getSprintVelocity: (sprintId) => request(`/sprints/${sprintId}/velocity`),
  getSprintDependencies: (sprintId) => request(`/sprints/${sprintId}/dependencies`),
  getSprintBlockers: (sprintId) => request(`/sprints/${sprintId}/blockers`),
  getSprintQAReadiness: (sprintId) => request(`/sprints/${sprintId}/qa-readiness`),
  getSprintReleaseReadiness: (sprintId) => request(`/sprints/${sprintId}/release-readiness`),
  generateSprintRetrospective: (sprintId) => request(`/sprints/${sprintId}/retrospective`, { method: 'POST' }),
  compareSprints: (sprintIds = '') => request(`/sprints/compare${sprintIds ? `?sprint_ids=${sprintIds}` : ''}`),
  askSprintAICopilot: (sprintId, query) =>
    request(`/sprints/${sprintId}/ai-chat`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // Projects
  getProjects: () => request('/projects'),
  createProject: (data) =>
    request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteProject: (id) =>
    request(`/projects/${id}`, {
      method: 'DELETE',
    }),

  // Issues
  getIssues: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.severity) query.append('severity', params.severity);
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.sprint_id) query.append('sprint_id', params.sprint_id);
    if (params.assigned_to) query.append('assigned_to', params.assigned_to);
    if (params.reporter_id) query.append('reporter_id', params.reporter_id);
    if (params.label_id) query.append('label_id', params.label_id);
    if (params.is_overdue_only) query.append('is_overdue_only', 'true');

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/issues${queryString}`);
  },

  getIssue: (id) => request(`/issues/${id}`),

  createIssue: (data) =>
    request('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateIssue: (id, data) =>
    request(`/issues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  bulkUpdateIssues: (data) =>
    request('/issues/bulk-update', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteIssue: (id) =>
    request(`/issues/${id}`, {
      method: 'DELETE',
    }),

  // AI Assignment Recommendation & Analytics Engine
  getAssignmentRecommendations: (issueId, limit = 5, minScore = 0, includeUnavailable = false) =>
    request(`/issues/${issueId}/assignment-recommendations?limit=${limit}&minimum_score=${minScore}&include_unavailable=${includeUnavailable}`),

  assignDeveloperWithAudit: (issueId, assignedUserId, overrideReason = null) =>
    request(`/issues/${issueId}/assign-developer`, {
      method: 'POST',
      body: JSON.stringify({ assigned_user_id: assignedUserId, override_reason: overrideReason }),
    }),

  submitAssignmentFeedback: (issueId, feedbackData) =>
    request(`/issues/${issueId}/assignment-feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    }),

  getAssignmentAnalytics: () => request('/assignment/analytics'),

  // Comments
  getComments: (issueId) => request(`/issues/${issueId}/comments`),
  addComment: (issueId, comment, isAiGenerated = false) =>
    request(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment, is_ai_generated: isAiGenerated }),
    }),

  // File Attachments
  uploadAttachment: (issueId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/issues/${issueId}/attachments`, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },

  getAttachments: (issueId) => request(`/issues/${issueId}/attachments`),

  // Milestones
  getMilestones: (projectId) => request(projectId ? `/milestones?project_id=${projectId}` : '/milestones'),
  createMilestone: (data) =>
    request('/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Timesheets & Timers
  getTimeEntries: (issueId) => request(issueId ? `/time/entries?issue_id=${issueId}` : '/time/entries'),
  startTimeEntry: (issueId) => request(`/time/start/${issueId}`, { method: 'POST' }),
  pauseTimeEntry: (issueId, note) => request(`/time/pause/${issueId}`, { method: 'POST', body: JSON.stringify({ note }) }),
  stopTimeEntry: (issueId, note) => request(`/time/stop/${issueId}`, { method: 'POST', body: JSON.stringify({ note }) }),

  // SLA Management
  getSLAPolicies: () => request('/sla/policies'),
  createSLAPolicy: (data) =>
    request('/sla/policies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Automation Engine
  getAutomationRules: () => request('/automation/rules'),
  createAutomationRule: (data) =>
    request('/automation/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Documents Hub
  getDocuments: (projectId) => request(projectId ? `/documents?project_id=${projectId}` : '/documents'),
  createDocument: (formData) =>
    request('/documents', {
      method: 'POST',
      body: formData,
      isFormData: true,
    }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: () =>
    request('/notifications/read-all', {
      method: 'PUT',
    }),

  // Labels / Tags
  getLabels: () => request('/labels'),
  createLabel: (data) =>
    request('/labels', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Activity Audit Log Export CSV
  getIssueActivityLog: (issueId) => request(`/issues/${issueId}/activity`),
  exportAuditCSV: async () => {
    const token = localStorage.getItem('bugflow_token');
    try {
      const response = await fetch('/api/activity/export-csv', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Export failed with HTTP status ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bugflow_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Audit CSV Export failed: " + err.message);
    }
  },

  // Dashboard & Metrics
  getDashboardStats: () => request('/dashboard/statistics'),
  getWorkloadHeatmap: () => request('/dashboard/workload-heatmap'),
  getGamificationBadges: () => request('/dashboard/gamification'),

  // AI Services
  generateAIBugReport: (userPrompt, projectName) =>
    request('/ai/generate-report', {
      method: 'POST',
      body: JSON.stringify({ user_prompt: userPrompt, project_name: projectName }),
    }),

  predictAISeverity: (title, description) =>
    request('/ai/predict-severity', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),

  checkDuplicates: (title, description, projectId) =>
    request('/ai/check-duplicates', {
      method: 'POST',
      body: JSON.stringify({ title, description, project_id: projectId }),
    }),

  suggestCodeFix: (title, description) =>
    request('/ai/suggest-fix', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),

  autoTagIssue: (title, description) =>
    request('/ai/auto-tag', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),

  analyzeLogFile: (logText) =>
    request('/ai/analyze-log', {
      method: 'POST',
      body: JSON.stringify({ log_text: logText }),
    }),

  predictResolutionTime: (title, description) =>
    request('/ai/predict-resolution-time', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),

  refineDefect: (title, description) =>
    request('/ai/refine-defect', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),

  analyzeScreenshot: (filename) =>
    request('/ai/analyze-screenshot', {
      method: 'POST',
      body: JSON.stringify({ filename }),
    }),

  analyzeSentiment: (description) =>
    request('/ai/analyze-sentiment', {
      method: 'POST',
      body: JSON.stringify({ description }),
    }),

  // Milestone 4: Security, Performance & Advanced Intelligence
  runSecurityAudit: () => request('/security/audit', { method: 'POST' }),
  getSecurityFindings: () => request('/security/findings'),
  getSecurityAnomalies: () => request('/security/anomalies'),
  checkSensitiveData: (content) => request('/security/sensitive-data/check', { method: 'POST', body: JSON.stringify({ content }) }),

  getPerformanceReport: () => request('/performance/report'),
  getPerformanceQueries: () => request('/performance/queries'),

  getDefectFingerprint: (id) => request(`/intelligence/fingerprint/${id}`),
  getRecurrenceRisk: (id) => request(`/intelligence/recurrence-risk/${id}`),
  getBugFamilyTree: (id) => request(`/intelligence/family-tree/${id}`),
  getInvestigationWorkspace: (id) => request(`/intelligence/investigation/${id}`),
  addHypothesis: (id, hypothesis) => request(`/intelligence/investigation/${id}/hypothesis`, { method: 'POST', body: JSON.stringify({ hypothesis }) }),
  addVerificationTestCase: (id, testCase) => request(`/intelligence/investigation/${id}/verification-test`, { method: 'POST', body: JSON.stringify(testCase) }),
  getFixVerificationPlan: (id) => request(`/intelligence/verification-plan/${id}`),
  getDefectQualityScore: (id) => request(`/intelligence/quality-score/${id}`),
  getDefectForecast: () => request('/intelligence/forecast'),
  getHotspots: () => request('/intelligence/hotspots'),
  getTechDebtRadar: () => request('/intelligence/tech-debt-radar'),
  runWhatIfSimulation: (payload) => request('/intelligence/what-if-simulation', { method: 'POST', body: JSON.stringify(payload) }),
  generateReleaseNotes: (sprintId) => request(`/intelligence/release-notes${sprintId ? `?sprint_id=${sprintId}` : ''}`),
  getIncidents: () => request('/intelligence/incidents'),
  getDeveloperBrief: () => request('/intelligence/developer-brief'),

  // Addendum Additions:
  getMultiModeReports: () => request('/analytics/reports/multi-mode'),
  postNLReportQuery: (query) => request('/analytics/nl-query', { method: 'POST', body: JSON.stringify({ query }) }),
  getPeriodComparison: () => request('/analytics/period-compare'),
  getEstimationAccuracy: () => request('/analytics/estimation-accuracy'),
  getDefectLifecycleReplay: (id) => request(`/intelligence/lifecycle-replay/${id}`),
  getDefectOrigin: (id) => request(`/intelligence/defect-origin/${id}`),
  getAIRuleSuggestions: () => request('/intelligence/rule-suggestions'),
  getCalendarRiskSignals: () => request('/sprints/calendar/risk-signals'),
  askCalendarAI: (query) => request('/sprints/calendar/ask', { method: 'POST', body: JSON.stringify({ query }) }),
  getWorkloadScheduleConflicts: () => request('/sprints/calendar/conflicts'),
  getPredictiveSLARisk: (id) => request(`/sla/predictive-risk/${id}`),

  // Release Intelligence API Calls
  getReleaseIntelligence: (id) => request(`/releases/${id}/intelligence`),
  getReleaseEvidence: (id) => request(`/releases/${id}/evidence`),
  recalculateRelease: (id) => request(`/releases/${id}/recalculate`, { method: 'POST' }),

  // Settings Hub APIs
  getSettingsProfile: () => request('/settings/profile'),
  updateSettingsProfile: (data) => request('/settings/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changeSettingsPassword: (current_password, new_password) => request('/settings/password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) }),
  getSettingsPreferences: () => request('/settings/preferences'),
  updateSettingsPreferences: (data) => request('/settings/preferences', { method: 'PUT', body: JSON.stringify(data) }),
  getSettingsSessions: () => request('/settings/sessions'),
  revokeSettingsSession: (id) => request(`/settings/sessions/${id}`, { method: 'DELETE' }),
  revokeAllOtherSessions: () => request('/settings/sessions', { method: 'DELETE' }),
  getSettingsAPIKeys: () => request('/settings/api-keys'),
  createSettingsAPIKey: (name, expires_in_days) => request('/settings/api-keys', { method: 'POST', body: JSON.stringify({ name, expires_in_days }) }),
  revokeSettingsAPIKey: (id) => request(`/settings/api-keys/${id}`, { method: 'DELETE' }),

  getEscalationContacts: (projectId) => request(`/settings/projects/${projectId}/contacts`),
  updateEscalationContacts: (projectId, data) => request(`/settings/projects/${projectId}/contacts`, { method: 'PUT', body: JSON.stringify(data) }),
  getCustomFields: (projectId) => request(`/settings/projects/${projectId}/custom-fields`),
  createCustomField: (projectId, data) => request(`/settings/projects/${projectId}/custom-fields`, { method: 'POST', body: JSON.stringify(data) }),
  deleteCustomField: (projectId, fieldId) => request(`/settings/projects/${projectId}/custom-fields/${fieldId}`, { method: 'DELETE' }),

  getAISettings: () => request('/settings/ai'),
  updateAISettings: (data) => request('/settings/ai', { method: 'PUT', body: JSON.stringify(data) }),

  getAdminUsers: () => request('/settings/admin/users'),
  updateAdminUser: (userId, data) => request(`/settings/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSMTPSettings: () => request('/settings/admin/smtp'),
  updateSMTPSettings: (data) => request('/settings/admin/smtp', { method: 'PUT', body: JSON.stringify(data) }),
  testSMTPConnection: () => request('/settings/admin/smtp/test', { method: 'POST' }),
  getSecurityPolicies: () => request('/settings/admin/security-policies'),
  updateSecurityPolicies: (data) => request('/settings/admin/security-policies', { method: 'PUT', body: JSON.stringify(data) }),
  getSystemHealth: () => request('/settings/admin/health'),

  // Organization Detail APIs
  getOrganizationDetail: (orgId) => request(`/v1/organizations/${orgId}`),
  getOrgIssues: (orgId, params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.severity) query.append('severity', params.severity);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/v1/organizations/${orgId}/issues${queryString}`);
  },
  createOrgIssue: (orgId, issueData) => request(`/v1/organizations/${orgId}/issues`, { method: 'POST', body: JSON.stringify(issueData) }),
  getOrgMembers: (orgId) => request(`/v1/organizations/${orgId}/members`),
};


