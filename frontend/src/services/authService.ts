import { apiClient } from "./apiClient";

import type { ApiError, AuthCredentials, AuthSession, AuthUser } from "../types";

const demoUser: AuthUser = {
  id: "demo-user",
  email: "demo@music-manager.local",
  displayName: "Demo Admin",
  roles: ["admin", "editor"],
  avatarUrl: "https://www.gravatar.com/avatar/?d=identicon",
};

async function postSignIn(credentials: AuthCredentials): Promise<AuthSession> {
  const response = await apiClient.post<AuthSession>("/auth/login", credentials);
  return response.data;
}

async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>("/auth/me");
  return response.data;
}

function shouldUseMock(error: ApiError): boolean {
  if (!import.meta.env.DEV) {
    return false;
  }

  if (error.isNetworkError || error.status === undefined) {
    return true;
  }

  if ([404, 501].includes(error.status ?? 0)) {
    return true;
  }

  return false;
}

async function signIn(credentials: AuthCredentials): Promise<AuthSession> {
  try {
    return await postSignIn(credentials);
  } catch (error) {
    const apiError = error as ApiError;
    if (shouldUseMock(apiError)) {
      return {
        token: "mock-demo-token",
        user: demoUser,
      };
    }
    throw apiError;
  }
}

async function signOut(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    const apiError = error as ApiError;
    if (!shouldUseMock(apiError)) {
      throw apiError;
    }
  }
}

async function fetchCurrentUser(): Promise<AuthUser> {
  try {
    return await getCurrentUser();
  } catch (error) {
    const apiError = error as ApiError;
    if (shouldUseMock(apiError)) {
      return demoUser;
    }
    throw apiError;
  }
}

export const authService = {
  signIn,
  signOut,
  fetchCurrentUser,
};
