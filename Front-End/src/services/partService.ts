import { apiRequest } from './apiClient';

export const partService = {
  getAll: () => apiRequest('/parts'),
  getById: (id: string) => apiRequest(`/parts/${id}`),
};
