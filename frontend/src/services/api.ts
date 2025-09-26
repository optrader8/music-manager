import axios, { AxiosError, AxiosResponse } from 'axios';
import type { ReceiptsResponse, ImportResult } from '@/types/receipts';
import type {
  Receipt,
  ReceiptCreate,
  ReceiptUpdate,
  MonthlyStats,
  OCRResult,
  TrendData,
} from '@/types/receipt';
import type { User, UserCreate, LoginCredentials } from '@/types/user';

// API 베이스 URL 설정
// VITE_API_URL 환경 변수를 우선적으로 사용하고, 없으면 http://localhost:7000/api를 기본값으로 사용
const API_BASE_URL = process.env.API_BASE_URL;

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // OCR 처리 시간 고려
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 요청 인터셉터: 모든 요청에 JWT 토큰을 포함시킵니다.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      // 헤더에 Bearer 토큰 추가
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 Unauthorized 오류 발생 시 처리
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패 시 로컬 스토리지 정리
      localStorage.removeItem('access_token');
      // 필요 시 로그인 페이지로 리디렉션
      // window.location.href = '/login';
    }
    console.error('API 오류:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 인증 API
export const authAPI = {
  login: async (
    credentials: LoginCredentials
  ): Promise<{ access_token: string; token_type: string }> => {
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password || '');

    const response = await api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  signup: async (userData: UserCreate): Promise<User> => {
    const response = await api.post<User>('/auth/signup', userData);
    return response.data;
  },
};

// 영수증 및 대시보드 API
export const receiptAPI = {
  // 영수증 업로드 및 OCR 처리
  upload: async (file: File): Promise<{ receipt: Receipt; ocr_result: OCRResult }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/receipts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // 영수증 목록 조회
  getReceipts: async (month?: string): Promise<ReceiptsResponse> => {
    const params = month ? { month } : {};
    const response = await api.get<ReceiptsResponse>('/receipts/', { params });
    return response.data;
  },

  // 영수증 상세 조회
  getReceipt: async (id: number): Promise<Receipt> => {
    const response = await api.get(`/receipts/${id}`);
    return response.data;
  },

  // 영수증 수정
  updateReceipt: async (id: number, data: ReceiptUpdate): Promise<Receipt> => {
    const response = await api.put(`/receipts/${id}`, data);
    return response.data;
  },

  // 영수증 삭제
  deleteReceipt: async (id: number): Promise<void> => {
    await api.delete(`/receipts/${id}`);
  },

  // 새 영수증 생성
  createReceipt: async (data: ReceiptCreate): Promise<Receipt> => {
    const response = await api.post<Receipt>('/receipts/', data);
    return response.data;
  },

  // 월별 통계
  getMonthlyStats: async (month: string): Promise<MonthlyStats> => {
    const response = await api.get(`/dashboard/monthly-stats`, {
      params: { month },
    });
    return response.data;
  },

  // 트렌드 데이터
  getTrends: async (): Promise<TrendData[]> => {
    const response = await api.get(`/dashboard/trends`);
    return response.data;
  },

  // CSV 내보내기
  exportCSV: async (month: string): Promise<Blob> => {
    const response = await api.get(`/receipts/export-csv`, {
      params: { month },
      responseType: 'blob',
    });
    return response.data;
  },

  // CSV 가져오기
  importCSV: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ImportResult>('/receipts/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // 월별 목록 조회
  getAvailableMonths: async (): Promise<string[]> => {
    const response = await api.get('/receipts/months');
    return response.data;
  },
};

export default api;
