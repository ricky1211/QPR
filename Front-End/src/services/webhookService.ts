import { apiRequest } from './apiClient';

export const webhookService = {
  syncAll: () => apiRequest('/webhooks/sync/all', { method: 'POST' }),
  syncVendors: () => apiRequest('/webhooks/sync/vendors', { method: 'POST' }),
  syncParts: () => apiRequest('/webhooks/sync/parts', { method: 'POST' }),
};
