import { accessToken, refreshToken } from '@/constants';
import { setCookie, deleteCookie } from 'cookies-next';

export const setTokens = (access_token: string, refresh_token: string) => {
  setCookie(accessToken, access_token, {
    path: '/',
    maxAge: 3600,
  });

  setCookie(refreshToken, refresh_token, {
    path: '/',
    maxAge: 2592000,
  });
};

export const removeTokens = () => {
  deleteCookie(accessToken, { path: '/' });

  deleteCookie(refreshToken, { path: '/' });
};
