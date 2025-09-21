import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { AppShell, ErrorBoundary } from './components';
import { ProtectedRoute } from './routes';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MetadataPage } from './pages/MetadataPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaylistsPage } from './pages/PlaylistsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary fallback={<div>예상치 못한 오류가 발생했습니다.</div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forbidden" element={<ForbiddenPage />} />

              <Route element={<ProtectedRoute />}>
                <Route
                  path="/"
                  element={
                    <AppShell>
                      <HomePage />
                    </AppShell>
                  }
                />
                <Route
                  path="/library"
                  element={
                    <AppShell>
                      <HomePage />
                    </AppShell>
                  }
                />
                <Route
                  path="/playlists"
                  element={
                    <AppShell>
                      <PlaylistsPage />
                    </AppShell>
                  }
                />
                <Route
                  path="/metadata"
                  element={
                    <AppShell>
                      <MetadataPage />
                    </AppShell>
                  }
                />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
