import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRes } from '@/services/types/response/user_types/user.res';
import { login } from '@/services/modules/auth.service';
import { getUserById, createUser } from '@/services/modules/user.service';
import { setTokens as setCookieTokens, removeTokens } from '@/lib/cookies';
import { getCookie } from 'cookies-next';
import { accessToken, refreshToken } from '@/constants';
import { jwtDecode } from 'jwt-decode';
import { refreshToken as refreshTokenApi } from '@/services/modules/auth.service';

interface UserStore {
  user: UserRes | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone: string;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
  refreshAuth: () => Promise<boolean>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (userData: any) => void;
}

interface JwtPayload {
  user_id: string;
  exp: number;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      setTokens: (accessTokenValue, refreshTokenValue) => {
        setCookieTokens(accessTokenValue, refreshTokenValue);
        set({ isAuthenticated: true });
      },

      setUser: (userData) => {
        set({
          user: userData,
          isAuthenticated: true,
        });
      },

      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const { data: response } = await login({ email, password });

          setCookieTokens(response.access_token, response.refresh_token);

          const userInfo = await getUserById(Number(response.payload.user_id));
          set({ user: userInfo, loading: false, isAuthenticated: true });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Đăng nhập thất bại',
            loading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        try {
          set({ loading: true, error: null });

          await createUser(data);

          const { data: response } = await login({
            email: data.email,
            password: data.password,
          });

          setCookieTokens(response.access_token, response.refresh_token);

          const userInfo = await getUserById(Number(response.payload.user_id));
          set({ user: userInfo, loading: false, isAuthenticated: true });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Đăng ký thất bại',
            loading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: () => {
        removeTokens();

        set({
          user: null,
          error: null,
          isAuthenticated: false,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      refreshAuth: async () => {
        try {
          const refreshTokenValue = getCookie(refreshToken);

          if (!refreshTokenValue) {
            set({ isAuthenticated: false, user: null });
            return false;
          }

          const { data: response } = await refreshTokenApi(
            refreshTokenValue as string
          );

          setCookieTokens(response.access_token, response.refresh_token);

          if (!get().user) {
            const decoded = jwtDecode<JwtPayload>(response.access_token);
            const userInfo = await getUserById(Number(decoded.user_id));
            set({ user: userInfo, isAuthenticated: true });
          } else {
            set({ isAuthenticated: true });
          }

          return true;
        } catch {
          set({ isAuthenticated: false });
          removeTokens();
          return false;
        }
      },

      checkAuth: async () => {
        try {
          const token = getCookie(accessToken);

          if (!token) {
            set({ isAuthenticated: false, user: null });
            return false;
          }

          try {
            const decoded = jwtDecode<JwtPayload>(token as string);
            const currentTime = Date.now() / 1000;

            if (decoded.exp < currentTime) {
              return await get().refreshAuth();
            }

            if (!get().user) {
              const userInfo = await getUserById(Number(decoded.user_id));
              set({ user: userInfo, isAuthenticated: true });
            } else {
              set({ isAuthenticated: true });
            }

            return true;
          } catch {
            return await get().refreshAuth();
          }
        } catch {
          set({ isAuthenticated: false, user: null });
          return false;
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
