import API from './api';

export const adminAPI = {
  login: (data) => API.post('/auth/admin-login', data),
  getOverview: (days) => API.get('/admin/ai/overview', { params: { days } }),
  getLogs: (params) => API.get('/admin/ai/logs', { params }),
  getUsers: (days) => API.get('/admin/ai/users', { params: { days } }),
  getTopItems: (days) => API.get('/admin/ai/top-items', { params: { days } }),
  getAdmins: () => API.get('/admin/admins'),
  createOrPromote: (data) => API.post('/admin/admins', data),
  demote: (id) => API.patch(`/admin/admins/${id}/demote`),
  searchUsers: (q) => API.get('/admin/users/search', { params: { q } }),
  getActions: () => API.get('/admin/actions'),
};
