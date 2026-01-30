import axios, { type AxiosError } from 'axios';
import { toast } from 'sonner-native';

// extend axios request config to support skipErrorToast
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean;
  }
}

// api base url from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// response interceptor - handle errors and show toasts
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const skipToast = error.config?.skipErrorToast;
    const status = error.response?.status;
    const errorMessage =
      error.response?.data?.message || error.response?.data?.error;

    // special handling for 409 conflicts (sync manager needs this)
    if (status === 409) {
      const conflictError = new Error('conflict') as any;
      conflictError.isConflict = true;
      conflictError.serverVersion = error.response?.data;
      return Promise.reject(conflictError);
    }

    // only show toasts for user-initiated actions (not background sync)
    if (!skipToast) {
      if (!error.response) {
        toast.error('Network Error', {
          description: 'Please check your internet connection',
        });
      } else {
        switch (status) {
          case 400:
            toast.error('Invalid Request', {
              description: errorMessage || 'Please check your input',
            });
            break;

          case 401:
            toast.error('Unauthorized', {
              description: errorMessage || 'Authentication required',
            });
            break;

          case 403:
            toast.error('Access Denied', {
              description: errorMessage || 'You do not have permission',
            });
            break;

          case 404:
            toast.error('Not Found', {
              description: errorMessage || 'Resource not found',
            });
            break;

          case 500:
            toast.error('Server Error', {
              description: errorMessage || 'Something went wrong on our end',
            });
            break;

          default:
            toast.error('Error', {
              description: errorMessage || 'Something went wrong',
            });
        }
      }
    }

    // reject promise so error can be handled by caller if needed
    return Promise.reject(error);
  },
);

// export axios instance as default
export default api;
