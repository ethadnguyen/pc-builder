import { post } from '../api_client';
import { AdminUserRes } from '../types/response/auth.res';
import { CustomAxiosResponse } from '@/common/interface/axios';

export type AdminUser = AdminUserRes;

export interface AuthPayload {
  token_id: string;
  user_id: string;
  roles: string[];
  permissions: string[];
  user_name: string;
  is_admin_session?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  payload: AuthPayload;
}

export const login = async (credentials: {
  email: string;
  password: string;
}): Promise<CustomAxiosResponse> => {
  return await post('/auth/admin/login', credentials);
};

export const refreshToken = async (
  token: string
): Promise<CustomAxiosResponse> => {
  return await post('/auth/refresh', { refresh_token: token });
};

export const logout = async () => {
  return await post('/auth/logout');
};
