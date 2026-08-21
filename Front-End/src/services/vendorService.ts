import { apiRequest } from './apiClient';

export interface VendorPayload {
  id?: string;
  vendorCode: string;
  vendorName: string;
  email?: string;
  status?: string;
}

export const vendorService = {
  getAll: () => apiRequest('/vendors'),
  getById: (id: string) => apiRequest(`/vendors/${id}`),
  create: (data: VendorPayload) => apiRequest('/vendors', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<VendorPayload>) => apiRequest(`/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
