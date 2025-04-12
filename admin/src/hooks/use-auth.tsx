'use client';

import {
  AdminUser,
  login,
  logout,
  refreshToken,
} from '@/services/modules/auth.service';
import { accessToken, refreshToken as refreshTokenKey } from '@/constants';
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  checkPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initAuth = async () => {
      try {
        const token = getCookie(accessToken);
        const refreshTokenCookie = getCookie(refreshTokenKey);

        console.log('Auth init - token exist:', !!token);

        if (!token || !refreshTokenCookie) {
          console.log('Auth init - no token, setting loading to false');
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const response = await refreshToken(refreshTokenCookie as string);
          const {
            access_token: newToken,
            refresh_token: newRefreshToken,
            payload,
          } = response.data;

          if (!payload) {
            console.error(
              'Auth init - refresh token response missing payload data'
            );
            deleteCookie(accessToken);
            deleteCookie(refreshTokenKey);
            setUser(null);
          } else {
            const userData: AdminUser = {
              id: Number(payload.user_id),
              email: '',
              user_name: payload.user_name,
              permissions: payload.permissions.map((p: string) => ({
                id: 0,
                name: p,
                description: '',
                created_at: '',
                updated_at: '',
              })),
              role: {
                name: payload.roles.length > 0 ? payload.roles[0] : '',
                description: '',
                permissions: [],
                created_at: '',
                updated_at: '',
              },
            };

            setCookie(accessToken, newToken);
            setCookie(refreshTokenKey, newRefreshToken);
            setUser(userData);
            console.log('Auth init - user authenticated:', userData.user_name);
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          deleteCookie(accessToken);
          deleteCookie(refreshTokenKey);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [mounted]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await login({ email, password });

      const {
        access_token: token,
        refresh_token: refToken,
        payload,
      } = response.data;

      if (!payload) {
        throw new Error('Login response missing payload data');
      }

      const userData: AdminUser = {
        id: Number(payload.user_id),
        email: '',
        user_name: payload.user_name,
        permissions: payload.permissions.map((p: string) => ({
          id: 0,
          name: p,
          description: '',
          created_at: '',
          updated_at: '',
        })),
        role: {
          name: payload.roles.length > 0 ? payload.roles[0] : '',
          description: '',
          permissions: [],
          created_at: '',
          updated_at: '',
        },
      };

      setCookie(accessToken, token);
      setCookie(refreshTokenKey, refToken);

      setUser(userData);
      console.log('Login successful for user:', userData.user_name);

      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      deleteCookie(accessToken);
      deleteCookie(refreshTokenKey);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = (permission: string) => {
    if (!user) return false;
    return user.permissions.some((p) => p.name === permission);
  };

  const isAdmin = () => {
    if (!user) return false;
    return user.role.name === 'ADMIN';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login: handleLogin,
        logout: handleLogout,
        loading,
        checkPermission,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
