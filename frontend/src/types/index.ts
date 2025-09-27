export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  active?: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (data: LoginFormData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface HeaderProps {
  user?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export interface SidebarProps {
  navigationItems: NavigationItem[];
  onNavigate?: (itemId: string) => void;
}

export interface ContentProps {
  onLogin?: (data: LoginFormData) => void;
  onSignUp?: () => void;
  isLoading?: boolean;
}

// Additional types that were missing
export interface ApiError {
  name: 'ApiError';
  message: string;
  status?: number;
  cause?: unknown;
  data?: unknown;
  isNetworkError: boolean;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: UserData) => Promise<void>;
  signIn: (credentials: AuthCredentials) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<User | null>;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: ApiError | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  expiresAt?: Date;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
}

export interface UserData {
  email: string;
  password: string;
  name?: string;
}
