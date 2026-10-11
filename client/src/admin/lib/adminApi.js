import API from '../../services/api';

export const adminAPI = {
  // Command Center (Overview & KPIs)
  getCommandCenter: (params) => API.get('/admin/command-center', { params }),

  // AI & Recommendation Analytics
  getAIOverview: (params) => API.get('/admin/ai/overview', { params }),
  getAILogs: (params) => API.get('/admin/ai/logs', { params }),
  getAIUserActivity: (params) => API.get('/admin/ai/users', { params }),
  getAITopItems: (params) => API.get('/admin/ai/top-items', { params }),

  // Users Management
  getUsers: (params) => API.get('/admin/users', { params }),
  getUserDetails: (id) => API.get(`/admin/users/${id}`),
  updateUserRole: (id, data) => API.patch(`/admin/users/${id}/role`, data),
  updateUserStatus: (id, data) => API.patch(`/admin/users/${id}/status`, data),
  verifyCompany: (id, data) => API.patch(`/admin/users/${id}/verify`, data),
  adjustReputation: (id, data) => API.post(`/admin/users/${id}/reputation`, data),
  searchUsersForPromotion: (q) => API.get('/admin/users/search', { params: { q } }),
  
  // Reports & Moderation
  getReports: (params) => API.get('/admin/reports', { params }),
  resolveReport: (id, data) => API.patch(`/admin/reports/${id}/resolve`, data),
  dismissReport: (id, data) => API.patch(`/admin/reports/${id}/dismiss`, data),

  // Admins & Actions Audit
  getAdmins: () => API.get('/admin/admins'),
  createOrPromote: (data) => API.post('/admin/admins', data),
  demote: (id) => API.patch(`/admin/admins/${id}/demote`),
  getActions: (params) => API.get('/admin/actions', { params }),

  // System & Health
  getSystemHealth: () => API.get('/admin/system'),

  // Data Export
  exportUsersCSV: () => API.get('/admin/export/users', { responseType: 'blob' }),
  exportReportsCSV: () => API.get('/admin/export/reports', { responseType: 'blob' }),
  exportActionsCSV: () => API.get('/admin/export/actions', { responseType: 'blob' }),
};
