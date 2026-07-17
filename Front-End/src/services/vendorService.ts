import { apiRequest } from './apiClient';

export const vendorService = {
  getAll: () => apiRequest('/vendors'),
  getById: (id: string) => apiRequest(`/vendors/${id}`),
};
