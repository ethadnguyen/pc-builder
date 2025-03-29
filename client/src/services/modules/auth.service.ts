import { post } from '../api_client';

export const login = async (data: any) => {
  const res = await post('/auth/login', data);
  return res;
};

export const logout = async () => {
  const res = await post('/auth/logout');
  return res.data;
};

export const refreshToken = async (refreshTokenValue: string) => {
  const res = await post('/auth/refresh', { refresh_token: refreshTokenValue });
  return res;
};
