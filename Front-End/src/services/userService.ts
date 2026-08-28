import { apiRequest } from './apiClient';

export interface UserPayload {
  id?: string;
  name: string;
  npk: number;
  email?: string;
  role?: string;
  roles?: string[];
  status?: string;
}

export const userService = {
  getAll: () => apiRequest('/users'),
  getRoles: () => apiRequest('/users/roles'),
  getById: (id: string) => apiRequest(`/users/${id}`),
  create: (data: UserPayload) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<UserPayload>) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
