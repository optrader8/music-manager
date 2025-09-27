import axios, { AxiosError, AxiosInstance } from 'axios';

import { ApiError } from '../types/api';

const apiBaseUrl = '/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export function getAuthToken(): string | null {
  return currentToken;
}

function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>;
    const status = axiosError.response?.status;
    const message =
      (axiosError.response?.data as { detail?: string })?.detail ?? axiosError.message;

    return {
      name: 'ApiError',
      message,
      status,
      cause: axiosError,
      data: axiosError.response?.data,
      isNetworkError: !axiosError.response,
    };
  }

  return {
    name: 'ApiError',
    message: error instanceof Error ? error.message : 'Unknown error',
    status: undefined,
    cause: error instanceof Error ? error : undefined,
    data: undefined,
    isNetworkError: false,
  };
}

apiClient.interceptors.request.use((config) => {
  if (currentToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeError(error))
);

export { apiClient };
