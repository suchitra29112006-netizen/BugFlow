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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.detail || 'An unexpected API error occurred.';
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }

  return data;
}

export const api = {
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

  // Users
  getUsers: () => request('/users'),

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
    if (params.assigned_to) query.append('assigned_to', params.assigned_to);

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

  deleteIssue: (id) =>
    request(`/issues/${id}`, {
      method: 'DELETE',
    }),

  // Comments
  getComments: (issueId) => request(`/issues/${issueId}/comments`),
  addComment: (issueId, comment) =>
    request(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
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

  // Dashboard
  getDashboardStats: () => request('/dashboard/statistics'),

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
};

