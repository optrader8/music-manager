import { createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import type { AuthContextType } from '@/types';

interface RouterContext {
  auth: AuthContextType;
}

export const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: false,
      user: null,
      login: async () => {},
      logout: () => {},
      isLoading: true,
    },
  } as RouterContext,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
