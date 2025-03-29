import { CustomAxiosResponse } from '@/common/interface/axios';
import { errorMessage } from '@/common/message';
import { getCookie, setCookie } from 'cookies-next';

import axios from 'axios';
import { accessToken, refreshToken } from '@/constants';
import { refreshToken as refreshTokenApi } from './modules/auth.service';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm log để kiểm tra
console.log('BaseURL:', process.env.NEXT_PUBLIC_BASE_URL);

// Biến để theo dõi nếu refresh token đang được xử lý
let isRefreshing = false;
// Mảng chứa các request đang chờ xử lý
let failedQueue = [];

// Xử lý các request đang chờ
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.request.use(
  async (config) => {
    const token = getCookie(accessToken);

    if (typeof token === 'string' && token.length > 0) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log('Axios token:', token);
    return config;
  },
  (error) => {
    console.log('get axios error');
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshTokenValue = getCookie(refreshToken);

        if (!refreshTokenValue) {
          processQueue(new Error('No refresh token'), null);
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await refreshTokenApi(refreshTokenValue as string);
        const { access_token, refresh_token } = response.data;

        setCookie(accessToken, access_token);
        setCookie(refreshToken, refresh_token);

        apiClient.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        processQueue(null, access_token);

        return apiClient(originalRequest);
      } catch (err) {
        // Xử lý lỗi refresh token
        processQueue(err, null);

        // Nếu refresh token không hợp lệ, đăng xuất người dùng
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const get = (
  url: string,
  params: any = {}
): Promise<CustomAxiosResponse> => {
  return new Promise((resolve, reject) => {
    apiClient.get(url, { params }).then(
      (res: CustomAxiosResponse) => {
        resolve(res);
      },
      (err) => {
        console.log(err.response?.data);
        errorMessage(err.response?.data || 'something went wrong');
        reject(new Error(err));
      }
    );
  });
};

export const post = (
  url: string,
  data: any = {}
): Promise<CustomAxiosResponse> => {
  return new Promise((resolve, reject) => {
    apiClient.post(url, data).then(
      (res: CustomAxiosResponse) => {
        resolve(res);
      },
      (err) => {
        console.log(err.response?.data);
        errorMessage(err.response?.data || 'something went wrong');
        reject(new Error(err));
      }
    );
  });
};

export const put = (
  url: string,
  data: any = {}
): Promise<CustomAxiosResponse> => {
  return new Promise((resolve, reject) => {
    apiClient.put(url, data).then(
      (res: CustomAxiosResponse) => {
        resolve(res);
      },
      (err) => {
        console.log(err.response?.data);
        errorMessage(err.response?.data || 'something went wrong');
        reject(new Error(err));
      }
    );
  });
};

export const patch = (
  url: string,
  data: any = {}
): Promise<CustomAxiosResponse> => {
  return new Promise((resolve, reject) => {
    apiClient.patch(url, data).then(
      (res: CustomAxiosResponse) => {
        resolve(res);
      },
      (err) => {
        errorMessage(err.response?.data || 'something went wrong');
        reject(new Error(err));
      }
    );
  });
};

export const del = (url: string, params: any = {}) => {
  return new Promise((resolve, reject) => {
    apiClient.delete(url, { params }).then(
      (res: CustomAxiosResponse) => {
        resolve(res);
      },
      (err) => {
        errorMessage(err.response?.data || 'something went wrong');
        reject(new Error(err));
      }
    );
  });
};

export const postFormData = (
  url: string,
  formData: FormData
): Promise<CustomAxiosResponse> => {
  return new Promise((resolve, reject) => {
    apiClient
      .post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(
        (res: CustomAxiosResponse) => {
          resolve(res);
        },
        (err) => {
          errorMessage(err.response?.data.msg || 'something went wrong');
          reject(new Error(err));
        }
      );
  });
};

export default apiClient;
