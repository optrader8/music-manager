import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import type { AuthContextType } from "@/types";

interface RouterContext {
  auth: AuthContextType;
}

export const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: true, // Dev mode
      user: { id: "dev-user", email: "dev@test.com", name: "Dev User" },
      login: async () => {},
      logout: () => {},
      isLoading: false,
    },
  } as RouterContext,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
