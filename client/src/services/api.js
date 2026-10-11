import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Request interceptor to attach JWT token
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('innofix_token') || localStorage.getItem('innofix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle unauth gracefully
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        const store = sessionStorage.getItem('innofix_token') ? sessionStorage : localStorage;
        if (store.getItem('innofix_token')) {
          store.removeItem('innofix_token');
          store.removeItem('innofix_user');
          window.location.href = '/login?expired=true';
        }
      } else if (error.response.status === 503) {
        console.warn('Server is starting up or temporarily unavailable:', error.response.data.message);
        // We could dispatch an event here to show a global banner, but resolving with a custom error is also fine.
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  adminLogin: (data) => API.post('/auth/admin-login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  uploadAvatar: (formData) =>
    API.post('/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (data) => API.post('/auth/change-password', data),
};

export const userAPI = {
  getProfile: (usernameOrId) => API.get(`/users/profile/${usernameOrId}`),
  follow: (id) => API.post(`/users/${id}/follow`),
  unfollow: (id) => API.post(`/users/${id}/unfollow`),
  getFollowers: (id) => API.get(`/users/${id}/followers`),
  getFollowing: (id) => API.get(`/users/${id}/following`),
  toggleBookmark: (data) => API.post('/users/bookmarks/toggle', data),
  getBookmarks: () => API.get('/users/bookmarks/all'),
  getLeaderboard: (params) => API.get('/users/leaderboard', { params }),
  getMyLeaderboardPosition: (params) => API.get('/users/leaderboard/me', { params }),
  getReputationRules: () => API.get('/users/reputation/rules'),
  getMatchedStudents: (params) => API.get('/users/matched-students', { params }),
  exportData: () => API.get('/users/account/export-data'),
  deleteAccount: () => API.delete('/users/account'),
};

export const messageAPI = {
  getConversations: () => API.get('/messages/conversations'),
  getOrCreateConversation: (recipientId) => API.post('/messages/conversations', { recipientId }),
  getMessages: (conversationId, params) => API.get(`/messages/${conversationId}`, { params }),
  sendMessage: (data) => API.post('/messages', data),
};

export const notificationAPI = {
  getAll: (params) => API.get('/notifications', { params }),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAllAsRead: () => API.put('/notifications/read-all'),
};

export const searchAPI = {
  search: (q, type = 'all', limit = 10) => API.get('/search', { params: { q, type, limit } }),
};

export const postAPI = {
  getAll: (params) => API.get('/posts', { params }),
  create: (formDataOrData) => {
    if (formDataOrData instanceof FormData) {
      return API.post('/posts', formDataOrData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return API.post('/posts', formDataOrData);
  },
  update: (id, data) => API.put(`/posts/${id}`, data),
  like: (id) => API.post(`/posts/${id}/like`),
  addComment: (id, data) => API.post(`/posts/${id}/comments`, data),
  delete: (id) => API.delete(`/posts/${id}`),
};

export const projectAPI = {
  getAll: (params) => API.get('/projects', { params }),
  getById: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  apply: (id, data) => API.post(`/projects/${id}/apply`, data),
  manageApp: (id, appId, data) =>
    API.put(`/projects/${id}/applications/${appId}`, data),
  addComment: (id, data) => API.post(`/projects/${id}/comments`, data),
};

export const communityAPI = {
  getAll: (params) => API.get('/communities', { params }),
  getByIdOrSlug: (idOrSlug) => API.get(`/communities/${idOrSlug}`),
  create: (data) => API.post('/communities', data),
  join: (id) => API.post(`/communities/${id}/join`),
  leave: (id) => API.post(`/communities/${id}/leave`),
};

export const eventAPI = {
  getAll: (params) => API.get('/events', { params }),
  getById: (id) => API.get(`/events/${id}`),
  create: (data) => API.post('/events', data),
  delete: (id) => API.delete(`/events/${id}`),
  register: (id) => API.post(`/events/${id}/register`),
  respondRsvp: (id, userId, status) => API.put(`/events/${id}/attendees/${userId}`, { status }),
};

export const opportunityAPI = {
  getAll: (params) => API.get('/opportunities', { params }),
  getById: (id) => API.get(`/opportunities/${id}`),
  create: (data) => API.post('/opportunities', data),
  delete: (id) => API.delete(`/opportunities/${id}`),
  apply: (id, data) => API.post(`/opportunities/${id}/apply`, data),
};

export const announcementAPI = {
  getAll: (params) => API.get('/announcements', { params }),
  create: (data) => API.post('/announcements', data),
  togglePin: (id) => API.put(`/announcements/${id}/pin`),
  delete: (id) => API.delete(`/announcements/${id}`),
};

export const aiAPI = {
  getRecommendations: (params) => API.get('/ai/recommendations', { params }),
  getPeopleYouMayKnow: (params) => API.get('/ai/people-you-may-know', { params }),
  getOpportunityMatches: () => API.get('/ai/match/opportunities'),
  getSimilar: (type, id) => API.get(`/ai/similar/${type}/${id}`),
  trackClick: (data) => API.post('/ai/track', data),
  improveBio: (data) => API.post('/ai/assistant/improve-bio', data),
  rewritePitch: (data) => API.post('/ai/assistant/rewrite-pitch', data),
  summarizeThread: (data) => API.post('/ai/assistant/summarize-thread', data),
  analyzeTeamFit: (data) => API.post('/ai/assistant/team-fit', data),
  getModerationQueue: (params) => API.get('/ai/moderation/queue', { params }),
  reviewModerationItem: (id, data) => API.put(`/ai/moderation/${id}`, data),
};

export const reportAPI = {
  create: (data) => API.post('/reports', data),
  getAll: (params) => API.get('/reports', { params }),
  resolve: (id, data) => API.put(`/reports/${id}`, data),
};

export const analyticsAPI = {
  getStats: () => API.get('/analytics'),
  getPersonalStats: () => API.get('/analytics/personal'),
};

export const adminAPI = {
  getOverview: (params) => API.get('/admin/ai/overview', { params }),
  getLogs: (params) => API.get('/admin/ai/logs', { params }),
  getUserActivity: (params) => API.get('/admin/ai/users', { params }),
  getTopItems: (params) => API.get('/admin/ai/top-items', { params }),
  getAdmins: () => API.get('/admin/admins'),
  createOrPromote: (data) => API.post('/admin/admins', data),
  demote: (id) => API.patch(`/admin/admins/${id}/demote`),
  searchUsers: (q) => API.get('/admin/users/search', { params: { q } }),
  getActions: () => API.get('/admin/actions'),
  getCommandCenter: () => API.get('/admin/command-center'),
  exportUsersCSV: () => API.get('/admin/export/users', { responseType: 'blob' }),
};

export default API;
