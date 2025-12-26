import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore, getDecodedToken } from '../store/auth.store';
import { rateLimiter } from '../utils/advancedRateLimit';


interface ImportMeta {
  env: {
    VITE_API_URL: string;
  };
}

const API_URL = (import.meta as ImportMeta).env.VITE_API_URL || 'https://sahtee.evra-co.com';

const DEFAULT_ERROR_MESSAGE = 'حدث خطأ غير متوقع. حاول مرة أخرى.';
const NETWORK_ERROR_MESSAGE = 'تعذر الاتصال بالخادم. تحقق من اتصال الانترنت وحاول مرة أخرى.';
const TIMEOUT_ERROR_MESSAGE = 'انتهت مهلة الاتصال بالخادم. حاول مجدداً بعد لحظات.';

type RetriableConfig = AxiosRequestConfig & {
  _retry?: boolean;
  _retryCount?: number;
};

const extractMessage = (payload: unknown): string => {
  if (!payload) return DEFAULT_ERROR_MESSAGE;
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.error === 'string') return record.error;
  }
  return DEFAULT_ERROR_MESSAGE;
};


const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 300,
});


const authApi = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 300,
});


api.interceptors.request.use(
  (config) => {
    const endpoint = config.url || '';
    if (!rateLimiter.checkEndpointLimit(endpoint)) {
      return Promise.reject(new Error('Rate limit exceeded'));
    }

    const stateToken = useAuthStore.getState().token;
    const token = stateToken || getDecodedToken();

    config.headers = config.headers ?? {};
    config.headers.Accept = config.headers.Accept ?? 'application/json';

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = (config.method || 'get').toLowerCase();
    const hasExplicitContentType =
      !!config.headers['Content-Type'] || !!config.headers['content-type'];
    const payload = config.data;
    const shouldAttachJson =
      ['post', 'put', 'patch'].includes(method) &&
      !hasExplicitContentType &&
      payload &&
      typeof payload === 'object' &&
      !(payload instanceof FormData) &&
      !(payload instanceof URLSearchParams) &&
      !(payload instanceof Blob);

    if (shouldAttachJson) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
      return Promise.reject({
        ...error,
        message: NETWORK_ERROR_MESSAGE,
      });
    }

    if (error.code === 'ECONNABORTED') {
      if (config && !config._retry) {
        config._retry = true;
        config._retryCount = 1;
      } else if (config && (config._retryCount ?? 0) < 3) {
        config._retryCount = (config._retryCount ?? 0) + 1;
      } else {
        return Promise.reject({
          ...error,
          message: TIMEOUT_ERROR_MESSAGE,
        });
      }

      const delay = Math.min(1000 * Math.pow(2, (config._retryCount ?? 1) - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config!);
    }

    const { response } = error;
    if (!response) {
      return Promise.reject({
        ...error,
        message: error.message || DEFAULT_ERROR_MESSAGE,
      });
    }

    const { status, data } = response;
    const message = extractMessage(data);

    if (status === 401) {
      useAuthStore.getState().logout();
    }

    if (status === 403 && config && !config._retry) {
      config._retry = true;
      config._retryCount = 1;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return api(config);
    }

    return Promise.reject({
      ...error,
      message,
      status,
    });
  }
);


authApi.interceptors.request.use(
  (config) => {
    const stateToken = useAuthStore.getState().token;
    const token = stateToken || getDecodedToken();

    config.headers = config.headers ?? {};
    config.headers.Accept = config.headers.Accept ?? 'application/json';

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = (config.method || 'get').toLowerCase();
    const hasExplicitContentType =
      !!config.headers['Content-Type'] || !!config.headers['content-type'];
    const payload = config.data;
    const shouldAttachJson =
      ['post', 'put', 'patch'].includes(method) &&
      !hasExplicitContentType &&
      payload &&
      typeof payload === 'object' &&
      !(payload instanceof FormData) &&
      !(payload instanceof URLSearchParams) &&
      !(payload instanceof Blob);

    if (shouldAttachJson) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

authApi.interceptors.response.use(
  (response) => {
    if (response.status >= 200 && response.status < 300) {
      if (!response.data && response.config.method !== 'head') {
        
      }
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
      return Promise.reject({
        ...error,
        message: NETWORK_ERROR_MESSAGE,
      });
    }

    if (error.code === 'ECONNABORTED') {
      if (config && !config._retry) {
        config._retry = true;
        config._retryCount = 1;
      } else if (config && (config._retryCount ?? 0) < 3) {
        config._retryCount = (config._retryCount ?? 0) + 1;
      } else {
        return Promise.reject({
          ...error,
          message: TIMEOUT_ERROR_MESSAGE,
        });
      }

      const delay = Math.min(1000 * Math.pow(2, (config._retryCount ?? 1) - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return authApi(config!);
    }

    const { response } = error;
    if (!response) {
      return Promise.reject({
        ...error,
        message: error.message || DEFAULT_ERROR_MESSAGE,
      });
    }

    const { status, data } = response;
    const message = extractMessage(data);

    if (status === 401) {
      useAuthStore.getState().logout();
    }

    if (status === 403 && config && !config._retry) {
      config._retry = true;
      config._retryCount = 1;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return authApi(config);
    }

    return Promise.reject({
      ...error,
      message,
      status,
    });
  }
);

export { api, authApi };
export default api; 