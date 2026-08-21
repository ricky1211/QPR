import { apiRequest } from './apiClient';

export interface PartPayload {
  id?: string;
  partNumber: string;
  partDesc: string;
  allowanceRatio?: number | null;
  status?: string;
  supplierId?: string;
}

export const partService = {
  getAll: () => apiRequest('/parts'),
  getById: (id: string) => apiRequest(`/parts/${id}`),
  create: (data: PartPayload) => apiRequest('/parts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<PartPayload>) => apiRequest(`/parts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
