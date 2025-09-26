import React from 'react';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { router } from './router';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { AuthProvider } from './context/AuthContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Create router with auth context
const authContext = {
  isAuthenticated: true, // Dev mode
  user: { id: 'dev-user', email: 'dev@test.com', name: 'Dev User' },
  login: async () => {},
  logout: () => {},
  isLoading: false,
};

const appRouter = createRouter({
  ...router.options,
  context: {
    auth: authContext,
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AudioPlayerProvider>
          <RouterProvider router={appRouter} />
          <ReactQueryDevtools initialIsOpen={false} />
        </AudioPlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
