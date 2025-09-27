import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Layout } from '@/components/Layout/Layout';

// Pages
import Dashboard from '@/pages/Dashboard';
import Statistics from '@/pages/Statistics';
import { MusicListPage } from '@/pages/MusicListPage';
import Albums from '@/pages/Albums';
import AlbumDetail from '@/pages/AlbumDetail';
import FileBrowserPage from '@/pages/FileBrowserPage';

// Temporary Server Page (will implement later)
const ServerPage = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">Server</h1>
    <p>Server management page - Coming soon</p>
  </div>
);

// Create a client - HMR Test
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/server" element={<ServerPage />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/files" element={<FileBrowserPage />} />
            <Route path="/albums" element={<Albums />} />
            <Route path="/albums/:albumId" element={<AlbumDetail />} />
            <Route path="/music/list" element={<MusicListPage />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
