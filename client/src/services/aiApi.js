import API from './api';

export const aiAPI = {
  getRecommendations: (params) => API.get('/ai/recommendations', { params }),
  getOpportunityMatches: () => API.get('/ai/match/opportunities'),
  trackClick: (data) => API.post('/ai/track', data),
  getSimilar: (type, id, params) => API.get(`/ai/similar/${type}/${id}`, { params }),
};
